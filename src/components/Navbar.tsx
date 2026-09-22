import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Star,
  CloudCheck,
  CloudUpload,
  Lock,
  Share2,
  Clock,
  Paperclip,
  Sparkles,
  ChevronDown,
  Download,
  Upload,
  Plus,
  Printer,
  ChevronLeft,
  Check,
  UserCheck,
  Info,
} from 'lucide-react';
import { User, DocumentItem } from '../types';

interface NavbarProps {
  document: DocumentItem | null;
  currentUser: User;
  allUsers: User[];
  saveStatus: 'saved' | 'saving' | 'error' | 'readonly';
  onTitleChange: (newTitle: string) => void;
  onToggleStar: () => void;
  onOpenShare: () => void;
  onOpenHistory: () => void;
  onOpenAttachments: () => void;
  onOpenImport: () => void;
  onOpenAi: () => void;
  onNewDocument: () => void;
  onSwitchUser: (user: User) => void;
  onBackToDashboard: () => void;
  onExport: (format: 'html' | 'md' | 'txt') => void;
  onPrint: () => void;
  collaborators: { id: string; name: string; avatarColor: string }[];
}

export const Navbar: React.FC<NavbarProps> = ({
  document,
  currentUser,
  allUsers,
  saveStatus,
  onTitleChange,
  onToggleStar,
  onOpenShare,
  onOpenHistory,
  onOpenAttachments,
  onOpenImport,
  onOpenAi,
  onNewDocument,
  onSwitchUser,
  onBackToDashboard,
  onExport,
  onPrint,
  collaborators,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(document?.title || '');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document) {
      setTitleValue(document.title);
    }
  }, [document?.title]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setShowFileMenu(false);
      }
    }
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue !== document?.title) {
      onTitleChange(titleValue.trim());
    } else if (!titleValue.trim() && document) {
      setTitleValue(document.title);
    }
  };

  const isOwner = document ? document.ownerId === currentUser.id : true;
  const isViewer = saveStatus === 'readonly';

  return (
    <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-30 select-none shadow-xs">
      <div className="px-4 py-2 flex items-center justify-between gap-4">
        {/* Left: Home Brand & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="nav-back-button"
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 px-2 py-1.5 text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors text-sm font-medium shrink-0"
            title="Back to all documents"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="font-semibold tracking-tight text-zinc-900 hidden sm:inline">Ajaia</span>
            <span className="text-zinc-400 font-normal hidden sm:inline">/</span>
            <ChevronLeft className="w-4 h-4 text-zinc-500 sm:hidden" />
          </button>

          {document ? (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                {isEditingTitle && !isViewer ? (
                  <input
                    id="doc-title-input"
                    ref={titleInputRef}
                    type="text"
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onBlur={handleTitleSubmit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleSubmit();
                      if (e.key === 'Escape') {
                        setTitleValue(document.title);
                        setIsEditingTitle(false);
                      }
                    }}
                    autoFocus
                    className="text-base font-semibold text-zinc-900 bg-blue-50/50 border border-blue-400 rounded px-1.5 py-0.5 outline-none w-56 sm:w-80"
                  />
                ) : (
                  <button
                    id="doc-title-display-button"
                    onClick={() => {
                      if (!isViewer) setIsEditingTitle(true);
                    }}
                    disabled={isViewer}
                    className={`text-base font-semibold text-zinc-900 truncate px-1.5 py-0.5 rounded hover:bg-zinc-100 transition-colors text-left max-w-xs sm:max-w-md ${
                      isViewer ? 'cursor-default' : 'cursor-text'
                    }`}
                    title={isViewer ? 'View-only mode: title cannot be edited' : 'Click to rename document'}
                  >
                    {document.title || 'Untitled document'}
                  </button>
                )}

                <button
                  id="star-document-toggle"
                  onClick={onToggleStar}
                  className={`p-1 rounded hover:bg-zinc-100 transition-colors ${
                    document.isStarred ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                  title={document.isStarred ? 'Starred' : 'Star this document'}
                >
                  <Star className={`w-4 h-4 ${document.isStarred ? 'fill-amber-400' : ''}`} />
                </button>

                {/* Cloud Save & Role Status */}
                <div className="hidden md:flex items-center text-xs text-zinc-500 gap-1.5 pl-1">
                  {saveStatus === 'saving' && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <CloudUpload className="w-3.5 h-3.5 animate-pulse" />
                      Saving...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Saved to cloud
                    </span>
                  )}
                  {saveStatus === 'readonly' && (
                    <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full font-medium">
                      <Lock className="w-3 h-3 text-amber-600" />
                      View only
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-menu bar: File, Edit, Insert, Export */}
              <div className="flex items-center gap-1 text-xs text-zinc-600 font-medium">
                {/* File Dropdown */}
                <div className="relative" ref={fileMenuRef}>
                  <button
                    id="menu-file-dropdown"
                    onClick={() => setShowFileMenu(!showFileMenu)}
                    className="px-2 py-0.5 rounded hover:bg-zinc-100 text-zinc-700 flex items-center gap-0.5"
                  >
                    File
                    <ChevronDown className="w-3 h-3 text-zinc-400" />
                  </button>

                  {showFileMenu && (
                    <div className="absolute left-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-50 text-xs text-zinc-700 divide-y divide-zinc-100">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowFileMenu(false);
                            onNewDocument();
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5 text-zinc-500" />
                          New document
                        </button>
                        <button
                          onClick={() => {
                            setShowFileMenu(false);
                            onOpenImport();
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <Upload className="w-3.5 h-3.5 text-zinc-500" />
                          Import file (.md, .txt)...
                        </button>
                      </div>

                      <div className="py-1">
                        <div className="px-3 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Download As
                        </div>
                        <button
                          onClick={() => {
                            setShowFileMenu(false);
                            onExport('md');
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5 text-zinc-500" />
                          Markdown (.md)
                        </button>
                        <button
                          onClick={() => {
                            setShowFileMenu(false);
                            onExport('html');
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5 text-zinc-500" />
                          HTML (.html)
                        </button>
                        <button
                          onClick={() => {
                            setShowFileMenu(false);
                            onExport('txt');
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5 text-zinc-500" />
                          Plain Text (.txt)
                        </button>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowFileMenu(false);
                            onPrint();
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <Printer className="w-3.5 h-3.5 text-zinc-500" />
                          Print preview
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  id="menu-import-button"
                  onClick={onOpenImport}
                  className="px-2 py-0.5 rounded hover:bg-zinc-100 text-zinc-700 hidden sm:inline"
                >
                  Import File
                </button>

                <button
                  id="menu-history-button"
                  onClick={onOpenHistory}
                  className="px-2 py-0.5 rounded hover:bg-zinc-100 text-zinc-700 hidden sm:inline"
                >
                  Version History
                </button>

                <button
                  id="menu-attachments-button"
                  onClick={onOpenAttachments}
                  className="px-2 py-0.5 rounded hover:bg-zinc-100 text-zinc-700 hidden sm:flex items-center gap-1"
                >
                  Attachments
                  {document.attachments && document.attachments.length > 0 && (
                    <span className="bg-zinc-200 text-zinc-700 rounded-full px-1.5 text-[10px] font-bold">
                      {document.attachments.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <span className="text-base font-semibold text-zinc-900">Documents Hub</span>
          )}
        </div>

        {/* Right: Actions, Presence, Sharing & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {document && (
            <>
              {/* Attachments Drawer Trigger */}
              <button
                id="btn-open-attachments"
                onClick={onOpenAttachments}
                className="relative p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                title="View attachments associated with document"
              >
                <Paperclip className="w-4 h-4" />
                {document.attachments && document.attachments.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {document.attachments.length}
                  </span>
                )}
              </button>

              {/* Version History Trigger */}
              <button
                id="btn-open-history"
                onClick={onOpenHistory}
                className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                title="Document version history"
              >
                <Clock className="w-4 h-4" />
              </button>

              {/* AI Assistant Trigger */}
              <button
                id="btn-open-ai"
                onClick={onOpenAi}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 hover:bg-blue-100/70 rounded-md text-xs font-semibold shadow-2xs transition-all"
                title="AI Copilot: Help me write, summarize or refine"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>AI Assist</span>
              </button>

              {/* Simulated Collaborator Presence Avatars */}
              <div className="hidden lg:flex items-center -space-x-1.5 pl-1 pr-1">
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-xs cursor-pointer"
                    style={{ backgroundColor: collab.avatarColor }}
                    title={`${collab.name} is currently viewing`}
                  >
                    {collab.name.charAt(0)}
                  </div>
                ))}
              </div>

              {/* Share Button (Google Docs primary action) */}
              <button
                id="btn-share-document"
                onClick={onOpenShare}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-2xs transition-all ${
                  isOwner
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300'
                }`}
                title="Share document permissions"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
                {document.shares.length > 0 && (
                  <span className="ml-0.5 bg-blue-700 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {document.shares.length}
                  </span>
                )}
              </button>
            </>
          )}

          {/* User Switcher Dropdown (Allows testing multi-user sharing & permissions in real time) */}
          <div className="relative" ref={userMenuRef}>
            <button
              id="user-persona-switcher"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full border border-zinc-200 hover:border-zinc-300 bg-zinc-50 hover:bg-zinc-100 transition-colors text-xs"
              title="Switch user account to test document permissions"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs"
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <span className="font-medium text-zinc-800 hidden md:inline max-w-[100px] truncate">
                {currentUser.name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-zinc-200 py-2 z-50 divide-y divide-zinc-100">
                <div className="px-3 py-2 bg-zinc-50/70 rounded-t-xl">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-blue-600" />
                    Simulated Persona
                  </div>
                  <div className="text-xs text-zinc-600 mt-0.5">
                    Switch user to verify <strong>Owned vs Shared</strong> document access and view/edit permissions.
                  </div>
                </div>

                <div className="py-1">
                  {allUsers.map((user) => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-zinc-50 transition-colors ${
                          isSelected ? 'bg-blue-50/60 font-medium text-blue-900' : 'text-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
                            style={{ backgroundColor: user.avatarColor }}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className="font-semibold truncate">{user.name}</div>
                            <div className="text-[11px] text-zinc-400 truncate">{user.title}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>

                <div className="px-3 py-2 text-[11px] text-zinc-500 bg-zinc-50/50 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Logged in as: {currentUser.email}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
