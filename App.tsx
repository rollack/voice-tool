import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ScriptInput from './components/ScriptInput';
import VoiceControls from './components/VoiceControls';
import CloneVoiceModal from './components/CloneVoiceModal';
import { ScriptLine, SpeakerConfig, VoiceSettings, ProcessingStatus, ClonedVoice, VoicePreset } from './types';
import { AVAILABLE_VOICES, AVAILABLE_EMOTIONS, DEFAULT_VOICE_SETTINGS, INITIAL_SCRIPT_PLACEHOLDER } from './constants';
import { generateSpeech } from './services/geminiService';
import { audioBufferToWav, audioContext, concatenateAudioBuffers, decodeAudioData } from './utils/audioUtils';

const App: React.FC = () => {
  // State
  const [scriptLines, setScriptLines] = useState<ScriptLine[]>([]);
  const [speakers, setSpeakers] = useState<Record<string, SpeakerConfig>>({});
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [presets, setPresets] = useState<VoicePreset[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [backgroundMusic, setBackgroundMusic] = useState<File | null>(null);

  // Global Settings for New Speakers
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [randomizeVoice, setRandomizeVoice] = useState(true);

  // Load Presets with migration for emotion field
  useEffect(() => {
    const saved = localStorage.getItem('voice_presets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all loaded presets have an emotion set (migration for older saves)
        const migratedPresets: VoicePreset[] = Array.isArray(parsed) 
            ? parsed.map((p: any) => ({
                ...p,
                settings: {
                    ...p.settings,
                    emotion: p.settings.emotion || 'Neutral'
                }
              }))
            : [];
        setPresets(migratedPresets);
      } catch (e) {
        console.error("Failed to load presets", e);
      }
    }
  }, []);

  // Load Cloned Voices to ensure presets referencing them work
  useEffect(() => {
    const saved = localStorage.getItem('cloned_voices');
    if (saved) {
      try {
        setClonedVoices(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load cloned voices", e);
      }
    }
  }, []);

  const handleSavePreset = (name: string, settings: VoiceSettings) => {
    const newPreset: VoicePreset = {
      id: Date.now().toString(),
      name,
      settings: { 
          ...settings,
          emotion: settings.emotion || 'Neutral' // Explicitly ensure emotion is saved
      } 
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('voice_presets', JSON.stringify(updated));
  };

  const handleDeletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('voice_presets', JSON.stringify(updated));
  };

  // Helper for global settings updates
  const handleGlobalSettingChange = (key: keyof VoiceSettings, value: string | number) => {
    setGlobalSettings(prev => ({ ...prev, [key]: value }));
  };

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
          // Determine voice name based on settings
          let voiceName = globalSettings.voiceName;
          
          if (randomizeVoice) {
            const randomVoice = AVAILABLE_VOICES[Math.floor(Math.random() * AVAILABLE_VOICES.length)];
            voiceName = randomVoice.name;
          }

          newSpeakers[spk] = {
            name: spk,
            settings: { 
                ...globalSettings,
                voiceName: voiceName
            },
          };
        }
      });
      return newSpeakers;
    });
  }, [globalSettings, randomizeVoice]); // Dependencies updated to include global settings

  // Initial Parse
  useEffect(() => {
    handleParseScript(INITIAL_SCRIPT_PLACEHOLDER);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Handlers
  const handleSpeakerUpdate = (name: string, newConfig: SpeakerConfig) => {
    setSpeakers(prev => ({ ...prev, [name]: newConfig }));
  };

  const handleCloneSave = (voice: ClonedVoice) => {
    const updated = [...clonedVoices, voice];
    setClonedVoices(updated);
    localStorage.setItem('cloned_voices', JSON.stringify(updated));
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

        const blob = await generateSpeech(text, voiceName, config.settings.emotion);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        
        // Apply rudimentary pitch/rate via Audio Element
        audio.playbackRate = config.settings.speed;
        audio.volume = config.settings.volume;
        
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

            const blob = await generateSpeech(line.text, voiceName, config.settings.emotion);
            const arrayBuffer = await blob.arrayBuffer();
            const audioBuffer = await decodeAudioData(arrayBuffer);
            
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

            {/* Global Settings Section (New Dedicated Card) */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                <button 
                    onClick={() => setShowGlobalSettings(!showGlobalSettings)}
                    className="w-full flex items-center justify-between group"
                >
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        Global Default Settings
                    </h2>
                    <svg className={`w-5 h-5 text-slate-400 transform transition-transform group-hover:text-indigo-400 ${showGlobalSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                
                {showGlobalSettings && (
                    <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200 border-t border-slate-700 pt-4">
                        
                        <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                            <input 
                                type="checkbox" 
                                id="randomVoice"
                                checked={randomizeVoice}
                                onChange={(e) => setRandomizeVoice(e.target.checked)}
                                className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="randomVoice" className="text-sm text-slate-300 cursor-pointer select-none">
                                <span className="block font-medium text-slate-200">Randomize Voice Model</span>
                                <span className="block text-xs text-slate-500">Automatically assign different voices to new speakers</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Voice Select (Disabled if random) */}
                            <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Default Voice</label>
                                    <select
                                    disabled={randomizeVoice}
                                    value={globalSettings.voiceName}
                                    onChange={(e) => handleGlobalSettingChange('voiceName', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                >
                                    <optgroup label="Google Studio Voices">
                                        {AVAILABLE_VOICES.map(v => (
                                            <option key={v.name} value={v.name}>{v.label}</option>
                                        ))}
                                    </optgroup>
                                    {clonedVoices.length > 0 && (
                                        <optgroup label="My Cloned Voices">
                                            {clonedVoices.map(cv => (
                                                <option key={cv.id} value={cv.id}>{cv.name} (Custom)</option>
                                            ))}
                                        </optgroup>
                                    )}
                                    </select>
                            </div>

                            {/* Emotion Select */}
                            <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Default Emotion</label>
                                    <select
                                    value={globalSettings.emotion}
                                    onChange={(e) => handleGlobalSettingChange('emotion', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                >
                                        {AVAILABLE_EMOTIONS.map(e => (
                                            <option key={e} value={e}>{e}</option>
                                        ))}
                                    </select>
                            </div>
                        </div>

                        {/* Sliders */}
                        <div className="grid grid-cols-2 gap-4">
                                <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className="text-xs font-medium text-slate-400">Speed</label>
                                    <span className="text-xs text-indigo-400 font-mono">{globalSettings.speed}x</span>
                                </div>
                                <input
                                    type="range" min="0.5" max="2.0" step="0.1"
                                    value={globalSettings.speed}
                                    onChange={(e) => handleGlobalSettingChange('speed', parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                </div>
                                <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className="text-xs font-medium text-slate-400">Pitch</label>
                                    <span className="text-xs text-indigo-400 font-mono">{globalSettings.pitch}</span>
                                </div>
                                <input
                                    type="range" min="0.5" max="1.5" step="0.1"
                                    value={globalSettings.pitch}
                                    onChange={(e) => handleGlobalSettingChange('pitch', parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                </div>
                        </div>
                    </div>
                )}
            </div>

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
                                presets={presets}
                                onUpdate={handleSpeakerUpdate}
                                onCloneClick={() => setIsCloneModalOpen(true)}
                                onPreview={handlePreviewVoice}
                                onSavePreset={handleSavePreset}
                                onDeletePreset={handleDeletePreset}
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