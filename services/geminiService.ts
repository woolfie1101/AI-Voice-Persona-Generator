import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VoiceAnalysisResult, ArtStyle, SpouseAnalysisResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Start of Diversity Enhancement Logic ---

const DIVERSE_ETHNICITIES = [
    'East Asian', 'Black', 'Hispanic', 'South Asian', 'Middle Eastern', 'Southeast Asian', 'White', 'of mixed ethnicity', 'Native American'
];

const ETHNICITY_KEYWORDS = [
    'asian', 'black', 'white', 'caucasian', 'hispanic', 'latino', 'latina',
    'middle eastern', 'indian', 'african', 'european', 'arab', 'persian',
    'korean', 'japanese', 'chinese', 'filipino', 'vietnamese', 'thai',
    'native american', 'indigenous'
];

/**
 * Checks a user's description for ethnicity keywords. If none are found,
 * it returns a string with a randomly selected ethnicity to append to a prompt.
 * @param userDescription The text profile from the user's speech.
 * @returns A string to be added to the prompt (e.g., ", who is Black") or an empty string.
 */
function getRandomEthnicity(userDescription: string): string {
    const descriptionLower = userDescription.toLowerCase();
    const specifiesEthnicity = ETHNICITY_KEYWORDS.some(keyword => descriptionLower.includes(keyword));

    if (specifiesEthnicity) {
        return ''; // User specified, so we don't add anything.
    }

    // User did not specify, pick one at random.
    const randomIndex = Math.floor(Math.random() * DIVERSE_ETHNICITIES.length);
    const randomEthnicity = DIVERSE_ETHNICITIES[randomIndex];
    return `, who is ${randomEthnicity}`;
}

// --- End of Diversity Enhancement Logic ---

export async function analyzeVoice(audioBase64: string, mimeType: string): Promise<VoiceAnalysisResult> {
    try {
        const audioPart = {
            inlineData: {
                data: audioBase64,
                mimeType: mimeType,
            },
        };

        const prompt = `
            Analyze the user's self-introduction in the provided audio.
            Based on BOTH the spoken content and the vocal tone, perform the following tasks and return the result as a single JSON object.

            1.  **characterProfile**: Summarize the user's introduction into a descriptive paragraph. Capture their personality, stated traits (age, gender, job, hobbies), appearance, and any other unique details they mention. This should be a rich, descriptive summary.
            2.  **vocalCharacteristics**: Provide an array of keywords describing the voice itself (e.g., "energetic", "calm", "warm", "high-pitched", "deep", "melodious", "fast-paced").
            3.  **isProfileRich**: Evaluate the spoken content. If the user provided multiple details (like age, job, personality, hobbies, etc.), return \`true\`. If the introduction was very short, generic, or lacked specific details (e.g., just "hello, this is a test"), return \`false\`.

            Do not add any commentary before or after the JSON object.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: prompt }, audioPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        characterProfile: { type: Type.STRING },
                        vocalCharacteristics: { type: Type.ARRAY, items: { type: Type.STRING } },
                        isProfileRich: { type: Type.BOOLEAN },
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as VoiceAnalysisResult;

    } catch (error) {
        console.error("Error analyzing voice with Gemini:", error);
        throw new Error("Failed to analyze voice. Please try again.");
    }
}

function constructCharacterDescription(analysis: VoiceAnalysisResult): string {
    if (analysis.isProfileRich) {
        // Text is rich, use it as the primary driver.
        return analysis.characterProfile;
    }
    // Text is poor, use vocal characteristics as the primary driver.
    return `A character whose personality and vibe is based on their voice, which is ${analysis.vocalCharacteristics.join(', ')}. The user's speech was brief, so focus on the feeling of the voice. For context, they also said: "${analysis.characterProfile}".`;
}

function constructImagePrompt(analysis: VoiceAnalysisResult, style: ArtStyle): string {
    let description: string;
    const ethnicityAddition = getRandomEthnicity(analysis.characterProfile);

    if (style.id === 'kpop_idol_realistic') {
        const characterBase = analysis.isProfileRich
            ? analysis.characterProfile
            : `A character whose personality and aura embodies these traits: ${analysis.vocalCharacteristics.join(', ')}.`;

        const instruction = `The character MUST be wearing a glamorous and trendy K-pop stage outfit. CRITICAL: Strictly avoid generating suits, business attire, formal wear, or plain casual clothing. The outfit must be suitable for a stage performance. They must have professional idol-style makeup and hairstyles. IMPORTANT: Any mentioned jobs or hobbies from the description should only inform their subtle personality, not be depicted literally with objects or backgrounds. The final image must be a glamorous, professional photoshoot of a K-pop idol.`;
        
        description = `A K-pop idol inspired by this description: "${characterBase}"${ethnicityAddition}. ${instruction}`;
    } else {
        description = constructCharacterDescription(analysis) + ethnicityAddition;
    }
    
    return `Generate an image based on this description: ${description}. The art style is ${style.promptFragment}. High quality, detailed, character focus.`;
}

export async function generateCharacterImage(analysis: VoiceAnalysisResult, style: ArtStyle): Promise<string> {
    try {
        if (style.referenceImages && style.referenceImages.length > 0) {
            let description = constructCharacterDescription(analysis);
            const ethnicityAddition = getRandomEthnicity(analysis.characterProfile);
            description += ethnicityAddition;

            const prompt = `Generate an image based on this description: ${description}. Strictly adhere to the artistic style of the provided image(s). High quality, detailed, character focus.`;
            console.log("Generating image with predefined style image(s) and prompt:", prompt);

            const imageParts = style.referenceImages.map(img => ({
                inlineData: {
                    data: img.base64,
                    mimeType: img.mimeType,
                },
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [...imageParts, { text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            if (response.candidates && response.candidates.length > 0) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return part.inlineData.data;
                    }
                }
            }
            console.error("Image generation with predefined style image failed. Model did not return an image part.", response);
            throw new Error("No image was generated from the predefined style.");
        }

        const prompt = constructImagePrompt(analysis, style);
        console.log("Generating image with text prompt:", prompt);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }

        console.error("Image generation failed. Model did not return an image.", response);
        throw new Error("No image was generated.");

    } catch (error) {
        console.error("Error generating image with Gemini:", error);
        throw new Error("Failed to create character image. Please try again.");
    }
}


export async function generateCharacterImageFromStyleImage(
    analysis: VoiceAnalysisResult,
    styleImage: { base64: string; mimeType: string }
): Promise<string> {
    try {
        let description = constructCharacterDescription(analysis);
        const ethnicityAddition = getRandomEthnicity(analysis.characterProfile);
        description += ethnicityAddition;
        
        const prompt = `Generate an image based on this description: ${description}. Strictly adhere to the artistic style of the provided image. High quality, detailed, character focus.`;
        console.log("Generating image with style image and prompt:", prompt);
        
        const imagePart = {
            inlineData: {
                data: styleImage.base64,
                mimeType: styleImage.mimeType,
            },
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }

        console.error("Image generation with style image failed. Model did not return an image part.", response);
        throw new Error("No image was generated from the provided style.");

    } catch (error) {
        console.error("Error generating image with style image:", error);
        throw new Error("Failed to create character image with the provided style. Please try again.");
    }
}

export async function generateSpouseImage(audioBase64: string, mimeType: string): Promise<string> {
    try {
        // Step 1: Analyze audio for user profile and spouse preference
        const audioPart = { inlineData: { data: audioBase64, mimeType } };
        const analysisPrompt = `
            Analyze the user's voice recording. Your goal is to extract information to help imagine a suitable future spouse for them.
            Perform the following tasks and return the result as a single JSON object:

            1.  **requestedSpouseGender**: Identify the gender the user is looking for. Must be one of 'man', 'woman', or 'not specified'. If they mention both or are unclear, use 'not specified'.
            2.  **userProfile**: Summarize the user's self-description into a descriptive paragraph. Capture their personality, stated traits (job, hobbies, values), and any other unique details they mention about themselves.
            3.  **vocalCharacteristics**: Provide an array of keywords describing the user's voice itself (e.g., "energetic", "calm", "warm", "high-pitched", "deep", "melodious", "fast-paced").
            4.  **isUserProfileRich**: Evaluate the user's self-description. If they provided multiple details about their personality, hobbies, or values, return \`true\`. If their description was very short, generic, or absent, return \`false\`.

            Do not add any commentary before or after the JSON object.
        `;

        const analysisResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: analysisPrompt }, audioPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        requestedSpouseGender: { type: Type.STRING, enum: ['man', 'woman', 'not specified'] },
                        userProfile: { type: Type.STRING },
                        vocalCharacteristics: { type: Type.ARRAY, items: { type: Type.STRING } },
                        isUserProfileRich: { type: Type.BOOLEAN },
                    }
                }
            }
        });
        
        const analysis = JSON.parse(analysisResponse.text.trim()) as SpouseAnalysisResult;

        // Step 2: Construct the creative image prompt based on the analysis
        let userDescription: string;
        if (analysis.isUserProfileRich) {
            userDescription = `a person who described themselves as: "${analysis.userProfile}". Their voice sounded ${analysis.vocalCharacteristics.join(', ')}.`;
        } else {
            // Fallback: self-description is poor, so focus on voice
            userDescription = `a person whose voice is ${analysis.vocalCharacteristics.join(', ')}. Their brief description was: "${analysis.userProfile}".`;
        }

        let partnerDescription = `A suitable partner for ${userDescription}`;
        if (analysis.requestedSpouseGender !== 'not specified') {
            partnerDescription = `A ${analysis.requestedSpouseGender} who would be a suitable partner for ${userDescription}`;
        } else {
            // Fallback: no gender specified, let AI be creative
            partnerDescription += ". The partner's gender is not specified, so be creative; an androgynous appearance could be fitting.";
        }
        
        const ethnicityAddition = getRandomEthnicity(analysis.userProfile);

        const selfieStyleFragment = 'realistic selfie style, taken from a phone camera angle, casual expression, natural lighting, modern background, photorealistic';
        const finalPrompt = `Generate an image of ${partnerDescription}${ethnicityAddition}, who has a beautiful and handsome face with aesthetically pleasing, well-proportioned features. The image should be in a ${selfieStyleFragment}. High quality, detailed, character focus, happy and approachable.`;

        console.log("Generating spouse image with prompt:", finalPrompt);

        // Step 3: Generate the image
        const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [{ text: finalPrompt }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        if (imageResponse.candidates && imageResponse.candidates.length > 0) {
            for (const part of imageResponse.candidates[0].content.parts) {
                if (part.inlineData) {
                    return part.inlineData.data;
                }
            }
        }

        console.error("Spouse image generation failed. Model did not return an image.", imageResponse);
        throw new Error("No image was generated for the future spouse.");

    } catch (error) {
        console.error("Error in generateSpouseImage flow:", error);
        throw new Error("Failed to create future spouse image. Please try again.");
    }
}