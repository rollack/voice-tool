import React, { useEffect, useState } from 'react';
import { ScriptLine } from '../types';

interface ScriptInputProps {
  initialText: string;
  onParse: (text: string) => void;
}

const ScriptInput: React.FC<ScriptInputProps> = ({ initialText, onParse }) => {
  const [text, setText] = useState(initialText);

  // Debounce the parsing to auto-detect speakers
  useEffect(() => {
    const timer = setTimeout(() => {
      onParse(text);
    }, 1000);
    return () => clearTimeout(timer);
  }, [text, onParse]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Script Editor
        </h2>
        <span className="text-xs text-slate-400">Auto-detecting...</span>
      </div>
      
      <div className="relative flex-grow">
        <textarea
          className="w-full h-full bg-slate-900 text-slate-200 p-4 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none font-mono text-sm leading-relaxed border border-slate-700 placeholder-slate-600"
          placeholder="Enter your script here...&#10;Speaker 1: Hello world!&#10;[Narrator: Suddenly, silence fell.]"
          value={text}
          onChange={handleChange}
        />
      </div>

      <div className="mt-3 text-xs text-slate-500">
        <p className="mb-1 font-semibold">Format Guide:</p>
        <div className="grid grid-cols-2 gap-2">
            <code>Speaker Name: Dialogue text</code>
            <code>[Speaker Name: Dialogue text]</code>
        </div>
      </div>
    </div>
  );
};

export default ScriptInput;
