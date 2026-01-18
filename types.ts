export interface ScriptLine {
  id: string;
  speaker: string;
  text: string;
  audioUrl?: string;
  isGenerating?: boolean;
}

export interface VoiceSettings {
  voiceName: string;
  pitch: number;
  speed: number;
  volume: number;
  emotion: string;
}

export interface SpeakerConfig {
  name: string;
  settings: VoiceSettings;
  isCloned?: boolean;
}

export interface ClonedVoice {
  id: string;
  name: string;
  baseVoiceMap: string;
}

export interface VoicePreset {
  id: string;
  name: string;
  settings: VoiceSettings;
}

export interface GoogleVoice {
  name: string;
  gender: 'Male' | 'Female';
  label: string;
}

export type ProcessingStatus = 'idle' | 'generating' | 'combining' | 'completed' | 'error';