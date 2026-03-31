import React, { useState } from 'react';
import { X, Send, Smile, Type, Palette, Loader2 } from 'lucide-react';
import { storyService } from '../../services/storyService';
import { cn } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';

const COLORS = [
  '#E91E63', // Red/Pink
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#4CAF50', // Green
  '#009688', // Teal
  '#3F51B5', // Indigo
  '#FF9800', // Orange
];

interface TextStoryEditorProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TextStoryEditor({ onClose, onSuccess }: TextStoryEditorProps) {
  const [text, setText] = useState('');
  const [colorIndex, setColorIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { success, error } = useToast();

  const cycleColor = () => {
    setColorIndex((colorIndex + 1) % COLORS.length);
  };

  const handleSend = async () => {
    if (!text.trim() || isUploading) return;
    setIsUploading(true);
    try {
      await storyService.createStory({
        type: 'text',
        textContent: text.trim(),
        backgroundColor: COLORS[colorIndex],
      });
      success('Text story posted successfully!');
      onSuccess();
    } catch (err: any) {
      error('Failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="rounded-[2.5rem] w-full max-w-lg aspect-[9/16] relative overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 transition-colors duration-500"
        style={{ backgroundColor: COLORS[colorIndex] }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="h-16 px-6 flex items-center justify-between z-20">
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all">
            <X className="w-7 h-7" />
          </button>
          
          <div className="flex items-center gap-1">
            <button className="p-2 text-white/40 cursor-not-allowed"><Smile className="w-6 h-6" /></button>
            <button className="p-2 text-white/40 cursor-not-allowed"><Type className="w-6 h-6" /></button>
            <button 
              onClick={cycleColor}
              className="p-2 text-white hover:bg-white/10 rounded-full transition-all active:rotate-45"
            >
              <Palette className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a status"
            className="w-full bg-transparent border-none outline-none text-white text-3xl font-bold text-center placeholder:text-white/30 resize-none max-h-[60vh] overflow-y-auto no-scrollbar"
            maxLength={1000}
          />
        </div>

        {/* Footer */}
        <div className="p-8 flex justify-end items-end z-20">
          <button 
            onClick={handleSend}
            disabled={!text.trim() || isUploading}
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-95",
              text.trim() ? "bg-white text-gray-900" : "bg-white/10 text-white/20 cursor-not-allowed"
            )}
          >
            {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
}
