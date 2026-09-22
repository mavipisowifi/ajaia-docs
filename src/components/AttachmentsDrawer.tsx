import React, { useRef } from 'react';
import {
  X,
  Paperclip,
  Upload,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File,
  Lock,
} from 'lucide-react';
import { DocumentAttachment } from '../types';

interface AttachmentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: DocumentAttachment[];
  isReadOnly: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
}

export const AttachmentsDrawer: React.FC<AttachmentsDrawerProps> = ({
  isOpen,
  onClose,
  attachments,
  isReadOnly,
  onUpload,
  onDelete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (fileType.includes('sheet') || fileType.includes('csv'))
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    if (fileType.includes('json') || fileType.includes('javascript') || fileType.includes('typescript'))
      return <FileCode className="w-4 h-4 text-amber-500" />;
    return <File className="w-4 h-4 text-zinc-500" />;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 sm:w-96 bg-white shadow-2xl border-l border-zinc-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Paperclip className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Document Attachments</h3>
            <p className="text-[11px] text-zinc-500">{attachments.length} linked file(s)</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Upload button area */}
      <div className="p-4 border-b border-zinc-100 bg-white">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
        {isReadOnly ? (
          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>View-only: Only editors can add attachments.</span>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 px-3 border border-dashed border-blue-400 hover:border-blue-600 bg-blue-50/50 hover:bg-blue-50 rounded-xl text-xs font-semibold text-blue-700 flex items-center justify-center gap-2 transition-all shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload new attachment</span>
          </button>
        )}
      </div>

      {/* Attachment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {attachments.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <Paperclip className="w-8 h-8 text-zinc-300 mb-2 stroke-[1.5]" />
            <p className="text-xs font-medium text-zinc-600">No attachments yet</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Upload spreadsheets, specs, PDFs, or design diagrams related to this doc.
            </p>
          </div>
        ) : (
          attachments.map((att) => (
            <div
              key={att.id}
              className="p-3 bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/80 rounded-xl flex items-center justify-between gap-3 transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                  {getFileIcon(att.fileType)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-800 truncate" title={att.fileName}>
                    {att.fileName}
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                    <span>{(att.fileSize / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span>{new Date(att.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={att.url}
                  download={att.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-white rounded-md transition-colors shadow-2xs"
                  title="Download file"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>

                {!isReadOnly && (
                  <button
                    onClick={() => onDelete(att.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-white rounded-md transition-colors shadow-2xs"
                    title="Delete attachment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
