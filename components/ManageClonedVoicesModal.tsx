import React, { useState } from 'react';
import { ClonedVoice } from '../types';

interface ManageClonedVoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  voices: ClonedVoice[];
  onUpdate: (voice: ClonedVoice) => void;
  onDelete: (id: string) => void;
}

const ManageClonedVoicesModal: React.FC<ManageClonedVoicesModalProps> = ({
  isOpen,
  onClose,
  voices,
  onUpdate,
  onDelete,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const startEditing = (voice: ClonedVoice) => {
    setEditingId(voice.id);
    setEditName(voice.name);
  };

  const saveEditing = (voice: ClonedVoice) => {
    if (editName.trim()) {
        onUpdate({ ...voice, name: editName.trim() });
    }
    setEditingId(null);
  };

  const toggleFavorite = (voice: ClonedVoice) => {
      onUpdate({ ...voice, isFavorite: !voice.isFavorite });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Manage Cloned Voices</h2>
            <p className="text-xs text-slate-400">Rename, organize, or remove your custom voice models</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto custom-scrollbar flex-grow bg-slate-900/50">
           {voices.length === 0 ? (
               <div className="text-center py-12 text-slate-500">
                   <p>No cloned voices found.</p>
                   <p className="text-sm">Create one using the "+ Clone" button in the Voice Mapping section.</p>
               </div>
           ) : (
               <div className="space-y-3">
                   {voices.map(voice => (
                       <div key={voice.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center gap-4 transition-all hover:border-indigo-500/30">
                           {/* Favorite Toggle */}
                           <button 
                                onClick={() => toggleFavorite(voice)}
                                className={`p-2 rounded-full transition-colors ${voice.isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-600 hover:text-yellow-400 hover:bg-slate-700'}`}
                                title={voice.isFavorite ? "Unfavorite" : "Favorite"}
                           >
                               <svg className="w-5 h-5" fill={voice.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                           </button>

                           {/* Icon */}
                           <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm border border-purple-500/30">
                               {voice.name.slice(0, 2).toUpperCase()}
                           </div>

                           {/* Content */}
                           <div className="flex-grow min-w-0">
                               {editingId === voice.id ? (
                                   <div className="flex items-center gap-2">
                                       <input 
                                            type="text" 
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="bg-slate-900 border border-indigo-500 text-white rounded px-2 py-1 text-sm outline-none w-full"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && saveEditing(voice)}
                                       />
                                       <button onClick={() => saveEditing(voice)} className="text-green-400 hover:text-green-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></button>
                                       <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                                   </div>
                               ) : (
                                   <div>
                                       <h3 className="font-medium text-slate-200 truncate">{voice.name}</h3>
                                       <p className="text-xs text-slate-500">Based on: {voice.baseVoiceMap}</p>
                                   </div>
                               )}
                           </div>

                           {/* Actions */}
                           <div className="flex items-center gap-1">
                               {editingId !== voice.id && (
                                   <button 
                                        onClick={() => startEditing(voice)}
                                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Rename"
                                   >
                                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                   </button>
                               )}
                               <button 
                                    onClick={() => { if(confirm('Are you sure you want to delete this voice?')) onDelete(voice.id); }}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Delete"
                               >
                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                               </button>
                           </div>
                       </div>
                   ))}
               </div>
           )}
        </div>
        <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ManageClonedVoicesModal;