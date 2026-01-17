import React, { useState, useRef } from 'react';
import { SpeakerConfig, VoiceSettings, GoogleVoice, ClonedVoice } from '../types';
import { AVAILABLE_VOICES } from '../constants';

interface VoiceControlsProps {
  speakerName: string;
  config: SpeakerConfig;
  availableVoices: GoogleVoice[];
  clonedVoices: ClonedVoice[];
  onUpdate: (name: string, newConfig: SpeakerConfig) => void;
  onCloneClick: () => void;
  onPreview: (name: string) => void;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  speakerName,
  config,
  availableVoices,
  clonedVoices,
  onUpdate,
  onCloneClick,
  onPreview,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSettingChange = (key: keyof VoiceSettings, value: string | number) => {
    onUpdate(speakerName, {
      ...config,
      settings: {
        ...config.settings,
        [key]: value,
      },
    });
  };

  const handlePreview = () => {
    setIsPlaying(true);
    onPreview(speakerName);
    // Simulate playing reset for UI (actual playing handled by parent)
    setTimeout(() => setIsPlaying(false), 2000); 
  };

  return (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 mb-3 hover:border-indigo-500/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${config.isCloned ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white'}`}>
                {speakerName.slice(0, 2).toUpperCase()}
            </div>
            <h3 className="font-medium text-slate-100 truncate max-w-[150px]" title={speakerName}>{speakerName}</h3>
        </div>
        
        <button 
            onClick={handlePreview}
            className="p-2 bg-slate-600 hover:bg-slate-500 rounded-full text-indigo-300 transition-colors"
            title="Preview Voice"
        >
            {isPlaying ? (
               <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            ) : (
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
        </button>
      </div>

      <div className="space-y-3">
        {/* Voice Selection */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Voice Model</label>
          <div className="flex gap-2">
            <select
                className="flex-1 bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                value={config.settings.voiceName}
                onChange={(e) => handleSettingChange('voiceName', e.target.value)}
            >
                <optgroup label="Google Studio Voices">
                {availableVoices.map((v) => (
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
            <button 
                onClick={onCloneClick}
                className="text-xs bg-slate-600 hover:bg-purple-600 hover:text-white px-2 py-1 rounded transition-colors text-slate-300"
                title="Clone a new voice"
            >
                + Clone
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Speed</span>
                    <span>{config.settings.speed}x</span>
                </label>
                <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={config.settings.speed}
                    onChange={(e) => handleSettingChange('speed', parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>
            <div>
                <label className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Pitch</span>
                    <span>{config.settings.pitch}</span>
                </label>
                <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={config.settings.pitch}
                    onChange={(e) => handleSettingChange('pitch', parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceControls;
