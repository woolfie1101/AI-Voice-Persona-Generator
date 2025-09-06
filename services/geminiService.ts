
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VoiceAnalysisResult, ArtStyle } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    if (style.id === 'kpop_idol_realistic') {
        const characterBase = analysis.isProfileRich
            ? analysis.characterProfile // Use the rich text description
            : `A character whose personality and aura embodies these traits: ${analysis.vocalCharacteristics.join(', ')}.`; // Use voice for vibe

        const instruction = `The character MUST be wearing a glamorous and trendy K-pop stage outfit. CRITICAL: Strictly avoid generating suits, business attire, formal wear, or plain casual clothing. The outfit must be suitable for a stage performance. They must have professional idol-style makeup and hairstyles. IMPORTANT: Any mentioned jobs or hobbies from the description should only inform their subtle personality, not be depicted literally with objects or backgrounds. The final image must be a glamorous, professional photoshoot of a K-pop idol.`;
        
        description = `A K-pop idol inspired by this description: "${characterBase}". ${instruction}`;
    } else {
        // General fallback logic for other styles
        description = constructCharacterDescription(analysis);
    }
    
    return `Generate an image based on this description: ${description}. The art style is ${style.promptFragment}. High quality, detailed, character focus.`;
}

export async function generateCharacterImage(analysis: VoiceAnalysisResult, style: ArtStyle): Promise<string> {
    try {
        // Existing logic for styles with predefined reference images
        if (style.referenceImages && style.referenceImages.length > 0) {
            const description = constructCharacterDescription(analysis);
            const prompt = `Generate an image based on this description: ${description}. Strictly adhere to the artistic style of the provided image(s). High quality, detailed, character focus, 3:4 aspect ratio.`;
            console.log("Generating image with predefined style image(s) and prompt:", prompt);

            const imageParts = style.referenceImages.map(img => ({
                inlineData: {
                    data: img.base64,
                    mimeType: img.mimeType,
                },
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [{ text: prompt }, ...imageParts] },
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

        // Logic for text-based styles, now using the refined prompt construction
        const prompt = constructImagePrompt(analysis, style);
        console.log("Generating image with text prompt:", prompt);

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '3:4',
            },
        });

        if (response.generatedImages?.[0]?.image?.imageBytes) {
            return response.generatedImages[0].image.imageBytes;
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
        const description = constructCharacterDescription(analysis);
        const prompt = `Generate an image based on this description: ${description}. Strictly adhere to the artistic style of the provided image. High quality, detailed, character focus, 3:4 aspect ratio.`;
        console.log("Generating image with style image and prompt:", prompt);
        
        const imagePart = {
            inlineData: {
                data: styleImage.base64,
                mimeType: styleImage.mimeType,
            },
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [{ text: prompt }, imagePart] },
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