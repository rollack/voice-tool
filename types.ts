export interface ScriptLine {
  id: string;
  speaker: string;
  text: string;
  audioUrl?: string;
  isGenerating?: boolean;
}

export interface VoiceSettings {
  voiceName: string;
  pitch: number; // 0.5 to 2.0 (handled via playbackRate in post-processing usually, but here stored for config)
  speed: number; // 0.5 to 2.0
  volume: number; // 0 to 1
  emotion?: string; // Metadata for UI
}

export interface SpeakerConfig {
  name: string;
  settings: VoiceSettings;
  isCloned?: boolean;
}

export interface ClonedVoice {
  id: string;
  name: string;
  baseVoiceMap: string; // Map to a real underlying voice since we can't truly clone in this demo
}

export interface GoogleVoice {
  name: string;
  gender: 'Male' | 'Female';
  label: string;
}

export type ProcessingStatus = 'idle' | 'generating' | 'combining' | 'completed' | 'error';
