/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Toolbar } from './components/Toolbar';
import { EditorCanvas, EditorCanvasRef } from './components/EditorCanvas';
import { DocumentList } from './components/DocumentList';
import { ShareModal } from './components/ShareModal';
import { FileUploadModal } from './components/FileUploadModal';
import { AttachmentsDrawer } from './components/AttachmentsDrawer';
import { VersionHistoryDrawer } from './components/VersionHistoryDrawer';
import { AiAssistantModal } from './components/AiAssistantModal';
import { api } from './services/api';
import { User, DocumentItem } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user-elena',
    name: 'Elena Rostova',
    email: 'elena@ajaia.internal',
    avatarColor: '#2563eb',
    title: 'Lead Product Designer',
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | null>('doc-product-roadmap');
  const [currentDoc, setCurrentDoc] = useState<DocumentItem | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'readonly'>('saved');
  const [loading, setLoading] = useState(true);

  // Modals & Panels state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Formatting state for toolbar
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    block: 'p',
    align: 'left',
  });

  const editorRef = useRef<EditorCanvasRef>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial load: users and documents
  useEffect(() => {
    async function init() {
      try {
        const users = await api.getUsers();
        setAllUsers(users);
        const docs = await api.getDocuments(currentUser.id);
        setDocuments(docs);

        // Load default document if available
        if (docs.length > 0 && currentDocId) {
          const doc = await api.getDocument(currentDocId, currentUser.id);
          setCurrentDoc(doc);
          setEditorContent(doc.content);
        } else if (docs.length > 0) {
          const doc = await api.getDocument(docs[0].id, currentUser.id);
          setCurrentDoc(doc);
          setCurrentDocId(doc.id);
          setEditorContent(doc.content);
        }
      } catch (err) {
        console.error('Initial load failure:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // When user switches persona, refresh documents and check current document access
  const handleSwitchUser = async (newUser: User) => {
    setCurrentUser(newUser);
    try {
      const docs = await api.getDocuments(newUser.id);
      setDocuments(docs);

      if (currentDocId) {
        try {
          const doc = await api.getDocument(currentDocId, newUser.id);
          setCurrentDoc(doc);
          setEditorContent(doc.content);
          const isReadOnly = (doc as any).userRole === 'viewer';
          setSaveStatus(isReadOnly ? 'readonly' : 'saved');
        } catch {
          // If new user does not have access to current document, return to dashboard
          setCurrentDoc(null);
          setCurrentDocId(null);
        }
      }
    } catch (err) {
      console.error('Error switching user persona:', err);
    }
  };

  // Determine if current user is read-only
  const isReadOnly = currentDoc
    ? (currentDoc as any).userRole === 'viewer'
    : false;

  useEffect(() => {
    if (isReadOnly) {
      setSaveStatus('readonly');
    } else if (saveStatus === 'readonly') {
      setSaveStatus('saved');
    }
  }, [isReadOnly]);

  // Load document by ID
  const handleOpenDocument = async (id: string) => {
    try {
      setLoading(true);
      const doc = await api.getDocument(id, currentUser.id);
      setCurrentDoc(doc);
      setCurrentDocId(doc.id);
      setEditorContent(doc.content);
      const readOnly = (doc as any).userRole === 'viewer';
      setSaveStatus(readOnly ? 'readonly' : 'saved');
    } catch (err) {
      console.error('Error opening document:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-save logic with debouncing
  const handleContentChange = useCallback(
    (newHtml: string) => {
      if (!currentDoc || isReadOnly) return;
      setEditorContent(newHtml);
      setSaveStatus('saving');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const updated = await api.updateDocument(currentDoc.id, {
            content: newHtml,
            userId: currentUser.id,
          });
          setCurrentDoc(updated);
          setSaveStatus('saved');

          // Update in memory list
          setDocuments((prev) =>
            prev.map((d) => (d.id === updated.id ? { ...d, content: newHtml, updatedAt: updated.updatedAt } : d))
          );
        } catch (err) {
          console.error('Auto-save failure:', err);
          setSaveStatus('error');
        }
      }, 700);
    },
    [currentDoc, currentUser.id, isReadOnly]
  );

  // Rename document
  const handleTitleChange = async (newTitle: string) => {
    if (!currentDoc || isReadOnly) return;
    try {
      const updated = await api.updateDocument(currentDoc.id, {
        title: newTitle,
        userId: currentUser.id,
      });
      setCurrentDoc(updated);
      setDocuments((prev) =>
        prev.map((d) => (d.id === updated.id ? { ...d, title: newTitle } : d))
      );
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  // Toggle star
  const handleToggleStar = async () => {
    if (!currentDoc) return;
    const newStar = !currentDoc.isStarred;
    try {
      const updated = await api.updateDocument(currentDoc.id, {
        isStarred: newStar,
        userId: currentUser.id,
      });
      setCurrentDoc(updated);
      setDocuments((prev) =>
        prev.map((d) => (d.id === updated.id ? { ...d, isStarred: newStar } : d))
      );
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  // Create new document (from scratch or template)
  const handleCreateDocument = async (title: string = 'Untitled document', initialContent: string = '<p>Start typing here...</p>') => {
    try {
      setLoading(true);
      const created = await api.createDocument(title, initialContent, currentUser.id);
      setDocuments((prev) => [created, ...prev]);
      setCurrentDoc(created);
      setCurrentDocId(created.id);
      setEditorContent(created.content);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to create document:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete document
  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? This cannot be undone.')) return;
    try {
      await api.deleteDocument(id, currentUser.id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (currentDocId === id) {
        setCurrentDoc(null);
        setCurrentDocId(null);
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Only the document owner can delete this document.');
    }
  };

  // Sharing updates
  const handleShare = async (payload: { targetUserId?: string; targetEmail?: string; role: 'editor' | 'viewer' }) => {
    if (!currentDoc) return;
    const result = await api.shareDocument(currentDoc.id, {
      userId: currentUser.id,
      ...payload,
    });
    setCurrentDoc((prev) => (prev ? { ...prev, shares: result.document.shares } : null));
    setDocuments((prev) =>
      prev.map((d) => (d.id === currentDoc.id ? { ...d, shares: result.document.shares } : d))
    );
  };

  const handleRemoveShare = async (targetUserId: string) => {
    if (!currentDoc) return;
    const result = await api.removeShare(currentDoc.id, targetUserId, currentUser.id);
    setCurrentDoc((prev) => (prev ? { ...prev, shares: result.document.shares } : null));
    setDocuments((prev) =>
      prev.map((d) => (d.id === currentDoc.id ? { ...d, shares: result.document.shares } : d))
    );
  };

  // Revision restoration
  const handleRestoreRevision = async (revId: string) => {
    if (!currentDoc) return;
    const restored = await api.restoreRevision(currentDoc.id, revId, currentUser.id);
    setCurrentDoc(restored);
    setEditorContent(restored.content);
    setDocuments((prev) =>
      prev.map((d) => (d.id === restored.id ? restored : d))
    );
  };

  // Attachment upload
  const handleUploadAttachment = async (file: File) => {
    if (!currentDoc) return;
    const res = await api.uploadAttachment(currentDoc.id, file, currentUser.id);
    setCurrentDoc(res.document);
    setDocuments((prev) =>
      prev.map((d) => (d.id === res.document.id ? res.document : d))
    );
  };

  const handleDeleteAttachment = async (attId: string) => {
    if (!currentDoc) return;
    const updated = await api.deleteAttachment(currentDoc.id, attId, currentUser.id);
    setCurrentDoc(updated);
    setDocuments((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
  };

  // File import workflow (.md, .txt, .html, .json)
  const handleImportSuccess = (result: { title: string; content: string; mode: 'new' | 'insert' }) => {
    if (result.mode === 'new') {
      handleCreateDocument(result.title, result.content);
    } else {
      // Append to current document
      if (editorRef.current) {
        editorRef.current.insertHtml(result.content);
      } else {
        const merged = `${editorContent}<hr/>${result.content}`;
        handleContentChange(merged);
      }
    }
  };

  // AI text insertion
  const handleInsertAiText = (html: string) => {
    if (editorRef.current) {
      editorRef.current.insertHtml(html);
    } else {
      handleContentChange(`${editorContent}<p>${html}</p>`);
    }
  };

  // Export handlers
  const handleExport = (format: 'html' | 'md' | 'txt') => {
    if (!currentDoc) return;
    let mimeType = 'text/plain';
    let ext = 'txt';
    let fileData = '';

    if (format === 'html') {
      mimeType = 'text/html';
      ext = 'html';
      fileData = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${currentDoc.title}</title></head><body>${editorContent}</body></html>`;
    } else if (format === 'md') {
      mimeType = 'text/markdown';
      ext = 'md';
      // Simple HTML to markdown tags representation
      fileData = `# ${currentDoc.title}\n\n` + editorContent
        .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<em>(.*?)<\/em>/gi, '*$1*')
        .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<[^>]+>/g, '');
    } else {
      fileData = editorContent.replace(/<[^>]+>/g, ' ');
    }

    const blob = new Blob([fileData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDoc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Formatting commands for Toolbar
  const handleToolbarCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.execCommand(command, value);
    }
    updateFormatState();
  };

  const handleFormatBlock = (tag: string) => {
    if (editorRef.current) {
      editorRef.current.formatBlock(tag);
    }
    updateFormatState();
  };

  const updateFormatState = () => {
    if (typeof document !== 'undefined') {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikeThrough'),
        block: document.queryCommandValue('formatBlock') || 'p',
        align: document.queryCommandState('justifyCenter')
          ? 'center'
          : document.queryCommandState('justifyRight')
          ? 'right'
          : 'left',
      });
    }
  };

  const handleInsertImage = () => {
    const url = prompt('Enter image URL:');
    if (url && editorRef.current) {
      editorRef.current.insertHtml(`<img src="${url}" alt="Embedded image" />`);
    }
  };

  const handleInsertLink = () => {
    const url = prompt('Enter destination URL:');
    if (url && editorRef.current) {
      editorRef.current.execCommand('createLink', url);
    }
  };

  // Simulated active collaborator presence (e.g. colleagues currently active on this document)
  const simulatedCollaborators = allUsers
    .filter((u) => u.id !== currentUser.id)
    .slice(0, 2)
    .map((u) => ({ id: u.id, name: u.name, avatarColor: u.avatarColor }));

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
          <span className="text-xs font-semibold text-zinc-600">Loading Ajaia Docs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 text-zinc-900 font-sans">
      {/* If no document is selected, render the Document Explorer Dashboard */}
      {!currentDoc ? (
        <DocumentList
          documents={documents}
          currentUser={currentUser}
          allUsers={allUsers}
          onOpenDocument={handleOpenDocument}
          onCreateDocument={handleCreateDocument}
          onOpenImport={() => setIsImportModalOpen(true)}
          onDeleteDocument={handleDeleteDocument}
          onToggleStar={(doc) => {
            setCurrentDoc(doc);
            handleToggleStar();
          }}
          onOpenShareModal={(doc) => {
            setCurrentDoc(doc);
            setIsShareModalOpen(true);
          }}
          onSwitchUser={handleSwitchUser}
        />
      ) : (
        /* Active Document Editor Workspace */
        <>
          <Navbar
            document={currentDoc}
            currentUser={currentUser}
            allUsers={allUsers}
            saveStatus={saveStatus}
            onTitleChange={handleTitleChange}
            onToggleStar={handleToggleStar}
            onOpenShare={() => setIsShareModalOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenAttachments={() => setIsAttachmentsOpen(true)}
            onOpenImport={() => setIsImportModalOpen(true)}
            onOpenAi={() => setIsAiOpen(true)}
            onNewDocument={() => handleCreateDocument()}
            onSwitchUser={handleSwitchUser}
            onBackToDashboard={() => {
              setCurrentDoc(null);
              setCurrentDocId(null);
            }}
            onExport={handleExport}
            onPrint={() => window.print()}
            collaborators={simulatedCollaborators}
          />

          <Toolbar
            onCommand={handleToolbarCommand}
            onFormatBlock={handleFormatBlock}
            onInsertImage={handleInsertImage}
            onInsertLink={handleInsertLink}
            onOpenAi={() => setIsAiOpen(true)}
            onUndo={() => handleToolbarCommand('undo')}
            onRedo={() => handleToolbarCommand('redo')}
            disabled={isReadOnly}
            activeFormats={activeFormats}
          />

          <EditorCanvas
            ref={editorRef}
            document={currentDoc}
            content={editorContent}
            isReadOnly={isReadOnly}
            onChange={handleContentChange}
            onSelectionChange={updateFormatState}
          />

          {/* Share Modal */}
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            document={currentDoc}
            currentUser={currentUser}
            allUsers={allUsers}
            onShare={handleShare}
            onRemoveShare={handleRemoveShare}
          />

          {/* File Upload & Ingestion Modal */}
          <FileUploadModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            currentDocId={currentDoc?.id}
            currentUserId={currentUser.id}
            onImportSuccess={handleImportSuccess}
            onAttachmentUploaded={() => {
              if (currentDoc) {
                api.getDocument(currentDoc.id, currentUser.id).then(setCurrentDoc);
              }
            }}
          />

          {/* Attachments Drawer */}
          <AttachmentsDrawer
            isOpen={isAttachmentsOpen}
            onClose={() => setIsAttachmentsOpen(false)}
            attachments={currentDoc?.attachments || []}
            isReadOnly={isReadOnly}
            onUpload={handleUploadAttachment}
            onDelete={handleDeleteAttachment}
          />

          {/* Version History Drawer */}
          <VersionHistoryDrawer
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            revisions={currentDoc?.revisions || []}
            isReadOnly={isReadOnly}
            onRestore={handleRestoreRevision}
          />

          {/* AI Writing Assistant Modal */}
          <AiAssistantModal
            isOpen={isAiOpen}
            onClose={() => setIsAiOpen(false)}
            currentContent={editorContent}
            onInsertGeneratedText={handleInsertAiText}
          />
        </>
      )}
    </div>
  );
}
