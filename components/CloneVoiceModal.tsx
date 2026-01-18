import React, { useState, useEffect, useRef } from 'react';
import { ClonedVoice } from '../types';
import { AVAILABLE_VOICES } from '../constants';

interface CloneVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voice: ClonedVoice) => void;
}

const CloneVoiceModal: React.FC<CloneVoiceModalProps> = ({ isOpen, onClose, onSave }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const [selectedBaseVoice, setSelectedBaseVoice] = useState<string>('');
  const [detectedTraits, setDetectedTraits] = useState<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFile(null);
      setAudioPreviewUrl(null);
      setVoiceName('');
      setSelectedBaseVoice('');
      setDetectedTraits([]);
      setAnalyzing(false);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setAudioPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleAnalyze = () => {
    if (!file) return;
    setAnalyzing(true);
    
    // Simulate complex analysis
    setTimeout(() => {
        // Randomly "detect" traits for UI flavor
        const traitsPool = ['Deep', 'Resonant', 'Soft', 'Energetic', 'Calm', 'Raspy', 'Bright', 'Airy'];
        const randomTraits = traitsPool.sort(() => 0.5 - Math.random()).slice(0, 3);
        setDetectedTraits(randomTraits);

        // Heuristic: map to a random voice for demo purposes
        // In a real app, you might analyze pitch (Hz) to guess gender/tone
        const randomVoice = AVAILABLE_VOICES[Math.floor(Math.random() * AVAILABLE_VOICES.length)];
        setSelectedBaseVoice(randomVoice.name);

        setAnalyzing(false);
        setStep(2);
    }, 2500);
  };

  const handleSave = () => {
      onSave({
          id: `custom_${Date.now()}`,
          name: voiceName || 'My Custom Voice',
          baseVoiceMap: selectedBaseVoice || 'Fenrir'
      });
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Voice Cloning Lab</h2>
            <p className="text-xs text-slate-400">Create a custom voice model from audio samples</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {step === 1 && (
              <div className="space-y-6">
                  {/* Upload Area */}
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${file ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-600 bg-slate-800/50 hover:bg-slate-700/50'}`}>
                      <input 
                        type="file" 
                        id="voice-upload"
                        accept="audio/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      
                      {!file ? (
                          <label htmlFor="voice-upload" className="cursor-pointer flex flex-col items-center">
                              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                              </div>
                              <p className="text-lg font-medium text-slate-200 mb-1">Upload Voice Sample</p>
                              <p className="text-sm text-slate-500">MP3, WAV, or M4A (Max 10MB)</p>
                          </label>
                      ) : (
                          <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 border border-indigo-500/30">
                                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                              </div>
                              <p className="text-base font-medium text-slate-200 mb-2">{file.name}</p>
                              <div className="flex gap-3">
                                  <label htmlFor="voice-upload" className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium">Change File</label>
                                  {audioPreviewUrl && (
                                      <button 
                                        onClick={() => audioRef.current?.play()} 
                                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                                      >
                                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                          Play Preview
                                      </button>
                                  )}
                              </div>
                              <audio ref={audioRef} src={audioPreviewUrl || undefined} className="hidden" />
                          </div>
                      )}
                  </div>

                  {/* Analysis Button */}
                  <button 
                    disabled={!file || analyzing}
                    onClick={handleAnalyze}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all relative overflow-hidden ${!file ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50'}`}
                  >
                      {analyzing ? (
                          <div className="flex items-center justify-center gap-3">
                              <div className="flex gap-1">
                                  <div className="w-1.5 h-6 bg-white/80 animate-[pulse_0.6s_ease-in-out_infinite]"></div>
                                  <div className="w-1.5 h-6 bg-white/80 animate-[pulse_0.6s_ease-in-out_0.2s_infinite]"></div>
                                  <div className="w-1.5 h-6 bg-white/80 animate-[pulse_0.6s_ease-in-out_0.4s_infinite]"></div>
                              </div>
                              <span>Analyzing Audio Profile...</span>
                          </div>
                      ) : "Analyze & Clone Voice"}
                  </button>
              </div>
          )}

          {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                  {/* Results Card */}
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                      <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          </div>
                          <div>
                              <h3 className="font-semibold text-white">Analysis Complete</h3>
                              <p className="text-sm text-slate-400">We've extracted the tonal characteristics from your sample.</p>
                          </div>
                      </div>
                      
                      {/* Detected Traits Tags */}
                      <div className="flex flex-wrap gap-2 mb-2">
                          {detectedTraits.map(trait => (
                              <span key={trait} className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-md border border-slate-600">
                                  {trait}
                              </span>
                          ))}
                      </div>
                  </div>
                  
                  {/* Name Input */}
                  <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Voice Model Name</label>
                      <input 
                        type="text" 
                        autoFocus
                        value={voiceName}
                        onChange={(e) => setVoiceName(e.target.value)}
                        placeholder="e.g., Protagonist Voice, Custom Narrator"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                      />
                  </div>

                  {/* Base Map Selection */}
                  <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                          Mapped Base Voice
                          <span className="ml-2 text-xs font-normal text-slate-500">(Underlying synthesis model)</span>
                      </label>
                      <div className="relative">
                        <select 
                            value={selectedBaseVoice}
                            onChange={(e) => setSelectedBaseVoice(e.target.value)}
                            className="w-full appearance-none bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                        >
                            {AVAILABLE_VOICES.map(voice => (
                                <option key={voice.name} value={voice.name}>
                                    {voice.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                          The AI has selected <strong>{AVAILABLE_VOICES.find(v => v.name === selectedBaseVoice)?.name}</strong> as the closest match to your sample. You can override this if you prefer a different tone.
                      </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex gap-3">
                      <button 
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium transition-colors"
                      >
                          Back
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={!voiceName}
                        className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                          Save Voice Model
                      </button>
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloneVoiceModal;