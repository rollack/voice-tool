import React, { useState } from 'react';
import { SpeakerConfig, VoiceSettings, GoogleVoice, ClonedVoice, VoicePreset } from '../types';
import { AVAILABLE_VOICES, AVAILABLE_EMOTIONS } from '../constants';

interface VoiceControlsProps {
  speakerName: string;
  config: SpeakerConfig;
  availableVoices: GoogleVoice[];
  clonedVoices: ClonedVoice[];
  presets: VoicePreset[];
  onUpdate: (name: string, newConfig: SpeakerConfig) => void;
  onCloneClick: () => void;
  onPreview: (name: string) => void;
  onSavePreset: (name: string, settings: VoiceSettings) => void;
  onDeletePreset: (id: string) => void;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  speakerName,
  config,
  availableVoices,
  clonedVoices,
  presets,
  onUpdate,
  onCloneClick,
  onPreview,
  onSavePreset,
  onDeletePreset
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isNamingPreset, setIsNamingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showManagePresets, setShowManagePresets] = useState(false);

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
    setTimeout(() => setIsPlaying(false), 2000); 
  };

  const handleSaveClick = () => {
    if (isNamingPreset) {
      if (presetName.trim()) {
        onSavePreset(presetName.trim(), config.settings);
        setPresetName('');
        setIsNamingPreset(false);
      }
    } else {
      setIsNamingPreset(true);
    }
  };

  const handleCancelSave = () => {
    setIsNamingPreset(false);
    setPresetName('');
  };

  const handlePresetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    if (!presetId) return;
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      onUpdate(speakerName, {
        ...config,
        settings: { ...preset.settings }
      });
    }
    // Reset to "select" state
    e.target.value = "";
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
        
        {/* Presets Row */}
        <div className="bg-slate-800/50 rounded p-2 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-medium">Voice Presets</span>
                <button 
                    onClick={() => setShowManagePresets(!showManagePresets)}
                    className="hover:text-indigo-400 transition-colors"
                >
                    {showManagePresets ? 'Done' : 'Manage'}
                </button>
            </div>
            
            {showManagePresets ? (
                <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar">
                    {presets.length === 0 && <span className="text-xs text-slate-500 italic px-1">No presets saved.</span>}
                    {presets.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-slate-700 rounded px-2 py-1">
                            <span className="text-xs text-slate-200 truncate" title={`Voice: ${p.settings.voiceName}, Emotion: ${p.settings.emotion}, Speed: ${p.settings.speed}x`}>{p.name}</span>
                            <button 
                                onClick={() => onDeletePreset(p.id)}
                                className="text-red-400 hover:text-red-300"
                                title="Delete Preset"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex gap-2">
                    {isNamingPreset ? (
                        <div className="flex-1 flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Preset Name"
                                value={presetName}
                                onChange={e => setPresetName(e.target.value)}
                                className="flex-1 min-w-0 bg-slate-900 border border-slate-600 text-xs rounded px-2 py-1 text-white focus:border-indigo-500 outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveClick();
                                  if (e.key === 'Escape') handleCancelSave();
                                }}
                            />
                            <button onClick={handleSaveClick} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2 py-1 rounded">Save</button>
                            <button onClick={handleCancelSave} className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-2 py-1 rounded">Cancel</button>
                        </div>
                    ) : (
                        <>
                             <select
                                className="flex-1 bg-slate-900 border border-slate-600 text-slate-300 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                                onChange={handlePresetSelect}
                                defaultValue=""
                            >
                                <option value="" disabled>Load Preset...</option>
                                {presets.map(p => (
                                    <option 
                                        key={p.id} 
                                        value={p.id} 
                                        title={`Emotion: ${p.settings.emotion}, Speed: ${p.settings.speed}x, Pitch: ${p.settings.pitch}`}
                                    >
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <button 
                                onClick={handleSaveClick}
                                className="bg-slate-600 hover:bg-indigo-600 text-white text-xs px-3 py-1 rounded transition-colors"
                                title="Save current settings as preset"
                            >
                                Save
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>

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

        {/* Emotion Selector */}
        <div>
            <label className="block text-xs text-slate-400 mb-1">Emotion</label>
            <select
                className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                value={config.settings.emotion || 'Neutral'}
                onChange={(e) => handleSettingChange('emotion', e.target.value)}
            >
                {AVAILABLE_EMOTIONS.map((emotion) => (
                    <option key={emotion} value={emotion}>{emotion}</option>
                ))}
            </select>
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