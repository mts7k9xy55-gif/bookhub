'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EditorProps {
  initialContent?: string;
  onUpdate?: (content: string) => void;
  editable?: boolean;
}

export default function Editor({ initialContent = '', onUpdate, editable = true }: EditorProps) {
  const [mounted, setMounted] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: '白紙に、最初の一文字を。',
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        // 余計な枠線を消し、美しいタイポグラフィを実現するクラス群
        class: `prose prose-stone prose-lg dark:prose-invert focus:outline-none min-h-[50vh] max-w-none text-gray-800 ${!editable ? 'select-text' : ''}`,
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  // initialContentが変わった（過去のコミットを読み込んだ）時に反映する
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  if (!mounted) return null;

  return (
    <div className="relative w-full mt-10">
      {editor && editable && (
        <BubbleMenu
          editor={editor}
          className="flex items-center space-x-1 bg-white shadow-sm border border-gray-100 rounded-full px-3 py-1.5 text-gray-500 backdrop-blur-md bg-white/90"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${editor.isActive('bold') ? 'text-black font-medium bg-gray-100' : ''}`}
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${editor.isActive('italic') ? 'text-black font-medium bg-gray-100' : ''}`}
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${editor.isActive('strike') ? 'text-black font-medium bg-gray-100' : ''}`}
          >
            <Strikethrough size={16} />
          </button>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}