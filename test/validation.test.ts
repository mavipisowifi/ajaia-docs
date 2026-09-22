import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Set test environment before importing server logic
process.env.NODE_ENV = 'test';

import {
  validateDocumentTitle,
  validateEmail,
  validateRole,
  getUserRole,
  SEED_USERS,
  DocumentItem,
} from '../server.js';

describe('Validation Unit Tests', () => {
  describe('validateDocumentTitle', () => {
    it('should return default title when title is undefined or null', () => {
      assert.deepEqual(validateDocumentTitle(undefined), { valid: true, value: 'Untitled document' });
      assert.deepEqual(validateDocumentTitle(null), { valid: true, value: 'Untitled document' });
    });

    it('should return default title when title is an empty string or whitespace only', () => {
      assert.deepEqual(validateDocumentTitle(''), { valid: true, value: 'Untitled document' });
      assert.deepEqual(validateDocumentTitle('   '), { valid: true, value: 'Untitled document' });
    });

    it('should trim and accept valid titles', () => {
      const res = validateDocumentTitle('   Sprint Planning Notes   ');
      assert.equal(res.valid, true);
      assert.equal(res.value, 'Sprint Planning Notes');
    });

    it('should reject non-string title types', () => {
      const res = validateDocumentTitle(12345);
      assert.equal(res.valid, false);
      assert.match(res.error || '', /must be a string/i);
    });

    it('should reject titles longer than 250 characters', () => {
      const longTitle = 'A'.repeat(251);
      const res = validateDocumentTitle(longTitle);
      assert.equal(res.valid, false);
      assert.match(res.error || '', /cannot exceed 250 characters/i);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      assert.equal(validateEmail('elena@ajaia.internal'), true);
      assert.equal(validateEmail('user.name+tag@example.com'), true);
      assert.equal(validateEmail('sarah_ux@domain.co.uk'), true);
    });

    it('should reject invalid email formats', () => {
      assert.equal(validateEmail('not-an-email'), false);
      assert.equal(validateEmail('@missinguser.com'), false);
      assert.equal(validateEmail('missingdomain@'), false);
      assert.equal(validateEmail('spaces in@email.com'), false);
      assert.equal(validateEmail(null), false);
      assert.equal(validateEmail(undefined), false);
    });
  });

  describe('validateRole', () => {
    it('should accept "editor" and "viewer"', () => {
      assert.equal(validateRole('editor'), 'editor');
      assert.equal(validateRole('viewer'), 'viewer');
    });

    it('should reject arbitrary or malicious role strings', () => {
      assert.equal(validateRole('admin'), null);
      assert.equal(validateRole('owner'), null);
      assert.equal(validateRole('root'), null);
      assert.equal(validateRole(''), null);
      assert.equal(validateRole(null), null);
    });
  });

  describe('getUserRole (RBAC)', () => {
    const mockDoc: DocumentItem = {
      id: 'doc-mock-1',
      title: 'Mock Architecture RFC',
      content: '<p>Content</p>',
      ownerId: 'user-elena',
      ownerName: 'Elena Rostova',
      ownerEmail: 'elena@ajaia.internal',
      shares: [
        {
          userId: 'user-marcus',
          email: 'marcus@ajaia.internal',
          role: 'editor',
          sharedAt: new Date().toISOString(),
        },
        {
          userId: 'user-david',
          email: 'david@ajaia.internal',
          role: 'viewer',
          sharedAt: new Date().toISOString(),
        },
      ],
      attachments: [],
      isStarred: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revisions: [],
    };

    it('should identify the document owner as "owner"', () => {
      const role = getUserRole(mockDoc, 'user-elena');
      assert.equal(role, 'owner');
    });

    it('should identify users with editor shares as "editor"', () => {
      const role = getUserRole(mockDoc, 'user-marcus');
      assert.equal(role, 'editor');
    });

    it('should identify users with viewer shares as "viewer"', () => {
      const role = getUserRole(mockDoc, 'user-david');
      assert.equal(role, 'viewer');
    });

    it('should return null for unauthorized users', () => {
      const role = getUserRole(mockDoc, 'user-unauthorized');
      assert.equal(role, null);
    });
  });

  describe('Seeded Team Members', () => {
    it('should provide the required seeded team personas', () => {
      assert.equal(SEED_USERS.length >= 4, true);
      const userIds = SEED_USERS.map((u) => u.id);
      assert.equal(userIds.includes('user-elena'), true);
      assert.equal(userIds.includes('user-marcus'), true);
      assert.equal(userIds.includes('user-sarah'), true);
      assert.equal(userIds.includes('user-david'), true);
    });
  });
});
