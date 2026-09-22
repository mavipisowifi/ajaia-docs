import React, { useState } from 'react';
import { X, Clock, RotateCcw, Check, Eye } from 'lucide-react';
import { DocumentRevision } from '../types';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  revisions: DocumentRevision[];
  isReadOnly: boolean;
  onRestore: (revisionId: string) => Promise<void>;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  revisions,
  isReadOnly,
  onRestore,
}) => {
  const [selectedRevId, setSelectedRevId] = useState<string | null>(
    revisions.length > 0 ? revisions[revisions.length - 1].id : null
  );
  const [isRestoring, setIsRestoring] = useState(false);

  if (!isOpen) return null;

  const selectedRev = revisions.find((r) => r.id === selectedRevId);

  const handleRestore = async (id: string) => {
    setIsRestoring(true);
    try {
      await onRestore(id);
      onClose();
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 sm:w-96 bg-white shadow-2xl border-l border-zinc-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Version History</h3>
            <p className="text-[11px] text-zinc-500">{revisions.length} revision snapshot(s)</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Revision List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {revisions.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4">
            <Clock className="w-8 h-8 text-zinc-300 mb-2 stroke-[1.5]" />
            <p className="text-xs font-medium text-zinc-600">No revisions recorded yet</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Snapshots are automatically created as you and your team make edits.
            </p>
          </div>
        ) : (
          [...revisions].reverse().map((rev, index) => {
            const isSelected = rev.id === selectedRevId;
            return (
              <div
                key={rev.id}
                onClick={() => setSelectedRevId(rev.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20'
                    : 'border-zinc-200/80 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-900">
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{new Date(rev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-zinc-400 font-normal">
                      • {new Date(rev.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {index === 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                      Current
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-zinc-600 mt-1 flex items-center gap-1">
                  <span>Author: <strong>{rev.userName}</strong></span>
                </div>

                {rev.summary && (
                  <div className="text-[10px] text-zinc-400 mt-0.5 italic truncate">
                    {rev.summary}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Selected Revision Preview & Restore Action */}
      {selectedRev && (
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/80 space-y-3">
          <div className="text-xs text-zinc-700">
            <span className="font-semibold">Selected version: </span>
            <span>{new Date(selectedRev.timestamp).toLocaleString()}</span>
          </div>

          <div className="max-h-28 overflow-y-auto p-2.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-700 font-mono">
            {selectedRev.content.replace(/<[^>]+>/g, ' ').substring(0, 150)}...
          </div>

          {!isReadOnly && (
            <button
              disabled={isRestoring}
              onClick={() => handleRestore(selectedRev.id)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isRestoring ? 'Restoring version...' : 'Restore this version'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
