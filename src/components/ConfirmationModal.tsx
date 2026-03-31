import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCancel}
      />
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
        <div className="p-8">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-2xl shrink-0",
              type === 'danger' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
            )}>
              {type === 'danger' ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{message}</p>
            </div>
            <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-3 mt-10">
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 px-4 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={cn(
                "flex-1 py-3.5 px-4 rounded-2xl text-sm font-bold text-white shadow-lg active:scale-95 transition-all",
                type === 'danger' 
                  ? "bg-red-600 hover:bg-red-700 shadow-red-200" 
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
