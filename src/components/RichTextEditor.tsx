import React, { useRef, useEffect, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write your content here...', minHeight = '250px' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      if (value) {
        editorRef.current.innerHTML = value;
      }
      isInitialized.current = true;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
      {/* Simple Content Box (Toolbar removed as requested) */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={(e) => {
          // Allow rich paste but clean up
          setTimeout(() => handleInput(), 0);
        }}
        onBlur={handleInput}
        className="px-6 py-5 text-sm text-gray-900 outline-none overflow-y-auto leading-relaxed min-h-[300px]"
        style={{ minHeight, maxHeight: '600px' }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style>{`
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }
        [contenteditable] {
          position: relative;
        }
        [contenteditable] p {
          margin-bottom: 1rem;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          margin: 1.5rem 0;
          padding: 1rem 1.5rem;
          color: #6b7280;
          font-style: italic;
          background: #f9fafb;
          border-radius: 0 8px 8px 0;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
        }
        [contenteditable] li {
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}
