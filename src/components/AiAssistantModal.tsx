import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  FileText,
  AlignLeft,
  ListPlus,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: string;
  onInsertGeneratedText: (html: string) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  currentContent,
  onInsertGeneratedText,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('continue');
  const [isLoading, setIsLoading] = useState(false);
  const [resultHtml, setResultHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const ACTIONS = [
    {
      id: 'continue',
      label: 'Continue writing',
      description: 'Extends document naturally based on current context',
      icon: <AlignLeft className="w-3.5 h-3.5 text-blue-600" />,
    },
    {
      id: 'summarize',
      label: 'Executive Summary',
      description: 'Condenses the document into a high-level briefing',
      icon: <FileText className="w-3.5 h-3.5 text-emerald-600" />,
    },
    {
      id: 'outline',
      label: 'Generate Outline',
      description: 'Creates structured milestones, headers and action items',
      icon: <ListPlus className="w-3.5 h-3.5 text-purple-600" />,
    },
    {
      id: 'improve',
      label: 'Refine Tone & Clarity',
      description: 'Polishes phrasing for active voice and conciseness',
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-600" />,
    },
  ];

  const handleGenerate = async (actionToUse?: string) => {
    const action = actionToUse || selectedAction;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const generated = await api.askAi({
        action,
        prompt: prompt.trim(),
        currentContent,
      });
      setResultHtml(generated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate assistance.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resultHtml) return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = resultHtml;
    navigator.clipboard.writeText(tempDiv.innerText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!resultHtml) return;
    onInsertGeneratedText(resultHtml);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="ai-assistant-modal-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-zinc-200/90 w-full max-w-lg overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-indigo-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Ajaia AI Writing Assistant</h2>
              <p className="text-xs text-zinc-500">Draft, summarize, or enhance your document</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[70vh]">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Quick Action Pills */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
              Quick Writing Tools
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIONS.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => {
                    setSelectedAction(act.id);
                    handleGenerate(act.id);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                    selectedAction === act.id
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-zinc-900'
                      : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs">
                    {act.icon}
                    <span>{act.label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 line-clamp-1">{act.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
              Custom Instructions (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., Write a section on database failover procedures..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate();
                }}
                className="flex-1 text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 focus:outline-none focus:border-blue-500"
              />
              <button
                disabled={isLoading}
                onClick={() => handleGenerate()}
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Generate</span>
              </button>
            </div>
          </div>

          {/* Generated Result Preview */}
          {resultHtml && (
            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                <span>Generated Output</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 font-medium"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div
                className="max-h-48 overflow-y-auto p-3 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 prose-sm"
                dangerouslySetInnerHTML={{ __html: resultHtml }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-zinc-200 hover:border-zinc-300 bg-white rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
          >
            Cancel
          </button>

          {resultHtml && (
            <button
              onClick={handleInsert}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Insert into document</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
