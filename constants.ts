import { GoogleVoice, VoiceSettings } from './types';

// Using the voices available in Gemini Live/TTS API
export const AVAILABLE_VOICES: GoogleVoice[] = [
  { name: 'Puck', gender: 'Male', label: 'Puck (Playful, energetic)' },
  { name: 'Charon', gender: 'Male', label: 'Charon (Deep, resonant)' },
  { name: 'Kore', gender: 'Female', label: 'Kore (Calm, soothing)' },
  { name: 'Fenrir', gender: 'Male', label: 'Fenrir (Gravelly, intense)' },
  { name: 'Zephyr', gender: 'Female', label: 'Zephyr (Gentle, airy)' },
];

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voiceName: 'Puck',
  pitch: 1.0,
  speed: 1.0,
  volume: 1.0,
  emotion: 'Neutral',
};

export const INITIAL_SCRIPT_PLACEHOLDER = `[Narrator: The sun began to set over the horizon.]
Speaker 1: Hello, are you ready for today's adventure?
Speaker 2: I sure am! Let's go!
[Speaker 1: Wait, did you bring the map?]
Speaker 2: I thought you had it!`;
