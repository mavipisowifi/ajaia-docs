import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  FileCode,
  FileCheck,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  Paperclip,
} from 'lucide-react';
import { api } from '../services/api';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDocId?: string;
  currentUserId: string;
  onImportSuccess: (result: { title: string; content: string; mode: 'new' | 'insert' }) => void;
  onAttachmentUploaded?: () => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  currentDocId,
  currentUserId,
  onImportSuccess,
  onAttachmentUploaded,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'new' | 'insert' | 'attachment'>('new');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ title: string; content: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const SUPPORTED_EXTENSIONS = ['.md', '.txt', '.html', '.json'];
  const SUPPORTED_LABEL = 'Markdown (.md), Plain Text (.txt), HTML (.html), JSON (.json)';

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = async (file: File) => {
    setErrorMsg(null);
    setPreviewData(null);

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isSupported = SUPPORTED_EXTENSIONS.includes(ext);

    if (!isSupported && uploadMode !== 'attachment') {
      setErrorMsg(`Unsupported file type (${ext}). Supported formats: ${SUPPORTED_LABEL}`);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File exceeds 15MB limit.');
      return;
    }

    setSelectedFile(file);

    // If importing as document, fetch parsed preview
    if (uploadMode !== 'attachment') {
      setIsProcessing(true);
      try {
        const result = await api.importFile(file);
        setPreviewData({
          title: result.title,
          content: result.content,
        });
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to parse file preview.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleConfirm = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (uploadMode === 'attachment') {
        if (!currentDocId) {
          throw new Error('No active document to attach file to.');
        }
        await api.uploadAttachment(currentDocId, selectedFile, currentUserId);
        if (onAttachmentUploaded) onAttachmentUploaded();
        onClose();
      } else {
        // Mode is 'new' or 'insert'
        let contentToUse = previewData?.content;
        let titleToUse = previewData?.title || selectedFile.name;

        if (!contentToUse) {
          const result = await api.importFile(selectedFile);
          contentToUse = result.content;
          titleToUse = result.title;
        }

        onImportSuccess({
          title: titleToUse,
          content: contentToUse,
          mode: uploadMode,
        });
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'File processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="file-upload-modal-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-zinc-200/90 w-full max-w-xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Upload & Import File</h2>
              <p className="text-xs text-zinc-500">Transform local files into editable documents or attachments</p>
            </div>
          </div>
          <button
            id="file-upload-modal-close-btn"
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[70vh]">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Workflow Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
              Select Product Workflow
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUploadMode('new')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  uploadMode === 'new'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 text-blue-950'
                    : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>New Document</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  Parse file and generate a brand new editable doc
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('insert')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  uploadMode === 'insert'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 text-blue-950'
                    : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <FileCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>Insert to Draft</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  Append file contents into the current open document
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('attachment')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  uploadMode === 'attachment'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 text-blue-950'
                    : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  <span>Attach to Doc</span>
                </div>
                <span className="text-[11px] text-zinc-500">
                  Store as a linked downloadable document file
                </span>
              </button>
            </div>
          </div>

          {/* Drag & Drop File Target Area */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
              accept={uploadMode === 'attachment' ? '*' : '.md,.markdown,.txt,.html,.htm,.json'}
            />

            <div
              id="file-drop-zone"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                dragActive
                  ? 'border-blue-600 bg-blue-50/60 scale-[1.01]'
                  : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <FileText className="w-6 h-6 stroke-[1.75]" />
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-900">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>{selectedFile.name}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click or drag another file to replace
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-800">
                    Drag and drop your file here, or <span className="text-blue-600 underline">browse</span>
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Supported: {uploadMode === 'attachment' ? 'Any file type (PDF, Images, Docs up to 15MB)' : SUPPORTED_LABEL}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Demo Sample Files for one-click testing */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-zinc-500 font-medium">Try with sample file:</span>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('/sample-files/project_architecture_spec.md');
                  const blob = await res.blob();
                  const file = new File([blob], 'project_architecture_spec.md', { type: 'text/markdown' });
                  validateAndSetFile(file);
                } catch (e) {
                  console.error('Failed to load sample spec:', e);
                }
              }}
              className="text-[11px] px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md font-medium transition-colors"
            >
              Architecture Spec (.md)
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch('/sample-files/customer_interview_notes.txt');
                  const blob = await res.blob();
                  const file = new File([blob], 'customer_interview_notes.txt', { type: 'text/plain' });
                  validateAndSetFile(file);
                } catch (e) {
                  console.error('Failed to load sample txt:', e);
                }
              }}
              className="text-[11px] px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md font-medium transition-colors"
            >
              Discovery Notes (.txt)
            </button>
          </div>

          {/* Extracted Preview Panel (When importing documents) */}
          {previewData && (
            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                <span>Extracted Preview</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                  Title: {previewData.title}
                </span>
              </div>
              <div
                className="max-h-36 overflow-y-auto p-3 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-700 prose-sm"
                dangerouslySetInnerHTML={{ __html: previewData.content }}
              />
            </div>
          )}

          {/* Clarity & Format Policy Callout */}
          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl text-[11px] text-zinc-600 space-y-1">
            <div className="font-semibold text-zinc-700 flex items-center gap-1">
              <span>File Ingestion Specifications</span>
            </div>
            <p>
              Markdown formatting (headings, lists, bold/italics, quotes) is automatically converted to structured HTML. Plain text is preserved with paragraph breaks.
            </p>
          </div>
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

          <button
            id="file-upload-confirm-btn"
            type="button"
            disabled={!selectedFile || isProcessing}
            onClick={handleConfirm}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {isProcessing ? (
              <span>Processing file...</span>
            ) : (
              <>
                <span>
                  {uploadMode === 'new'
                    ? 'Create Document'
                    : uploadMode === 'insert'
                    ? 'Insert Content'
                    : 'Attach File'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
