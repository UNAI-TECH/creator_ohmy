import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { X, Check } from 'lucide-react';
import { getCroppedImg } from '../lib/cropUtils';

interface CropperModalProps {
  imageSrc: string;
  aspectRatio: number;
  circularCrop?: boolean;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
}

export default function CropperModal({ imageSrc, aspectRatio, circularCrop, onCropComplete, onCancel }: CropperModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropComplete = useCallback((croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1e1e1e] w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col h-[70vh]">
        <div className="p-4 border-b border-white/10 flex justify-between items-center text-white">
          <h2 className="font-bold">Adjust Image</h2>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative flex-1 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={circularCrop ? "round" : "rect"}
            showGrid={!circularCrop}
            onCropChange={setCrop}
            onCropComplete={handleCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full sm:w-1/2 accent-red-500"
          />
          <div className="flex gap-4 w-full sm:w-auto">
            <button onClick={onCancel} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20">
              <Check className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
