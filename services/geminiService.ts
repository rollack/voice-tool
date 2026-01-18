import { GoogleGenAI, Modality } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please ensure process.env.API_KEY is set.");
  }
  return new GoogleGenAI({ apiKey });
};

// Base64 helper
const decodeAudioData = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Map UI emotions to prompt adverbs/styles for better TTS results
const EMOTION_PROMPTS: Record<string, string> = {
  'Happy': 'cheerfully',
  'Sad': 'sadly',
  'Angry': 'angrily',
  'Surprised': 'with surprise',
  'Excited': 'excitedly',
  'Whispering': 'whisper',
};

export const generateSpeech = async (
  text: string,
  voiceName: string,
  emotion?: string
): Promise<Blob> => {
  try {
    const ai = getClient();
    
    // Apply emotion guidance to the text prompt if present and not Neutral
    let effectiveText = text;
    if (emotion && emotion !== 'Neutral') {
      const promptStyle = EMOTION_PROMPTS[emotion] || emotion.toLowerCase();
      effectiveText = `Say ${promptStyle}: ${text}`;
    }
    
    // Using the TTS model as specified in the prompt
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: effectiveText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from Gemini API");
    }

    const audioBytes = decodeAudioData(base64Audio);
    // Return as a Blob for easy playback/download
    return new Blob([audioBytes], { type: 'audio/wav' }); 
    
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};

// Helper to convert Blob to ArrayBuffer
export const blobToArrayBuffer = async (blob: Blob): Promise<ArrayBuffer> => {
    return await blob.arrayBuffer();
};