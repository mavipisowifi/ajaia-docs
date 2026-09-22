export type Role = 'owner' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  title: string;
}

export interface DocumentShare {
  userId: string;
  email: string;
  role: 'editor' | 'viewer';
  sharedAt: string;
}

export interface DocumentAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface DocumentRevision {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  summary: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  shares: DocumentShare[];
  attachments: DocumentAttachment[];
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
  revisions: DocumentRevision[];
}

export interface CollaboratorPresence {
  userId: string;
  name: string;
  avatarColor: string;
  activeSection?: string;
  lastActive: number;
}
