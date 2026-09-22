import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Lock, ListFilter, ChevronRight, ChevronLeft, Eye } from 'lucide-react';
import { DocumentItem } from '../types';

interface EditorCanvasProps {
  document: DocumentItem;
  content: string;
  isReadOnly: boolean;
  onChange: (newContent: string) => void;
  onSelectionChange?: () => void;
}

export interface EditorCanvasRef {
  execCommand: (command: string, value?: string) => void;
  formatBlock: (tag: string) => void;
  insertHtml: (html: string) => void;
  getContent: () => string;
  focus: () => void;
}

interface OutlineItem {
  id: string;
  text: string;
  level: number;
}

export const EditorCanvas = forwardRef<EditorCanvasRef, EditorCanvasProps>(
  ({ document, content, isReadOnly, onChange, onSelectionChange }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [readingTime, setReadingTime] = useState(1);
    const [outline, setOutline] = useState<OutlineItem[]>([]);
    const [showOutline, setShowOutline] = useState(true);
    const isLocalUpdateRef = useRef(false);

    // Synchronize content to contentEditable without resetting cursor if user is actively typing
    useEffect(() => {
      if (editorRef.current && !isLocalUpdateRef.current) {
        if (editorRef.current.innerHTML !== content) {
          editorRef.current.innerHTML = content || '<p><br></p>';
          extractStatsAndOutline();
        }
      }
      isLocalUpdateRef.current = false;
    }, [content]);

    // Extract word count, character count, and outline headings
    const extractStatsAndOutline = () => {
      if (!editorRef.current) return;
      const text = editorRef.current.innerText || '';
      const words = text
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);
      setWordCount(words.length);
      setCharCount(text.length);
      setReadingTime(Math.max(1, Math.ceil(words.length / 200)));

      // Extract headings for outline
      const headings = editorRef.current.querySelectorAll('h1, h2, h3');
      const items: OutlineItem[] = [];
      headings.forEach((heading, idx) => {
        const textContent = heading.textContent?.trim() || `Heading ${idx + 1}`;
        const level = parseInt(heading.tagName.substring(1), 10);
        // Ensure element has an ID for jump navigation
        if (!heading.id) {
          heading.id = `heading-section-${idx}`;
        }
        items.push({
          id: heading.id,
          text: textContent,
          level,
        });
      });
      setOutline(items);
    };

    const handleInput = () => {
      if (!editorRef.current) return;
      isLocalUpdateRef.current = true;
      const newHtml = editorRef.current.innerHTML;
      onChange(newHtml);
      extractStatsAndOutline();
      if (onSelectionChange) onSelectionChange();
    };

    // Keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isReadOnly) {
        e.preventDefault();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        documentRefExec('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
        return;
      }
    };

    const documentRefExec = (command: string, value: string = '') => {
      if (isReadOnly) return;
      window.document.execCommand(command, false, value);
      handleInput();
    };

    useImperativeHandle(ref, () => ({
      execCommand: (command: string, value: string = '') => {
        documentRefExec(command, value);
      },
      formatBlock: (tag: string) => {
        if (isReadOnly) return;
        window.document.execCommand('formatBlock', false, `<${tag}>`);
        handleInput();
      },
      insertHtml: (html: string) => {
        if (isReadOnly) return;
        documentRefExec('insertHTML', html);
      },
      getContent: () => {
        return editorRef.current?.innerHTML || '';
      },
      focus: () => {
        editorRef.current?.focus();
      },
    }));

    const scrollToHeading = (id: string) => {
      const el = window.document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    return (
      <div className="flex-1 bg-zinc-100/90 relative overflow-y-auto min-h-screen py-6 px-3 sm:px-6 flex justify-center">
        {/* Collapsible Document Outline Panel (Left side floating) */}
        <aside
          className={`hidden xl:block fixed left-4 top-28 z-10 transition-all duration-200 ${
            showOutline ? 'w-56' : 'w-10'
          }`}
        >
          <div className="bg-white/90 backdrop-blur-sm border border-zinc-200/90 rounded-xl shadow-xs overflow-hidden">
            <div className="p-2 border-b border-zinc-100 flex items-center justify-between">
              {showOutline && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 pl-1">
                  <ListFilter className="w-3.5 h-3.5 text-blue-600" />
                  <span>Document Outline</span>
                </div>
              )}
              <button
                id="toggle-outline-btn"
                onClick={() => setShowOutline(!showOutline)}
                className="p-1 hover:bg-zinc-100 rounded text-zinc-500 ml-auto"
                title={showOutline ? 'Collapse outline' : 'Expand outline'}
              >
                {showOutline ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showOutline && (
              <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                {outline.length === 0 ? (
                  <p className="text-[11px] text-zinc-400 p-2 italic">
                    Headings added to the document will show here as an outline.
                  </p>
                ) : (
                  outline.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToHeading(item.id)}
                      className={`w-full text-left text-xs text-zinc-600 hover:text-blue-600 hover:bg-blue-50/50 rounded px-1.5 py-1 truncate transition-colors ${
                        item.level === 1 ? 'font-semibold' : item.level === 2 ? 'pl-3' : 'pl-5 text-zinc-500'
                      }`}
                      title={item.text}
                    >
                      {item.text}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Central Document Page Container */}
        <div className="w-full max-w-[850px] flex flex-col items-center">
          {/* Read-Only Access Notice Banner */}
          {isReadOnly && (
            <div className="w-full mb-4 bg-amber-50 border border-amber-200/90 rounded-lg p-3 text-amber-900 flex items-start gap-2.5 shadow-2xs">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold">Viewing mode: </span>
                You have been granted <strong>Viewer</strong> access to this document. Content is protected from accidental edits.
                To request edit permissions, contact document owner <strong>{document.ownerName}</strong> ({document.ownerEmail}).
              </div>
            </div>
          )}

          {/* Top Measurement Ruler (Authentic Google Docs aesthetic) */}
          <div className="w-full bg-white border border-zinc-200 border-b-0 rounded-t-sm shadow-xs h-6 flex items-center px-8 relative select-none">
            {/* Left margin marker */}
            <div className="absolute left-8 top-1 flex flex-col items-center">
              <div className="w-2.5 h-2 bg-blue-600"></div>
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-blue-600"></div>
            </div>

            {/* Ruler measurement ticks */}
            <div className="flex-1 flex justify-between text-[9px] text-zinc-400 font-mono pl-4 pr-4">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
            </div>

            {/* Right margin marker */}
            <div className="absolute right-8 top-1 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[4px] border-b-blue-600"></div>
              <div className="w-2.5 h-2 bg-blue-600"></div>
            </div>
          </div>

          {/* White Paper Sheet Canvas */}
          <div
            id="document-page-sheet"
            className="w-full bg-white border border-zinc-200 rounded-b-sm shadow-md px-10 sm:px-16 py-12 min-h-[1056px] relative"
          >
            {/* Watermark in view-only mode */}
            {isReadOnly && (
              <div className="absolute top-4 right-6 flex items-center gap-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest pointer-events-none select-none">
                <Eye className="w-3.5 h-3.5" />
                <span>Read Only</span>
              </div>
            )}

            {/* ContentEditable Canvas */}
            <div
              id="document-editor-surface"
              ref={editorRef}
              contentEditable={!isReadOnly}
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onKeyUp={onSelectionChange}
              onMouseUp={onSelectionChange}
              className="doc-canvas focus:outline-none"
              role="textbox"
              aria-multiline="true"
              aria-readonly={isReadOnly}
              spellCheck="true"
            />
          </div>

          {/* Bottom Floating Status Bar: Word Count & Metrics */}
          <div className="mt-4 px-3 py-1 bg-white/80 backdrop-blur-xs border border-zinc-200/80 rounded-full shadow-2xs text-[11px] text-zinc-500 flex items-center gap-3">
            <span>
              <strong>{wordCount.toLocaleString()}</strong> words
            </span>
            <span className="text-zinc-300">•</span>
            <span>
              <strong>{charCount.toLocaleString()}</strong> characters
            </span>
            <span className="text-zinc-300">•</span>
            <span>~{readingTime} min read</span>
            <span className="text-zinc-300">•</span>
            <span className="capitalize font-medium text-zinc-600">
              Role: <strong>{isReadOnly ? 'Viewer' : 'Editor'}</strong>
            </span>
          </div>
        </div>
      </div>
    );
  }
);

EditorCanvas.displayName = 'EditorCanvas';
