import { User, DocumentItem, DocumentAttachment } from '../types';

export const api = {
  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json();
    return data.users;
  },

  async getDocuments(userId: string): Promise<DocumentItem[]> {
    const res = await fetch(`/api/documents?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to load documents');
    const data = await res.json();
    return data.documents;
  },

  async getDocument(id: string, userId: string): Promise<DocumentItem> {
    const res = await fetch(`/api/documents/${id}?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to load document');
    }
    const data = await res.json();
    return data.document;
  },

  async createDocument(title: string, content: string, ownerId: string): Promise<DocumentItem> {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, ownerId }),
    });
    if (!res.ok) throw new Error('Failed to create document');
    const data = await res.json();
    return data.document;
  },

  async updateDocument(
    id: string,
    updates: { title?: string; content?: string; isStarred?: boolean; userId: string }
  ): Promise<DocumentItem> {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update document');
    }
    const data = await res.json();
    return data.document;
  },

  async deleteDocument(id: string, userId: string): Promise<void> {
    const res = await fetch(`/api/documents/${id}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete document');
    }
  },

  async shareDocument(
    id: string,
    payload: { userId: string; targetUserId?: string; targetEmail?: string; role: 'editor' | 'viewer' }
  ): Promise<{ document: DocumentItem }> {
    const res = await fetch(`/api/documents/${id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to share document');
    }
    return res.json();
  },

  async removeShare(id: string, targetUserId: string, userId: string): Promise<{ document: DocumentItem }> {
    const res = await fetch(`/api/documents/${id}/share/${targetUserId}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to revoke access');
    }
    return res.json();
  },

  async restoreRevision(id: string, revId: string, userId: string): Promise<DocumentItem> {
    const res = await fetch(`/api/documents/${id}/revisions/${revId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to restore revision');
    }
    const data = await res.json();
    return data.document;
  },

  async uploadAttachment(id: string, file: File, userId: string): Promise<{ attachment: DocumentAttachment; document: DocumentItem }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const res = await fetch(`/api/documents/${id}/attachments`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload attachment');
    }
    return res.json();
  },

  async deleteAttachment(id: string, attId: string, userId: string): Promise<DocumentItem> {
    const res = await fetch(`/api/documents/${id}/attachments/${attId}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete attachment');
    }
    const data = await res.json();
    return data.document;
  },

  async importFile(file: File): Promise<{ title: string; content: string; originalFileName: string; fileSize: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/import-file', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to import file');
    }
    return res.json();
  },

  async askAi(payload: { action: string; prompt?: string; currentContent?: string; selectedText?: string }): Promise<string> {
    const res = await fetch('/api/ai/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'AI assistance failed');
    }
    const data = await res.json();
    return data.result;
  },
};
