import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Undo2, Redo2, ChevronDown, Minus, Plus, IndentIncrease, IndentDecrease,
  Type
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const FONT_FAMILIES = [
  'Sans Serif', 'Serif', 'Monospace', 'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS'
];

const FONT_SIZES = ['1', '2', '3', '4', '5', '6', '7'];
const FONT_SIZE_LABELS: Record<string, string> = {
  '1': '10px', '2': '13px', '3': '16px', '4': '18px', '5': '24px', '6': '32px', '7': '48px'
};

const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#cccccc',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#a855f7',
  '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb',
];

const HIGHLIGHT_COLORS = [
  'transparent', '#fef08a', '#bbf7d0', '#bfdbfe', '#e9d5ff',
  '#fecaca', '#fed7aa', '#fde68a', '#d9f99d', '#a5f3fc',
  '#c4b5fd', '#fbcfe8', '#99f6e4', '#c7d2fe', '#f5d0fe',
];

export default function RichTextEditor({ value, onChange, placeholder = 'Write your content here...', minHeight = '250px' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showFontFamily, setShowFontFamily] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [currentFontFamily, setCurrentFontFamily] = useState('Sans Serif');
  const [currentFontSize, setCurrentFontSize] = useState('3');
  const isInitialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      if (value) {
        editorRef.current.innerHTML = value;
      }
      isInitialized.current = true;
    }
  }, [value]);

  const execCommand = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const closeAllDropdowns = () => {
    setShowFontFamily(false);
    setShowFontSize(false);
    setShowTextColor(false);
    setShowHighlight(false);
  };

  const ToolbarButton = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); closeAllDropdowns(); onClick(); }}
      title={title}
      className={`p-1.5 rounded-md transition-all duration-150 hover:bg-gray-200 ${active ? 'bg-gray-200 text-blue-600' : 'text-gray-600'}`}
      style={{ minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-gray-300 mx-1 shrink-0" />;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex-wrap">
        {/* Undo / Redo */}
        <ToolbarButton onClick={() => execCommand('undo')} title="Undo">
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('redo')} title="Redo">
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Font Family Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowFontFamily(!showFontFamily); setShowFontSize(false); setShowTextColor(false); setShowHighlight(false); }}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors min-w-[90px]"
            title="Font Family"
          >
            <span className="truncate">{currentFontFamily}</span>
            <ChevronDown className="w-3 h-3 shrink-0" />
          </button>
          {showFontFamily && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-48 max-h-56 overflow-y-auto py-1">
              {FONT_FAMILIES.map(font => (
                <button
                  key={font}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const fontMap: Record<string, string> = { 'Sans Serif': 'Arial, sans-serif', 'Serif': 'Georgia, serif', 'Monospace': 'Courier New, monospace' };
                    execCommand('fontName', fontMap[font] || font);
                    setCurrentFontFamily(font);
                    setShowFontFamily(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  style={{ fontFamily: font === 'Sans Serif' ? 'Arial, sans-serif' : font === 'Serif' ? 'Georgia, serif' : font === 'Monospace' ? 'Courier New, monospace' : font }}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* Font Size Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowFontSize(!showFontSize); setShowFontFamily(false); setShowTextColor(false); setShowHighlight(false); }}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
            title="Font Size"
          >
            <Type className="w-3.5 h-3.5" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {showFontSize && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 w-32 py-1">
              {FONT_SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execCommand('fontSize', size);
                    setCurrentFontSize(size);
                    setShowFontSize(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${currentFontSize === size ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                >
                  {FONT_SIZE_LABELS[size]} {size === '3' && '(default)'}
                </button>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* Bold / Italic / Underline */}
        <ToolbarButton onClick={() => execCommand('bold')} title="Bold (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('italic')} title="Italic (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('underline')} title="Underline (Ctrl+U)">
          <Underline className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('strikeThrough')} title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Text Color */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowTextColor(!showTextColor); setShowHighlight(false); setShowFontFamily(false); setShowFontSize(false); }}
            className="flex items-center gap-0.5 p-1.5 rounded-md hover:bg-gray-200 transition-colors text-gray-600"
            title="Text Color"
          >
            <span className="text-sm font-bold" style={{ borderBottom: '3px solid #ef4444' }}>A</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showTextColor && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 w-48">
              <p className="text-xs text-gray-500 mb-2 font-medium">Text Color</p>
              <div className="grid grid-cols-5 gap-1.5">
                {TEXT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); execCommand('foreColor', color); setShowTextColor(false); }}
                    className="w-7 h-7 rounded-md border border-gray-200 hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowHighlight(!showHighlight); setShowTextColor(false); setShowFontFamily(false); setShowFontSize(false); }}
            className="flex items-center gap-0.5 p-1.5 rounded-md hover:bg-gray-200 transition-colors text-gray-600"
            title="Highlight Color"
          >
            <span className="text-sm font-bold px-0.5 rounded" style={{ backgroundColor: '#fef08a' }}>A</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showHighlight && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 w-48">
              <p className="text-xs text-gray-500 mb-2 font-medium">Highlight Color</p>
              <div className="grid grid-cols-5 gap-1.5">
                {HIGHLIGHT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); execCommand('hiliteColor', color); setShowHighlight(false); }}
                    className="w-7 h-7 rounded-md border border-gray-200 hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color }}
                    title={color === 'transparent' ? 'None' : color}
                  >
                    {color === 'transparent' && <Minus className="w-4 h-4 text-gray-400 mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* Alignment */}
        <ToolbarButton onClick={() => execCommand('justifyLeft')} title="Align Left">
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('justifyCenter')} title="Align Center">
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('justifyRight')} title="Align Right">
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('justifyFull')} title="Justify">
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Numbered List">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Bulleted List">
          <List className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Indent */}
        <ToolbarButton onClick={() => execCommand('indent')} title="Increase Indent">
          <IndentIncrease className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('outdent')} title="Decrease Indent">
          <IndentDecrease className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Blockquote */}
        <ToolbarButton onClick={() => execCommand('formatBlock', 'blockquote')} title="Blockquote">
          <Quote className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={(e) => {
          // Allow rich paste but clean up
          setTimeout(() => handleInput(), 0);
        }}
        onBlur={handleInput}
        className="px-4 py-3 text-sm text-gray-900 outline-none overflow-y-auto"
        style={{ minHeight, maxHeight: '500px' }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {/* Placeholder styling via CSS-in-JS */}
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
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          margin: 8px 0;
          padding: 8px 16px;
          color: #6b7280;
          font-style: italic;
          background: #f9fafb;
          border-radius: 0 8px 8px 0;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 24px;
          margin: 8px 0;
        }
        [contenteditable] li {
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
}
