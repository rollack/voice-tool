import React, { useState } from 'react';
import { ClonedVoice } from '../types';

interface CloneVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voice: ClonedVoice) => void;
}

const CloneVoiceModal: React.FC<CloneVoiceModalProps> = ({ isOpen, onClose, onSave }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [voiceName, setVoiceName] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (!file) return;
    setAnalyzing(true);
    // Simulate API analysis time
    setTimeout(() => {
        setAnalyzing(false);
        setStep(2);
    }, 2000);
  };

  const handleSave = () => {
      onSave({
          id: `custom_${Date.now()}`,
          name: voiceName || 'My Custom Voice',
          baseVoiceMap: 'Fenrir' // Fallback mapping for the demo
      });
      handleClose();
  };

  const handleClose = () => {
      setStep(1);
      setFile(null);
      setVoiceName('');
      onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Voice Cloning Studio</h2>
            <button onClick={handleClose} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {step === 1 && (
              <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
                      <div className="mx-auto w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">Upload a voice sample (MP3/WAV)</p>
                      <p className="text-xs text-slate-500 mb-4">Recommended length: 30-60 seconds</p>
                      <input 
                        type="file" 
                        accept="audio/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                      />
                  </div>
                  <button 
                    disabled={!file || analyzing}
                    onClick={handleAnalyze}
                    className={`w-full py-3 rounded-lg font-medium transition-all ${!file ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50'}`}
                  >
                      {analyzing ? (
                          <span className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              Analyzing Voice Profile...
                          </span>
                      ) : "Analyze Voice"}
                  </button>
              </div>
          )}

          {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <div>
                          <p className="text-sm font-semibold text-green-400">Analysis Complete</p>
                          <p className="text-xs text-green-300/70">Tone, pitch, and cadence extracted successfully.</p>
                      </div>
                  </div>
                  
                  <div>
                      <label className="block text-sm text-slate-300 mb-2">Name your Voice Model</label>
                      <input 
                        type="text" 
                        value={voiceName}
                        onChange={(e) => setVoiceName(e.target.value)}
                        placeholder="e.g., Hero Clone, Emma Custom"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                  </div>

                  <div className="pt-2">
                      <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Preview</h4>
                       <div className="bg-slate-900 p-3 rounded-lg flex items-center gap-3">
                           <button className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center hover:bg-indigo-500">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                           </button>
                           <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                               <div className="w-1/3 h-full bg-indigo-500 rounded-full"></div>
                           </div>
                       </div>
                  </div>

                  <button 
                    onClick={handleSave}
                    disabled={!voiceName}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-900/50 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      Save Voice Model
                  </button>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CloneVoiceModal;
