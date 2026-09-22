import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Star,
  Users,
  User,
  Clock,
  MoreVertical,
  Trash2,
  Share2,
  FolderOpen,
  LayoutGrid,
  List as ListIcon,
  Sparkles,
  Shield,
  Eye,
  Edit3,
  Upload,
} from 'lucide-react';
import { DocumentItem, User as UserType } from '../types';

interface DocumentListProps {
  documents: DocumentItem[];
  currentUser: UserType;
  allUsers: UserType[];
  onOpenDocument: (docId: string) => void;
  onCreateDocument: (title?: string, templateContent?: string) => void;
  onOpenImport: () => void;
  onDeleteDocument: (docId: string) => void;
  onToggleStar: (doc: DocumentItem) => void;
  onOpenShareModal: (doc: DocumentItem) => void;
  onSwitchUser: (user: UserType) => void;
}

const TEMPLATES = [
  {
    id: 'blank',
    title: 'Blank document',
    description: 'Start from scratch',
    iconColor: 'bg-blue-600',
    content: '<p>Start typing your thoughts here...</p>',
  },
  {
    id: 'meeting',
    title: 'Meeting Notes',
    description: 'Attendees, agenda, decisions, next steps',
    iconColor: 'bg-emerald-600',
    content: `<h1>Team Sync — Notes</h1>
<p><strong>Date:</strong> Today | <strong>Facilitator:</strong> Team Lead</p>
<h2>1. Attendees</h2>
<ul><li>Team members present</li></ul>
<h2>2. Agenda Items</h2>
<ol><li>Progress on Sprint goals</li><li>Blockers & dependencies</li><li>Design review</li></ol>
<h2>3. Key Decisions & Next Steps</h2>
<ul><li><strong>Action Item:</strong> Complete prototype review by Friday</li></ul>`,
  },
  {
    id: 'brief',
    title: 'Product Brief',
    description: 'Problem statement, user personas, success metrics',
    iconColor: 'bg-purple-600',
    content: `<h1>Product Brief: New Initiative</h1>
<h2>1. Problem Statement</h2>
<p>Describe the core user problem and why it matters now.</p>
<h2>2. Target Audience & Personas</h2>
<ul><li>Core user persona definition</li></ul>
<h2>3. Success Metrics</h2>
<p>Key performance indicators and measurable deliverables.</p>`,
  },
  {
    id: 'rfc',
    title: 'Engineering RFC',
    description: 'Architecture proposal, tradeoffs, migration plan',
    iconColor: 'bg-amber-600',
    content: `<h1>RFC: System Architecture Proposal</h1>
<p><strong>Author:</strong> Engineering Lead | <strong>Status:</strong> Draft</p>
<h2>1. Abstract</h2>
<p>High-level summary of the architectural change.</p>
<h2>2. Technical Design</h2>
<p>Detailed component diagrams and interface definitions.</p>
<h2>3. Security & Scalability Tradeoffs</h2>
<ul><li>Latency vs memory consumption</li><li>Failure recovery strategy</li></ul>`,
  },
];

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  currentUser,
  allUsers,
  onOpenDocument,
  onCreateDocument,
  onOpenImport,
  onDeleteDocument,
  onToggleStar,
  onOpenShareModal,
  onSwitchUser,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'shared' | 'starred'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [openMenuDocId, setOpenMenuDocId] = useState<string | null>(null);

  // Filter documents based on active tab and search query
  const filteredDocs = documents.filter((doc) => {
    // Search filter
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'owned') {
      return doc.ownerId === currentUser.id;
    }
    if (activeTab === 'shared') {
      return doc.ownerId !== currentUser.id;
    }
    if (activeTab === 'starred') {
      return doc.isStarred;
    }
    return true;
  });

  const ownedCount = documents.filter((d) => d.ownerId === currentUser.id).length;
  const sharedCount = documents.filter((d) => d.ownerId !== currentUser.id).length;
  const starredCount = documents.filter((d) => d.isStarred).length;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-zinc-200/80 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <FileText className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-900 tracking-tight">Ajaia Docs</h1>
            <p className="text-[11px] text-zinc-400 font-medium">Collaborative Document Hub</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              id="dashboard-search-input"
              type="text"
              placeholder="Search documents or collaborators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white border border-transparent focus:border-zinc-300 rounded-full pl-9 pr-4 py-2 outline-none transition-all"
            />
          </div>
        </div>

        {/* Persona Switcher Quick Pill */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-zinc-900">{currentUser.name}</div>
            <div className="text-[10px] text-zinc-400">{currentUser.title}</div>
          </div>
          <div
            className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-2xs"
            style={{ backgroundColor: currentUser.avatarColor }}
          >
            {currentUser.name.charAt(0)}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-8">
        {/* Template Gallery Header */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Start a new document
            </h2>
            <button
              id="dashboard-import-btn"
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-500" />
              <span>Import file (.md, .txt)...</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                id={`template-${tmpl.id}`}
                onClick={() => onCreateDocument(tmpl.id === 'blank' ? 'Untitled document' : tmpl.title, tmpl.content)}
                className="group p-4 bg-white border border-zinc-200 hover:border-blue-500 rounded-xl text-left transition-all shadow-xs hover:shadow-md flex flex-col justify-between h-32 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg ${tmpl.iconColor} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                    {tmpl.id === 'blank' ? <Plus className="w-4 h-4 stroke-[2.5]" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-zinc-300 group-hover:text-blue-500 transition-colors" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">
                    {tmpl.title}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{tmpl.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Documents Section Header & Tabs */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                id="tab-all-docs"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/70'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>All Documents</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'all' ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-700'}`}>
                  {documents.length}
                </span>
              </button>

              <button
                id="tab-owned-docs"
                onClick={() => setActiveTab('owned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'owned'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/70'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Owned by me</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'owned' ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-700'}`}>
                  {ownedCount}
                </span>
              </button>

              <button
                id="tab-shared-docs"
                onClick={() => setActiveTab('shared')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'shared'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/70'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Shared with me</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'shared' ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-700'}`}>
                  {sharedCount}
                </span>
              </button>

              <button
                id="tab-starred-docs"
                onClick={() => setActiveTab('starred')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'starred'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/70'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>Starred</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'starred' ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-700'}`}>
                  {starredCount}
                </span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 self-end sm:self-auto">
              <button
                id="btn-view-grid"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                id="btn-view-list"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title="List view"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document Items List / Grid */}
          {filteredDocs.length === 0 ? (
            <div className="h-64 bg-white border border-zinc-200/90 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
              <FileText className="w-10 h-10 text-zinc-300 mb-2 stroke-[1.5]" />
              <h3 className="text-sm font-bold text-zinc-800">No documents found</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                {searchQuery
                  ? `No documents matching "${searchQuery}" in this view.`
                  : activeTab === 'shared'
                  ? 'No documents shared with you yet. Switch personas in the top right to test cross-user sharing.'
                  : 'Get started by creating a blank document or importing an existing file.'}
              </p>
              <button
                onClick={() => onCreateDocument('Untitled document')}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Document</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocs.map((doc) => {
                const isOwner = doc.ownerId === currentUser.id;
                const userShare = doc.shares.find((s) => s.userId === currentUser.id);
                const role = isOwner ? 'owner' : userShare?.role || 'viewer';

                return (
                  <div
                    key={doc.id}
                    id={`doc-card-${doc.id}`}
                    onClick={() => onOpenDocument(doc.id)}
                    className="group bg-white border border-zinc-200/90 hover:border-blue-500/80 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    {/* Top Preview Canvas Snippet */}
                    <div className="h-32 bg-zinc-50/80 border-b border-zinc-100 p-4 relative overflow-hidden flex flex-col justify-start">
                      <div className="text-[10px] text-zinc-400 line-clamp-4 leading-relaxed font-serif pointer-events-none select-none">
                        {doc.content.replace(/<[^>]+>/g, ' ').substring(0, 180)}...
                      </div>

                      {/* Top Badges: Ownership & Role */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        {isOwner ? (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                            <Shield className="w-2.5 h-2.5" />
                            <span>Owner</span>
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs ${
                              role === 'editor'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {role === 'editor' ? <Edit3 className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                            <span>{role === 'editor' ? 'Shared Editor' : 'Shared Viewer'}</span>
                          </span>
                        )}
                      </div>

                      {/* Star Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(doc);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white text-zinc-400 hover:text-amber-500 shadow-2xs transition-colors"
                      >
                        <Star className={`w-3.5 h-3.5 ${doc.isStarred ? 'text-amber-500 fill-amber-400' : ''}`} />
                      </button>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="p-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-zinc-900 group-hover:text-blue-600 line-clamp-1 transition-colors">
                          {doc.title}
                        </h4>

                        {/* Card Options Dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuDocId(openMenuDocId === doc.id ? null : doc.id);
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {openMenuDocId === doc.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-30 text-xs">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuDocId(null);
                                  onOpenShareModal(doc);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700"
                              >
                                <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                                <span>Share</span>
                              </button>

                              {isOwner && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuDocId(null);
                                    onDeleteDocument(doc.id);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-red-50 flex items-center gap-2 text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Author & Timestamp */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100">
                        <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                          <div
                            className="w-4 h-4 rounded-full text-white flex items-center justify-center font-bold text-[8px]"
                            style={{
                              backgroundColor:
                                allUsers.find((u) => u.id === doc.ownerId)?.avatarColor || '#3b82f6',
                            }}
                          >
                            {doc.ownerName.charAt(0)}
                          </div>
                          <span className="truncate">{isOwner ? 'You' : doc.ownerName}</span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="bg-white border border-zinc-200/90 rounded-xl overflow-hidden shadow-2xs divide-y divide-zinc-100">
              {filteredDocs.map((doc) => {
                const isOwner = doc.ownerId === currentUser.id;
                const userShare = doc.shares.find((s) => s.userId === currentUser.id);
                const role = isOwner ? 'owner' : userShare?.role || 'viewer';

                return (
                  <div
                    key={doc.id}
                    onClick={() => onOpenDocument(doc.id)}
                    className="p-3.5 hover:bg-zinc-50 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 hover:text-blue-600 truncate">
                          {doc.title}
                        </h4>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>Owner: {isOwner ? 'You' : doc.ownerName}</span>
                          <span>•</span>
                          <span>Modified {new Date(doc.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isOwner ? (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Owner
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            role === 'editor'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {role === 'editor' ? 'Shared Editor' : 'Shared Viewer'}
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(doc);
                        }}
                        className="p-1 text-zinc-400 hover:text-amber-500"
                      >
                        <Star className={`w-4 h-4 ${doc.isStarred ? 'text-amber-500 fill-amber-400' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenShareModal(doc);
                        }}
                        className="p-1 text-zinc-400 hover:text-blue-600"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDocument(doc.id);
                          }}
                          className="p-1 text-zinc-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
