export enum AppState {
  START,
  RECORDING,
  STYLE_SELECTION,
  GENERATING,
  RESULT,
}

export type GeneratorMode = 'persona' | 'spouse';

export interface ArtStyle {
  id: string;
  name: string;
  imageUrl: string;
  promptFragment: string;
  referenceImages?: { base64: string; mimeType: string }[];
}

export interface VoiceAnalysisResult {
    characterProfile: string;
    vocalCharacteristics: string[];
    isProfileRich: boolean;
}

export interface SpouseAnalysisResult {
    userProfile: string;
    vocalCharacteristics: string[];
    requestedSpouseGender: 'man' | 'woman' | 'not specified';
    isUserProfileRich: boolean;
}
