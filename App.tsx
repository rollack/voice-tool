import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ScriptInput from './components/ScriptInput';
import VoiceControls from './components/VoiceControls';
import CloneVoiceModal from './components/CloneVoiceModal';
import { ScriptLine, SpeakerConfig, VoiceSettings, ProcessingStatus, ClonedVoice } from './types';
import { AVAILABLE_VOICES, DEFAULT_VOICE_SETTINGS, INITIAL_SCRIPT_PLACEHOLDER } from './constants';
import { generateSpeech } from './services/geminiService';
import { audioBufferToWav, audioContext, concatenateAudioBuffers, decodeAudioData } from './utils/audioUtils';

const App: React.FC = () => {
  // State
  const [scriptLines, setScriptLines] = useState<ScriptLine[]>([]);
  const [speakers, setSpeakers] = useState<Record<string, SpeakerConfig>>({});
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [backgroundMusic, setBackgroundMusic] = useState<File | null>(null);

  // Script Parsing Logic
  const handleParseScript = useCallback((text: string) => {
    // Regex to find "Speaker: Text" or "[Speaker: Text]"
    // Format 1: [Speaker: Text]
    // Format 2: Speaker: Text
    const regex = /(?:\[)?([a-zA-Z0-9\s]+)(?::|\])(?:\s*)(.*)/g;
    const lines: ScriptLine[] = [];
    const foundSpeakers = new Set<string>();
    
    let match;
    let index = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match[2].trim()) {
        const speaker = match[1].trim();
        const content = match[2].trim();
        
        // Remove trailing bracket if it exists from Format 1
        const cleanContent = content.endsWith(']') ? content.slice(0, -1) : content;

        lines.push({
          id: `line_${index}`,
          speaker: speaker,
          text: cleanContent,
        });
        foundSpeakers.add(speaker);
        index++;
      }
    }

    setScriptLines(lines);

    // Update speaker configs, preserving existing settings if speaker already exists
    setSpeakers(prev => {
      const newSpeakers = { ...prev };
      foundSpeakers.forEach(spk => {
        if (!newSpeakers[spk]) {
          // Assign random available voice to start
          const randomVoice = AVAILABLE_VOICES[Math.floor(Math.random() * AVAILABLE_VOICES.length)];
          newSpeakers[spk] = {
            name: spk,
            settings: { ...DEFAULT_VOICE_SETTINGS, voiceName: randomVoice.name },
          };
        }
      });
      return newSpeakers;
    });
  }, []);

  // Initial Parse
  useEffect(() => {
    handleParseScript(INITIAL_SCRIPT_PLACEHOLDER);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once

  // Handlers
  const handleSpeakerUpdate = (name: string, newConfig: SpeakerConfig) => {
    setSpeakers(prev => ({ ...prev, [name]: newConfig }));
  };

  const handleCloneSave = (voice: ClonedVoice) => {
    setClonedVoices(prev => [...prev, voice]);
  };

  const handlePreviewVoice = async (speakerName: string) => {
    const config = speakers[speakerName];
    if (!config) return;
    
    // Quick preview text
    const text = `Hello, I am ${speakerName}. This is how I sound.`;
    
    try {
        // Handle cloned voice mapping (since API doesn't support custom models truly here, use base map)
        let voiceName = config.settings.voiceName;
        const cloned = clonedVoices.find(cv => cv.id === voiceName);
        if (cloned) voiceName = cloned.baseVoiceMap;

        const blob = await generateSpeech(text, voiceName);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        
        // Apply rudimentary pitch/rate via Audio Element
        audio.playbackRate = config.settings.speed;
        audio.volume = config.settings.volume;
        // Pitch cannot be changed easily on Audio element without changing speed, 
        // unless preserverPitch is false.
        // audio.preservesPitch = false; 
        
        audio.play();
    } catch (e) {
        alert("Failed to generate preview. Check API Key.");
    }
  };

  const handleGenerateFullAudio = async () => {
    if (scriptLines.length === 0) return;
    setStatus('generating');
    setProgress(0);
    setGeneratedAudioUrl(null);

    try {
      const audioBuffers: AudioBuffer[] = [];

      for (let i = 0; i < scriptLines.length; i++) {
        const line = scriptLines[i];
        const config = speakers[line.speaker];
        
        if (config) {
            let voiceName = config.settings.voiceName;
            const cloned = clonedVoices.find(cv => cv.id === voiceName);
            if (cloned) voiceName = cloned.baseVoiceMap;

            const blob = await generateSpeech(line.text, voiceName);
            const arrayBuffer = await blob.arrayBuffer();
            const audioBuffer = await decodeAudioData(arrayBuffer);
            
            // Note: Applying pitch/speed to the buffer itself requires offline context rendering
            // For simplicity in this demo, we are concatenating the raw generated buffers.
            // A production app would use OfflineAudioContext to stretch/pitch shift the buffer data here.
            
            audioBuffers.push(audioBuffer);
        }
        setProgress(Math.round(((i + 1) / scriptLines.length) * 90));
      }

      setStatus('combining');
      const finalBuffer = concatenateAudioBuffers(audioBuffers);
      const wavBlob = audioBufferToWav(finalBuffer);
      const url = URL.createObjectURL(wavBlob);
      
      setGeneratedAudioUrl(url);
      setProgress(100);
      setStatus('completed');

    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-700 bg-slate-900/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">Voice</h1>
                    <p className="text-xs text-slate-400">AI Story Narrator</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                 {status === 'generating' || status === 'combining' ? (
                     <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                         <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                         <span className="text-sm font-medium text-slate-300">Processing {progress}%</span>
                     </div>
                 ) : (
                    <button 
                        onClick={handleGenerateFullAudio}
                        className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-red-900/30 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Generate Audio
                    </button>
                 )}
            </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Script */}
        <div className="lg:col-span-7 flex flex-col h-[calc(100vh-8rem)]">
           <ScriptInput 
             initialText={INITIAL_SCRIPT_PLACEHOLDER}
             onParse={handleParseScript}
           />
        </div>

        {/* Right Column: Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            
            {/* Audio Output Section */}
            {generatedAudioUrl && (
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 animate-in slide-in-from-top-4">
                    <h3 className="text-indigo-300 font-semibold mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                        Master Output
                    </h3>
                    <audio controls src={generatedAudioUrl} className="w-full mb-3 h-8" />
                    <div className="flex gap-2">
                        <a 
                            href={generatedAudioUrl} 
                            download={`Story_${new Date().toISOString().split('T')[0]}.wav`}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-center py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Download All (.mp3/wav)
                        </a>
                    </div>
                </div>
            )}

            {/* Speaker Mapping */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    Voice Mapping
                </h2>
                
                <div className="space-y-4">
                    {Object.keys(speakers).length === 0 ? (
                        <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
                            <p>No speakers detected.</p>
                            <p className="text-xs">Type a script to begin.</p>
                        </div>
                    ) : (
                        Object.entries(speakers).map(([name, config]) => (
                            <VoiceControls
                                key={name}
                                speakerName={name}
                                config={config}
                                availableVoices={AVAILABLE_VOICES}
                                clonedVoices={clonedVoices}
                                onUpdate={handleSpeakerUpdate}
                                onCloneClick={() => setIsCloneModalOpen(true)}
                                onPreview={handlePreviewVoice}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Background Audio Optional */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h2 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">Ambiance</h2>
                <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer bg-slate-900 hover:bg-slate-750 border border-slate-600 rounded-lg p-3 flex items-center gap-3 transition-colors">
                        <div className="p-2 bg-slate-700 rounded-full">
                            <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                        </div>
                        <span className="text-sm text-slate-300 truncate">
                            {backgroundMusic ? backgroundMusic.name : "Add Background Music"}
                        </span>
                        <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files && setBackgroundMusic(e.target.files[0])} />
                    </label>
                    {backgroundMusic && (
                        <button 
                            onClick={() => setBackgroundMusic(null)}
                            className="text-red-400 hover:bg-red-400/10 p-2 rounded"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

        </div>
      </main>

      <CloneVoiceModal 
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onSave={handleCloneSave}
      />
    </div>
  );
};

export default App;
