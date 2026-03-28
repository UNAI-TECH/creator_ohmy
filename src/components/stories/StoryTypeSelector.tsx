import React from 'react';
import { Image, Type, Video, X } from 'lucide-react';

interface StoryTypeSelectorProps {
  onSelect: (type: 'media' | 'text') => void;
  onClose: () => void;
}

export default function StoryTypeSelector({ onSelect, onClose }: StoryTypeSelectorProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Add to Story</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400 font-bold" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <button 
            onClick={() => onSelect('media')}
            className="w-full group flex items-center gap-5 p-5 bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-100 rounded-2xl transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Image className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg group-hover:text-red-700">Photo / Video</div>
              <div className="text-sm text-gray-500 mt-0.5">Share a visual moment</div>
            </div>
          </button>

          <button 
            onClick={() => onSelect('text')}
            className="w-full group flex items-center gap-5 p-5 bg-gray-50 hover:bg-amber-50 border border-gray-100 hover:border-amber-100 rounded-2xl transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Type className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg group-hover:text-amber-700">Text Status</div>
              <div className="text-sm text-gray-500 mt-0.5">Share what's on your mind</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
