import React, { useState } from 'react';
import {
  X,
  Share2,
  Check,
  Copy,
  Trash2,
  Shield,
  UserPlus,
  Users,
  ChevronDown,
  Info,
} from 'lucide-react';
import { User, DocumentItem } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem;
  currentUser: User;
  allUsers: User[];
  onShare: (payload: { targetUserId?: string; targetEmail?: string; role: 'editor' | 'viewer' }) => Promise<void>;
  onRemoveShare: (targetUserId: string) => Promise<void>;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  document,
  currentUser,
  allUsers,
  onShare,
  onRemoveShare,
}) => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOwner = document.ownerId === currentUser.id;

  // Potential team members who are not the owner and not yet shared
  const availableUsers = allUsers.filter(
    (u) => u.id !== document.ownerId && !document.shares.some((s) => s.userId === u.id)
  );

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isOwner) {
      setErrorMsg('Only the document owner can invite new collaborators.');
      return;
    }

    if (!selectedUser && !customEmail.trim()) {
      setErrorMsg('Please select a team member or enter an email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedUser) {
        await onShare({
          targetUserId: selectedUser,
          role: selectedRole,
        });
      } else {
        await onShare({
          targetEmail: customEmail.trim(),
          role: selectedRole,
        });
      }
      setSelectedUser('');
      setCustomEmail('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to share document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, targetEmail: string, newRole: 'editor' | 'viewer') => {
    if (!isOwner) return;
    try {
      await onShare({
        targetUserId,
        targetEmail,
        role: newRole,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update collaborator role');
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="share-modal-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-zinc-200/90 w-full max-w-lg overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Share document</h2>
              <p className="text-xs text-zinc-500 truncate max-w-xs">{document.title}</p>
            </div>
          </div>
          <button
            id="share-modal-close-btn"
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[70vh]">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {!isOwner && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Read-only sharing view:</strong> You are not the owner of this document. Only the owner (
                <strong>{document.ownerName}</strong>) can grant or revoke collaborator access.
              </div>
            </div>
          )}

          {/* Add Collaborator Form (Owners only) */}
          {isOwner && (
            <form onSubmit={handleAddCollaborator} className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                Add People & Team Members
              </label>

              <div className="flex gap-2">
                {/* Team member selector or email */}
                <div className="flex-1 relative">
                  <select
                    id="share-select-user"
                    value={selectedUser}
                    onChange={(e) => {
                      setSelectedUser(e.target.value);
                      if (e.target.value) setCustomEmail('');
                    }}
                    className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Choose a team member...</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.title})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Selector */}
                <div className="w-28 shrink-0">
                  <select
                    id="share-role-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'editor' | 'viewer')}
                    className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-2 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <button
                  id="share-add-collaborator-btn"
                  type="submit"
                  disabled={isSubmitting || (!selectedUser && !customEmail)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Grant</span>
                </button>
              </div>

              {/* Or manual email fallback */}
              {!selectedUser && (
                <div className="flex items-center gap-2">
                  <input
                    id="share-custom-email-input"
                    type="email"
                    placeholder="Or invite via internal email (e.g. colleague@ajaia.internal)"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="flex-1 text-xs bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-zinc-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </form>
          )}

          {/* People with Access List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-500" />
                Collaborators ({1 + document.shares.length})
              </span>
            </div>

            <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              {/* Document Owner Row */}
              <div className="p-3 flex items-center justify-between bg-zinc-50/60">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {document.ownerName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                      <span>{document.ownerName}</span>
                      {document.ownerId === currentUser.id && (
                        <span className="text-[10px] text-zinc-400 font-normal">(you)</span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">{document.ownerEmail}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-zinc-600 bg-zinc-200/80 px-2.5 py-1 rounded-md">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Owner</span>
                </div>
              </div>

              {/* Shared Collaborators Rows */}
              {document.shares.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-400 italic">
                  Not shared with anyone yet. Grant access to team members above.
                </div>
              ) : (
                document.shares.map((share) => {
                  const userDetail = allUsers.find((u) => u.id === share.userId || u.email === share.email);
                  const displayName = userDetail ? userDetail.name : share.email.split('@')[0];
                  const avatarColor = userDetail ? userDetail.avatarColor : '#64748b';

                  return (
                    <div key={share.userId} className="p-3 flex items-center justify-between hover:bg-zinc-50/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs"
                          style={{ backgroundColor: avatarColor }}
                        >
                          {displayName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-zinc-900 flex items-center gap-1.5">
                            <span>{displayName}</span>
                            {share.userId === currentUser.id && (
                              <span className="text-[10px] text-zinc-400 font-normal">(you)</span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate">{share.email}</div>
                        </div>
                      </div>

                      {/* Role dropdown or badge */}
                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <div className="relative">
                            <select
                              value={share.role}
                              onChange={(e) =>
                                handleRoleChange(share.userId, share.email, e.target.value as 'editor' | 'viewer')
                              }
                              className="text-xs bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-zinc-700 font-medium focus:outline-none focus:border-blue-500"
                            >
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </div>
                        ) : (
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              share.role === 'editor'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            }`}
                          >
                            {share.role === 'editor' ? 'Editor' : 'Viewer'}
                          </span>
                        )}

                        {isOwner && (
                          <button
                            id={`remove-share-${share.userId}`}
                            onClick={() => onRemoveShare(share.userId)}
                            className="p-1 text-zinc-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                            title="Revoke access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer: Copy Link & Done */}
        <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
          <button
            id="share-modal-copy-link-btn"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 hover:border-zinc-300 bg-white rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy link'}</span>
          </button>

          <button
            id="share-modal-done-btn"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
