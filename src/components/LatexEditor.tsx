import React, { useRef, useState, useEffect } from 'react';
import { RichText } from './RichText';
import { ChevronDown, Eye, Edit3 } from 'lucide-react';

export interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

interface ToolbarAction {
  id: string;
  label: string;
  ariaLabel: string;
  snippet: string;
  cursorOffset: number; // Offset of cursor relative to insertion start
}

const GREEK_SYMBOLS = [
  { symbol: 'α', latex: '\\alpha ' },
  { symbol: 'β', latex: '\\beta ' },
  { symbol: 'θ', latex: '\\theta ' },
  { symbol: 'γ', latex: '\\gamma ' },
  { symbol: 'δ', latex: '\\delta ' },
  { symbol: 'ω', latex: '\\omega ' },
  { symbol: 'μ', latex: '\\mu ' },
  { symbol: 'π', latex: '\\pi ' },
  { symbol: 'λ', latex: '\\lambda ' },
];

export const LatexEditor: React.FC<LatexEditorProps> = ({
  value,
  onChange,
  label,
  placeholder = 'টেক্সট বা LaTeX সূত্র লিখুন...',
  rows = 4,
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showGreekMenu, setShowGreekMenu] = useState(false);
  const greekMenuRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'both'>('both');

  // Close Greek menu when clicking outside
  useEffect(() => {
    if (!showGreekMenu) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (greekMenuRef.current && !greekMenuRef.current.contains(e.target as Node)) {
        setShowGreekMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showGreekMenu]);

  // Insert code at current cursor position and set cursor
  const insertSnippet = (snippet: string, cursorOffset: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const selectedText = value.substring(start, end);

    let textToInsert = snippet;
    let newCursorPos = start + cursorOffset;

    if (selectedText.length > 0 && snippet.includes('|')) {
      // If user selected text, put selected text in placeholder spot
      textToInsert = snippet.replace('|', selectedText);
      newCursorPos = start + textToInsert.length;
    } else {
      textToInsert = snippet.replace('|', '');
    }

    const updatedValue = value.substring(0, start) + textToInsert + value.substring(end);
    onChange(updatedValue);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const toolbarActions: ToolbarAction[] = [
    {
      id: 'inline',
      label: '$ ইনলাইন',
      ariaLabel: 'ইনলাইন সূত্র যোগ করুন',
      snippet: '$|$',
      cursorOffset: 1,
    },
    {
      id: 'block',
      label: '$$ ব্লক',
      ariaLabel: 'আলাদা লাইনের ব্লক সূত্র যোগ করুন',
      snippet: '$$\n|\n$$',
      cursorOffset: 3,
    },
    {
      id: 'frac',
      label: 'ভগ্নাংশ',
      ariaLabel: 'ভগ্নাংশ যোগ করুন (frac)',
      snippet: '\\frac{|}{}',
      cursorOffset: 6,
    },
    {
      id: 'sqrt',
      label: 'বর্গমূল',
      ariaLabel: 'বর্গমূল যোগ করুন (sqrt)',
      snippet: '\\sqrt{|}',
      cursorOffset: 6,
    },
    {
      id: 'sup',
      label: 'ঘাত',
      ariaLabel: 'ঘাত বা পাওয়ার যোগ করুন',
      snippet: '^{|}',
      cursorOffset: 2,
    },
    {
      id: 'sub',
      label: 'সাবস্ক্রিপ্ট',
      ariaLabel: 'সাবস্ক্রিপ্ট যোগ করুন',
      snippet: '_{|}',
      cursorOffset: 2,
    },
    {
      id: 'sum',
      label: '∑',
      ariaLabel: 'সামেশন প্রতীক যোগ করুন',
      snippet: '\\sum_{|}^{}',
      cursorOffset: 6,
    },
    {
      id: 'int',
      label: '∫',
      ariaLabel: 'ইন্টিগ্রেশন প্রতীক যোগ করুন',
      snippet: '\\int_{|}^{}',
      cursorOffset: 6,
    },
  ];

  return (
    <div className={`flex flex-col bg-white rounded-2xl border border-[#D5D9E2] overflow-hidden shadow-xs ${className}`}>
      {/* Header and Mobile Tab Switcher */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#F8FAFC] border-b border-[#D5D9E2]">
        {label ? (
          <label className="text-sm font-semibold text-[#1B1F2A]">
            {label}
          </label>
        ) : (
          <span className="text-xs font-medium text-slate-500">LaTeX সম্পাদক</span>
        )}

        <div className="flex items-center bg-[#E2E8F0] p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-2 py-1 rounded-md transition-colors ${
              activeTab === 'editor'
                ? 'bg-white text-[#3B4FD8] font-semibold shadow-xs'
                : 'text-slate-600 hover:text-[#1B1F2A]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 inline mr-1" />
            এডিট
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-2 py-1 rounded-md transition-colors ${
              activeTab === 'preview'
                ? 'bg-white text-[#3B4FD8] font-semibold shadow-xs'
                : 'text-slate-600 hover:text-[#1B1F2A]'
            }`}
          >
            <Eye className="w-3.5 h-3.5 inline mr-1" />
            প্রিভিউ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('both')}
            className={`px-2 py-1 rounded-md transition-colors hidden sm:block ${
              activeTab === 'both'
                ? 'bg-white text-[#3B4FD8] font-semibold shadow-xs'
                : 'text-slate-600 hover:text-[#1B1F2A]'
            }`}
          >
            উভয়
          </button>
        </div>
      </div>

      {/* Formula Toolbar */}
      <div className="flex items-center gap-1.5 p-2 bg-[#F2F4F8] border-b border-[#D5D9E2] overflow-x-auto scrollbar-none">
        {toolbarActions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => insertSnippet(action.snippet, action.cursorOffset)}
            aria-label={action.ariaLabel}
            className="shrink-0 min-h-[38px] px-2.5 py-1.5 text-xs font-semibold text-[#1B1F2A] bg-white hover:bg-[#EEF1FD] active:bg-[#DCE3FA] hover:text-[#3B4FD8] border border-[#D5D9E2] rounded-lg shadow-2xs transition-colors flex items-center justify-center cursor-pointer"
          >
            {action.label}
          </button>
        ))}

        {/* Greek symbols popup menu */}
        <div ref={greekMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowGreekMenu((prev) => !prev)}
            aria-label="গ্রিক বর্ণমালা ও চিহ্নসমূহ"
            aria-expanded={showGreekMenu}
            className="min-h-[38px] px-2.5 py-1.5 text-xs font-semibold text-[#3B4FD8] bg-white hover:bg-[#EEF1FD] active:bg-[#DCE3FA] border border-[#3B4FD8]/40 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>α β θ</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showGreekMenu && (
            <div className="absolute left-0 bottom-full mb-1.5 z-50 bg-white border border-[#D5D9E2] rounded-xl shadow-xl p-2 grid grid-cols-3 gap-1.5 w-48 animate-in fade-in zoom-in-95">
              {GREEK_SYMBOLS.map((g) => (
                <button
                  key={g.symbol}
                  type="button"
                  onClick={() => {
                    insertSnippet(g.latex, g.latex.length);
                    setShowGreekMenu(false);
                  }}
                  aria-label={`গ্রিক অক্ষর ${g.symbol}`}
                  className="min-h-[36px] py-1 px-2 rounded-lg text-sm font-serif font-bold text-[#1B1F2A] hover:bg-[#EEF1FD] hover:text-[#3B4FD8] border border-transparent hover:border-[#3B4FD8]/20 flex items-center justify-center transition-colors cursor-pointer"
                >
                  {g.symbol}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Textarea */}
      {(activeTab === 'editor' || activeTab === 'both') && (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full p-3.5 text-sm font-mono text-[#1B1F2A] bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B4FD8]/30 resize-y leading-relaxed"
          />
        </div>
      )}

      {/* Live Preview Area */}
      {(activeTab === 'preview' || activeTab === 'both') && (
        <div className="p-3.5 bg-[#FAFBFD] border-t border-[#D5D9E2] min-h-[70px]">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#3B4FD8] mb-1.5 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              লাইভ প্রিভিউ (LaTeX Render)
            </span>
          </div>

          {value.trim() ? (
            <div className="p-2.5 bg-white rounded-xl border border-[#E2E8F0] shadow-2xs text-sm">
              <RichText text={value} />
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              উপরে টেক্সট বা সূত্র লিখলে এখানে সঙ্গে সঙ্গে প্রিভিউ প্রদর্শিত হবে...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LatexEditor;
