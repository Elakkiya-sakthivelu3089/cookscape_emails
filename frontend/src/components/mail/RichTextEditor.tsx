import React, { useState, useRef, useEffect } from 'react';
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Smile,
  Palette,
  ChevronDown,
  PenTool,
  Check,
  RemoveFormatting,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  showFormattingBar?: boolean;
  onToggleFormattingBar?: () => void;
  onInsertSignature?: () => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your message here...',
  showFormattingBar = true,
  onInsertSignature,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Dropdown states
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Current formatting state
  const [currentFont, setCurrentFont] = useState('Sans Serif');
  const [currentSize, setCurrentSize] = useState('Normal');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Synchronize incoming value if changed externally (e.g. from templates)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateFormatState();
  };

  const updateFormatState = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
    setIsUnderline(document.queryCommandState('underline'));
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateFormatState();
  };

  const fonts = [
    { label: 'Sans Serif', value: 'Inter, Segoe UI, sans-serif' },
    { label: 'Serif', value: 'Georgia, serif' },
    { label: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
    { label: 'Monospace', value: 'ui-monospace, Menlo, Monaco, monospace' },
    { label: 'Garamond', value: 'Garamond, serif' },
    { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
  ];

  const fontSizes = [
    { label: 'Small', size: '2', px: '11px' },
    { label: 'Normal', size: '3', px: '13px' },
    { label: 'Large', size: '5', px: '16px' },
    { label: 'Huge', size: '7', px: '22px' },
  ];

  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#ffffff',
    '#c59b27', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7',
    '#a64d79', '#cc0000', '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3',
  ];

  const emojis = ['👍', '✨', '🏢', '📐', '🛋️', '🎨', '💼', '🤝', '✅', '📋', '📁', '💡', '🌟', '☕', '🏡', '🔑'];

  const insertLink = () => {
    const url = prompt('Enter the link destination URL (https://...):');
    if (url) {
      exec('createLink', url);
    }
  };

  const insertTable = () => {
    const tableHtml = `
      <table style="width:100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left; font-size: 12px;">Item / Description</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-size: 12px;">Qty</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px;">Rate (₹)</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 12px;">Modular Kitchen Carcass & Finish</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-size: 12px;">1 Set</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px;">1,85,000</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px;">1,85,000</td>
          </tr>
        </tbody>
      </table><p><br/></p>
    `;
    exec('insertHTML', tableHtml);
  };

  return (
    <div className="flex-1 flex flex-col min-h-[220px] relative">
      {/* 1. Gmail-Style Formatting Pill Toolbar */}
      {showFormattingBar && (
        <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm mb-2 flex items-center flex-wrap gap-0.5 text-slate-700 dark:text-slate-200 select-none transition-colors">
          {/* Undo & Redo */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => exec('undo')}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec('redo')}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Font Family Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowFontDropdown(!showFontDropdown);
                setShowSizeDropdown(false);
                setShowColorDropdown(false);
                setShowAlignDropdown(false);
                setShowListDropdown(false);
              }}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium"
            >
              <span className="truncate max-w-[85px]">{currentFont}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showFontDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowFontDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1 z-40 text-xs">
                  {fonts.map((f) => (
                    <button
                      key={f.label}
                      type="button"
                      onClick={() => {
                        exec('fontName', f.value);
                        setCurrentFont(f.label);
                        setShowFontDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-red-500/15 hover:text-red-700 dark:hover:text-red-300 flex items-center justify-between"
                      style={{ fontFamily: f.value }}
                    >
                      <span>{f.label}</span>
                      {currentFont === f.label && <Check className="w-3.5 h-3.5 text-red-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Font Size Dropdown (TT) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSizeDropdown(!showSizeDropdown);
                setShowFontDropdown(false);
                setShowColorDropdown(false);
                setShowAlignDropdown(false);
                setShowListDropdown(false);
              }}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-serif font-bold"
              title="Font Size"
            >
              <span>Tᴛ</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showSizeDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSizeDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1 z-40 text-xs">
                  {fontSizes.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => {
                        exec('fontSize', s.size);
                        setCurrentSize(s.label);
                        setShowSizeDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-red-500/15 hover:text-red-700 dark:hover:text-red-300 flex items-center justify-between"
                    >
                      <span style={{ fontSize: s.px }}>{s.label}</span>
                      {currentSize === s.label && <Check className="w-3.5 h-3.5 text-red-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Bold, Italic, Underline, Strike */}
          <div className="flex items-center space-x-0.5">
            <button
              type="button"
              onClick={() => exec('bold')}
              className={`p-1.5 rounded-lg font-bold text-xs transition-colors ${
                isBold
                  ? 'bg-red-500/20 text-red-700 dark:text-red-300 font-extrabold'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => exec('italic')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                isItalic
                  ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => exec('underline')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                isUnderline
                  ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => exec('strikeThrough')}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Color Palette (A ▾) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorDropdown(!showColorDropdown);
                setShowFontDropdown(false);
                setShowSizeDropdown(false);
                setShowAlignDropdown(false);
                setShowListDropdown(false);
              }}
              className="flex items-center space-x-1 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold"
              title="Text Color"
            >
              <div className="flex flex-col items-center">
                <span>A</span>
                <span className="w-3 h-0.5 bg-red-600 rounded" />
              </div>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {showColorDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowColorDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-3 z-40">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                    Text Color
                  </span>
                  <div className="grid grid-cols-7 gap-1.5">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          exec('foreColor', c);
                          setShowColorDropdown(false);
                        }}
                        className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 hover:scale-125 transition-transform"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Alignment Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowAlignDropdown(!showAlignDropdown);
                setShowFontDropdown(false);
                setShowSizeDropdown(false);
                setShowColorDropdown(false);
                setShowListDropdown(false);
              }}
              className="flex items-center space-x-1 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs"
              title="Align"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {showAlignDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowAlignDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1 z-40 space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      exec('justifyLeft');
                      setShowAlignDropdown(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Align Left"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exec('justifyCenter');
                      setShowAlignDropdown(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Align Center"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exec('justifyRight');
                      setShowAlignDropdown(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Align Right"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exec('justifyFull');
                      setShowAlignDropdown(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Justify"
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Lists & Indentation Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowListDropdown(!showListDropdown);
                setShowFontDropdown(false);
                setShowSizeDropdown(false);
                setShowColorDropdown(false);
                setShowAlignDropdown(false);
              }}
              className="flex items-center space-x-1 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-xs"
              title="Lists"
            >
              <List className="w-3.5 h-3.5" />
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {showListDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowListDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1 z-40 space-x-1">
                  <button
                    type="button"
                    onClick={() => {
                      exec('insertUnorderedList');
                      setShowListDropdown(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Bulleted list"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exec('insertOrderedList');
                      setShowListDropdown(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Numbered list"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exec('outdent');
                      setShowListDropdown(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                    title="Decrease indent"
                  >
                    ⇤
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exec('indent');
                      setShowListDropdown(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                    title="Increase indent"
                  >
                    ⇥
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

          {/* Quick Insert Table for Interior Estimations */}
          <button
            type="button"
            onClick={insertTable}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            title="Insert Estimate / BOQ Table"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>

          {/* Insert Hyperlink */}
          <button
            type="button"
            onClick={insertLink}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            title="Insert Link (Ctrl+K)"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          {/* Emoji Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              title="Insert Emoji"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            {showEmojiPicker && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)} />
                <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 z-40 grid grid-cols-4 gap-1.5 text-base">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        exec('insertText', emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Clear Formatting */}
          <button
            type="button"
            onClick={() => exec('removeFormat')}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 ml-auto"
            title="Clear formatting"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. WYSIWYG Editable Document Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateFormatState}
        onMouseUp={updateFormatState}
        className="flex-1 bg-slate-50/50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 text-slate-900 dark:text-slate-100 text-xs leading-relaxed focus:outline-none focus:border-red-500/60 overflow-y-auto min-h-[180px] prose dark:prose-invert max-w-none transition-colors"
        style={{
          minHeight: '180px',
        }}
        data-placeholder={placeholder}
      />
    </div>
  );
};
