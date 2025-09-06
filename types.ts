export enum AppState {
  START,
  RECORDING,
  STYLE_SELECTION,
  GENERATING,
  RESULT,
}

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
