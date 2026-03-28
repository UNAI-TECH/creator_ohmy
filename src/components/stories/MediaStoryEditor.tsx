import React, { useState, useEffect } from 'react';
import { X, Send, Smile, Type, Pencil, Trash2, Loader2 } from 'lucide-react';
import { storyService } from '../../services/storyService';

interface MediaStoryEditorProps {
  file: File;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MediaStoryEditor({ file, onClose, onSuccess }: MediaStoryEditorProps) {
  const [preview, setPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const isVideo = file.type.startsWith('video/');

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSend = async () => {
    if (isUploading) return;
    setIsUploading(true);
    try {
      const mediaUrl = await storyService.uploadStoryMedia(file);
      await storyService.createStory({
        type: isVideo ? 'video' : 'image',
        mediaUrl,
        caption: caption.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-[#1a1a1a] rounded-[2.5rem] w-full max-w-lg aspect-[9/16] relative overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-16 px-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
          <button onClick={onClose} className="p-2 text-white/90 hover:bg-white/10 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-1">
            <button className="p-2 text-white/40 cursor-not-allowed"><Smile className="w-5 h-5" /></button>
            <button className="p-2 text-white/40 cursor-not-allowed"><Type className="w-5 h-5" /></button>
            <button className="p-2 text-white/40 cursor-not-allowed"><Pencil className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Main Preview */}
        <div className="flex-1 flex items-center justify-center bg-black">
          {isVideo ? (
            <video src={preview} controls className="w-full h-full object-contain" />
          ) : (
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
          )}
        </div>

        {/* Bottom Bar / Caption */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20">
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 flex items-center gap-2 shadow-2xl">
            <input 
              type="text" 
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-white/40 px-4 py-2"
            />
            <button 
              onClick={handleSend}
              disabled={isUploading}
              className="w-10 h-10 bg-red-600 hover:bg-red-700 disabled:bg-white/10 disabled:text-white/20 text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 group"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
