import React, { useState, useEffect } from 'react';
import { X, Send, Smile, Type, Pencil, Trash2, Loader2, Music, Download, MoreVertical } from 'lucide-react';
import { storyService } from '../../services/storyService';
import { useToast } from '../../context/ToastContext';

interface MediaStoryEditorProps {
  file: File;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MediaStoryEditor({ file, onClose, onSuccess }: MediaStoryEditorProps) {
  const [preview, setPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [allowCommenting, setAllowCommenting] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);
  const [visibility, setVisibility] = useState<'Your Story' | 'Close Friends'>('Your Story');
  const isVideo = file.type.startsWith('video/');
  const { error, success } = useToast();

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
        allow_comments: allowCommenting,
        allow_sharing: allowSharing
      });
      success('Story posted successfully!');
      onSuccess();
    } catch (err: any) {
      error('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (!preview) return;
    const a = document.createElement('a');
    a.href = preview;
    a.download = `story-${Date.now()}${isVideo ? '.mp4' : '.jpg'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-[#1a1a1a] rounded-[2.5rem] w-full max-w-lg aspect-[9/16] relative overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300"
        onClick={e => { e.stopPropagation(); setShowMoreMenu(false); }}
      >
        {/* Main Preview (Behind everything) */}
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {isVideo ? (
            <video src={preview} controls className="w-full h-full object-contain" />
          ) : (
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
          )}
        </div>

        {/* Top Left: Back button */}
        <div className="absolute top-0 left-0 right-0 h-16 px-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/60 to-transparent">
          <button onClick={onClose} className="p-2 text-white/90 hover:bg-white/10 rounded-full transition-all bg-black/20 backdrop-blur-md">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Top Right: Tools panel (vertical) */}
        <div className="absolute top-20 right-4 flex flex-col items-center gap-5 z-20 animate-in fade-in slide-in-from-right-8 duration-500 delay-100 fill-mode-both">

          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-12 h-12 flex items-center justify-center text-white bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full transition-all shadow-lg hover:scale-105 active:scale-95">
                <MoreVertical className="w-6 h-6" />
              </div>
            </button>
            
            {showMoreMenu && (
              <div className="absolute top-0 right-14 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-30 animate-in fade-in slide-in-from-right-2">
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <p className="text-white text-sm font-bold">Story Options</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setAllowCommenting(!allowCommenting); }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <span className="text-sm text-white">Turn OFF Commenting</span>
                  <div className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${!allowCommenting ? 'bg-red-500' : 'bg-white/20'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${!allowCommenting ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setAllowSharing(!allowSharing); }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <span className="text-sm text-white">Turn OFF Sharing</span>
                  <div className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${!allowSharing ? 'bg-red-500' : 'bg-white/20'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${!allowSharing ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Floating Send Button */}
        <div className="absolute bottom-6 right-6 z-20">
            <button 
              onClick={handleSend}
              disabled={isUploading}
              className="w-14 h-14 bg-white hover:bg-gray-100 disabled:bg-white/20 disabled:text-white/40 text-black rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-95 group"
            >
              {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
            </button>
        </div>
      </div>
    </div>
  );
}
