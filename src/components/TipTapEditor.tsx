import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import CharacterCount from '@tiptap/extension-character-count';
import DOMPurify from 'dompurify';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Link2,
  Image as ImageIcon,
  Images,
  Youtube as YoutubeIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  RemoveFormatting,
} from 'lucide-react';
import MediaLibraryModal from './MediaLibraryModal';
import { MediaAssetRecord } from '../services/contentService';
import { cn } from '../lib/utils';

interface TipTapEditorProps {
  contentHtml: string;
  contentJson?: any;
  onChange: (payload: { html: string; json: any; words: number; readingMinutes: number }) => void;
  placeholder?: string;
  language?: 'en' | 'ta';
}

export default function TipTapEditor({
  contentHtml,
  contentJson,
  onChange,
  placeholder = 'Write your story here...',
  language = 'en',
}: TipTapEditorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [galleryMode, setGalleryMode] = useState(false);

  const initialContent = React.useMemo(() => {
    const hasRichHtml = /<(strong|b|em|i|u|h[1-6]|ul|ol|blockquote|img|a)\b/i.test(contentHtml || '');
    if (contentJson && typeof contentJson === 'object' && contentJson.type === 'doc') {
      // If a legacy post had only plain-text paragraph JSON stub generated during SQL backfill while rich HTML exists, load sanitized HTML
      const isPlainParagraphStub =
        Array.isArray(contentJson.content) &&
        contentJson.content.every((n: any) => n.type === 'paragraph' && (!n.content || n.content.every((c: any) => !c.marks)));
      if (hasRichHtml && isPlainParagraphStub) {
        return DOMPurify.sanitize(contentHtml);
      }
      return contentJson;
    }
    return contentHtml ? DOMPurify.sanitize(contentHtml) : '';
  }, [contentHtml, contentJson]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: false,
        underline: false,
      } as any),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
          class: 'text-[#D4191F] underline underline-offset-2',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl my-4 max-h-[520px] w-auto mx-auto shadow-sm',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({ placeholder }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-xl overflow-hidden my-4',
        },
      }),
      CharacterCount,
    ],
    content: initialContent,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const json = ed.getJSON();
      const words = ed.storage.characterCount?.words?.() || 0;
      const readingMinutes = Math.max(1, Math.ceil(words / 200));
      onChange({ html, json, words, readingMinutes });
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose-base max-w-none px-6 py-5 min-h-[420px] outline-none text-gray-900 leading-relaxed',
          language === 'ta' && 'font-[Noto_Sans_Tamil,sans-serif]'
        ),
        lang: language,
      },
    },
  });

  // Sync external revision restore cleanly
  useEffect(() => {
    if (!editor) return;
    if (contentJson && contentJson.type === 'doc') {
      const current = JSON.stringify(editor.getJSON());
      const incoming = JSON.stringify(contentJson);
      if (current !== incoming && editor.isEmpty) {
        editor.commands.setContent(contentJson, { emitUpdate: false });
      }
    }
  }, [editor, contentJson]);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter link URL (https://...)', previousUrl);
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const safeUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: safeUrl }).run();
  };

  const addYoutube = () => {
    const url = window.prompt('Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)');
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url.trim() });
  };

  const handleSelectSingleImage = (asset: MediaAssetRecord) => {
    editor
      .chain()
      .focus()
      .setImage({
        src: asset.public_url,
        alt: asset.alt_text || asset.file_name,
        title: asset.caption || asset.credit || undefined,
      })
      .run();
    if (asset.caption || asset.credit) {
      const creditText = [asset.caption, asset.credit ? `Credit: ${asset.credit}` : ''].filter(Boolean).join(' — ');
      editor.chain().focus().insertContent(`<p><em>${creditText}</em></p>`).run();
    }
  };

  const handleSelectGallery = (assets: MediaAssetRecord[]) => {
    assets.forEach((asset) => {
      editor
        .chain()
        .focus()
        .setImage({
          src: asset.public_url,
          alt: asset.alt_text || asset.file_name,
          title: asset.caption || undefined,
        })
        .run();
    });
  };

  const ToolBtn = ({
    active,
    onClick,
    title,
    children,
    disabled,
  }: {
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded-lg text-xs transition-colors flex items-center justify-center',
        active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );

  const wordCount = editor.storage.characterCount?.words?.() || 0;
  const charCount = editor.storage.characterCount?.characters?.() || 0;

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:border-[#D4191F] transition-all">
      {/* Rich Toolbar */}
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center gap-1 sticky top-0 z-10">
        <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 size={15} />
        </ToolBtn>
        <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 size={15} />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolBtn
          title="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={15} />
        </ToolBtn>
        <ToolBtn
          title="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={15} />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolBtn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={15} />
        </ToolBtn>
        <ToolBtn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={15} />
        </ToolBtn>
        <ToolBtn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={15} />
        </ToolBtn>
        <ToolBtn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={15} />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolBtn
          title="Align Left"
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft size={15} />
        </ToolBtn>
        <ToolBtn
          title="Align Center"
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter size={15} />
        </ToolBtn>
        <ToolBtn
          title="Align Right"
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight size={15} />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolBtn
          title="Bullet List"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </ToolBtn>
        <ToolBtn
          title="Ordered List"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </ToolBtn>
        <ToolBtn
          title="Blockquote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={15} />
        </ToolBtn>
        <ToolBtn
          title="Code Block"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 size={15} />
        </ToolBtn>
        <ToolBtn title="Horizontal Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={15} />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolBtn title="Insert/Edit Link" active={editor.isActive('link')} onClick={setLink}>
          <Link2 size={15} />
        </ToolBtn>
        <ToolBtn
          title="Insert Image from Library"
          onClick={() => {
            setGalleryMode(false);
            setShowImagePicker(true);
          }}
        >
          <ImageIcon size={15} />
        </ToolBtn>
        <ToolBtn
          title="Insert Photo Gallery"
          onClick={() => {
            setGalleryMode(true);
            setShowImagePicker(true);
          }}
        >
          <Images size={15} />
        </ToolBtn>
        <ToolBtn title="Embed YouTube Video" onClick={addYoutube}>
          <YoutubeIcon size={15} />
        </ToolBtn>
        <ToolBtn
          title="Clear Formatting"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          <RemoveFormatting size={15} />
        </ToolBtn>
      </div>

      {/* Editor Canvas */}
      <div className="max-h-[650px] overflow-y-auto bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Footer Telemetry */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-[11px] text-gray-500">
        <span>{language === 'ta' ? 'Tamil (ta) Editorial Editor' : 'English (en) Editorial Editor'}</span>
        <span>
          {wordCount} words · {charCount} chars · ~{Math.max(1, Math.ceil(wordCount / 200))} min read
        </span>
      </div>

      <MediaLibraryModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        multiple={galleryMode}
        accept="image"
        title={galleryMode ? 'Select Gallery Images' : 'Insert Inline Image'}
        onSelect={handleSelectSingleImage}
        onSelectMultiple={handleSelectGallery}
      />

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror h2 { font-size: 1.4rem; font-weight: 800; margin: 1.25rem 0 0.65rem; }
        .ProseMirror h3 { font-size: 1.15rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .ProseMirror p { margin-bottom: 0.9rem; line-height: 1.75; }
        .ProseMirror blockquote {
          border-left: 4px solid #D4191F;
          background: #fafafa;
          padding: 0.75rem 1.25rem;
          margin: 1rem 0;
          color: #4b5563;
          font-style: italic;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.75rem 0; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.75rem 0; }
        .ProseMirror pre { background: #111827; color: #f9fafb; padding: 0.9rem; border-radius: 0.75rem; font-size: 0.85rem; overflow-x: auto; margin: 1rem 0; }
      `}</style>
    </div>
  );
}
