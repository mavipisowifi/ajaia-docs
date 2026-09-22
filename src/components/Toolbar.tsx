import React, { useState, useRef, useEffect } from 'react';
import {
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
  Code,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Image as ImageIcon,
  Highlighter,
  Palette,
  RemoveFormatting,
  Minus,
  Sparkles,
  ChevronDown,
  Lock,
} from 'lucide-react';

interface ToolbarProps {
  onCommand: (command: string, value?: string) => void;
  onFormatBlock: (tag: string) => void;
  onInsertImage: () => void;
  onInsertLink: () => void;
  onOpenAi: () => void;
  onUndo: () => void;
  onRedo: () => void;
  disabled?: boolean;
  activeFormats: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    block: string;
    align: string;
  };
}

const HEADING_OPTIONS = [
  { label: 'Normal text', value: 'p', className: 'text-sm' },
  { label: 'Title', value: 'h1', className: 'text-xl font-bold' },
  { label: 'Heading 1', value: 'h1', className: 'text-lg font-bold' },
  { label: 'Heading 2', value: 'h2', className: 'text-base font-semibold' },
  { label: 'Heading 3', value: 'h3', className: 'text-sm font-semibold' },
  { label: 'Quote', value: 'blockquote', className: 'text-sm italic border-l-2 border-blue-500 pl-2' },
  { label: 'Code Block', value: 'pre', className: 'text-xs font-mono bg-zinc-100 p-1 rounded' },
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '24px', '32px'];

const TEXT_COLORS = [
  { label: 'Default', value: '#1e293b' },
  { label: 'Slate', value: '#64748b' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Purple', value: '#7c3aed' },
];

const HIGHLIGHT_COLORS = [
  { label: 'None', value: 'transparent' },
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Cyan', value: '#bae6fd' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Orange', value: '#fed7aa' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  onCommand,
  onFormatBlock,
  onInsertImage,
  onInsertLink,
  onOpenAi,
  onUndo,
  onRedo,
  disabled = false,
  activeFormats,
}) => {
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [showTextColorMenu, setShowTextColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);

  const blockMenuRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  const textColorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (blockMenuRef.current && !blockMenuRef.current.contains(event.target as Node)) {
        setShowBlockMenu(false);
      }
      if (fontSizeRef.current && !fontSizeRef.current.contains(event.target as Node)) {
        setShowFontSizeMenu(false);
      }
      if (textColorRef.current && !textColorRef.current.contains(event.target as Node)) {
        setShowTextColorMenu(false);
      }
      if (highlightRef.current && !highlightRef.current.contains(event.target as Node)) {
        setShowHighlightMenu(false);
      }
    }
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentHeadingLabel =
    HEADING_OPTIONS.find((h) => h.value === activeFormats.block)?.label || 'Normal text';

  return (
    <div
      className={`bg-zinc-50 border-b border-zinc-200/90 px-3 py-1.5 flex items-center gap-1 flex-wrap sticky top-[53px] z-20 shadow-2xs select-none transition-opacity ${
        disabled ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      {disabled && (
        <div className="absolute inset-0 bg-zinc-100/50 backdrop-blur-[0.5px] z-30 flex items-center justify-center pointer-events-auto">
          <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-amber-200 text-xs font-medium text-amber-800 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>View-only mode: toolbar disabled</span>
          </div>
        </div>
      )}

      {/* History Buttons */}
      <div className="flex items-center gap-0.5 pr-1 border-r border-zinc-200">
        <button
          id="toolbar-btn-undo"
          onClick={onUndo}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          id="toolbar-btn-redo"
          onClick={onRedo}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Paragraph / Heading Style Dropdown */}
      <div className="relative pl-1" ref={blockMenuRef}>
        <button
          id="toolbar-btn-heading-select"
          onClick={() => setShowBlockMenu(!showBlockMenu)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-zinc-700 hover:bg-zinc-200/70 transition-colors w-28 justify-between border border-transparent hover:border-zinc-300"
          title="Styles"
        >
          <span className="truncate">{currentHeadingLabel}</span>
          <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
        </button>

        {showBlockMenu && (
          <div className="absolute left-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-40">
            {HEADING_OPTIONS.map((opt) => (
              <button
                key={opt.value + opt.label}
                onClick={() => {
                  onFormatBlock(opt.value);
                  setShowBlockMenu(false);
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-zinc-50 flex items-center justify-between ${opt.className}`}
              >
                <span>{opt.label}</span>
                {activeFormats.block === opt.value && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Font Size Selector */}
      <div className="relative" ref={fontSizeRef}>
        <button
          id="toolbar-btn-font-size"
          onClick={() => setShowFontSizeMenu(!showFontSizeMenu)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-zinc-700 hover:bg-zinc-200/70 transition-colors border border-transparent hover:border-zinc-300"
          title="Font Size"
        >
          <span>Size</span>
          <ChevronDown className="w-3 h-3 text-zinc-400" />
        </button>

        {showFontSizeMenu && (
          <div className="absolute left-0 mt-1 w-28 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-40">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => {
                  onCommand('fontSize', size === '12px' ? '2' : size === '14px' ? '3' : size === '18px' ? '4' : size === '24px' ? '5' : '6');
                  setShowFontSizeMenu(false);
                }}
                className="w-full text-left px-3 py-1 hover:bg-zinc-50 text-xs text-zinc-700"
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-5 bg-zinc-200 mx-0.5"></div>

      {/* Core Inline Formats: Bold, Italic, Underline, Strikethrough */}
      <div className="flex items-center gap-0.5">
        <button
          id="toolbar-btn-bold"
          onClick={() => onCommand('bold')}
          className={`p-1.5 rounded transition-colors ${
            activeFormats.bold ? 'bg-zinc-200 text-blue-700 font-bold' : 'hover:bg-zinc-200/70 text-zinc-700'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          id="toolbar-btn-italic"
          onClick={() => onCommand('italic')}
          className={`p-1.5 rounded transition-colors ${
            activeFormats.italic ? 'bg-zinc-200 text-blue-700' : 'hover:bg-zinc-200/70 text-zinc-700'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          id="toolbar-btn-underline"
          onClick={() => onCommand('underline')}
          className={`p-1.5 rounded transition-colors ${
            activeFormats.underline ? 'bg-zinc-200 text-blue-700' : 'hover:bg-zinc-200/70 text-zinc-700'
          }`}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>

        <button
          id="toolbar-btn-strikethrough"
          onClick={() => onCommand('strikeThrough')}
          className={`p-1.5 rounded transition-colors ${
            activeFormats.strikethrough ? 'bg-zinc-200 text-blue-700' : 'hover:bg-zinc-200/70 text-zinc-700'
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
      </div>

      <div className="w-[1px] h-5 bg-zinc-200 mx-0.5"></div>

      {/* Text Color Picker */}
      <div className="relative" ref={textColorRef}>
        <button
          id="toolbar-btn-text-color"
          onClick={() => setShowTextColorMenu(!showTextColorMenu)}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors flex items-center gap-0.5"
          title="Text Color"
        >
          <Palette className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5 text-zinc-400" />
        </button>

        {showTextColorMenu && (
          <div className="absolute left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-zinc-200 z-40 grid grid-cols-4 gap-1.5 w-36">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  onCommand('foreColor', c.value);
                  setShowTextColorMenu(false);
                }}
                className="w-6 h-6 rounded-full border border-zinc-300 flex items-center justify-center hover:scale-110 transition-transform"
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        )}
      </div>

      {/* Highlight Color Picker */}
      <div className="relative" ref={highlightRef}>
        <button
          id="toolbar-btn-highlight"
          onClick={() => setShowHighlightMenu(!showHighlightMenu)}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors flex items-center gap-0.5"
          title="Highlight Color"
        >
          <Highlighter className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5 text-zinc-400" />
        </button>

        {showHighlightMenu && (
          <div className="absolute left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-zinc-200 z-40 grid grid-cols-3 gap-1.5 w-32">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  onCommand('hiliteColor', c.value);
                  setShowHighlightMenu(false);
                }}
                className="w-7 h-6 rounded border border-zinc-300 flex items-center justify-center hover:scale-105 transition-transform text-[10px]"
                style={{ backgroundColor: c.value === 'transparent' ? '#ffffff' : c.value }}
                title={c.label}
              >
                {c.value === 'transparent' ? '✕' : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-5 bg-zinc-200 mx-0.5"></div>

      {/* Alignment Buttons */}
      <div className="flex items-center gap-0.5">
        <button
          id="toolbar-btn-align-left"
          onClick={() => onCommand('justifyLeft')}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors"
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          id="toolbar-btn-align-center"
          onClick={() => onCommand('justifyCenter')}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors"
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          id="toolbar-btn-align-right"
          onClick={() => onCommand('justifyRight')}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors"
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          id="toolbar-btn-align-justify"
          onClick={() => onCommand('justifyFull')}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors"
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>
      </div>

      <div className="w-[1px] h-5 bg-zinc-200 mx-0.5"></div>

      {/* Lists & Structural elements */}
      <div className="flex items-center gap-0.5">
        <button
          id="toolbar-btn-unordered-list"
          onClick={() => onCommand('insertUnorderedList')}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors"
          title="Bulleted list (Ctrl+Shift+8)"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          id="toolbar-btn-ordered-list"
          onClick={() => onCommand('insertOrderedList')}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors"
          title="Numbered list (Ctrl+Shift+7)"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          id="toolbar-btn-blockquote"
          onClick={() => onFormatBlock('blockquote')}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors"
          title="Quote Block"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          id="toolbar-btn-horizontal-rule"
          onClick={() => onCommand('insertHorizontalRule')}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors"
          title="Horizontal Divider"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <div className="w-[1px] h-5 bg-zinc-200 mx-0.5"></div>

      {/* Insert Link & Image */}
      <div className="flex items-center gap-0.5">
        <button
          id="toolbar-btn-insert-link"
          onClick={onInsertLink}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          id="toolbar-btn-insert-image"
          onClick={onInsertImage}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors"
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          id="toolbar-btn-clear-format"
          onClick={() => onCommand('removeFormat')}
          className="p-1.5 rounded hover:bg-zinc-200/70 text-zinc-700 transition-colors"
          title="Clear formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>

      {/* Right Spacer + AI Button */}
      <div className="ml-auto pl-2">
        <button
          id="toolbar-btn-ai-assist"
          onClick={onOpenAi}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded text-xs font-semibold transition-colors"
          title="AI Assistant: Summarize, refine or generate"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Ask AI</span>
        </button>
      </div>
    </div>
  );
};
