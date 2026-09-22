import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../server.js';

describe('HTTP API Integration & RBAC Tests', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    await new Promise<void>((resolve) => {
      // Listen on ephemeral port assigned by OS
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('GET /api/users - should return the list of seeded collaborators', async () => {
    const res = await fetch(`${baseUrl}/api/users`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(Array.isArray(data.users), true);
    assert.equal(data.users.length >= 4, true);

    const elena = data.users.find((u: any) => u.id === 'user-elena');
    assert.ok(elena);
    assert.equal(elena.name, 'Elena Rostova');
    assert.equal(elena.email, 'elena@ajaia.internal');
  });

  it('POST /api/documents - should reject title longer than 250 characters with 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Z'.repeat(251),
        content: '<p>Test</p>',
        ownerId: 'user-elena',
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /cannot exceed 250 characters/i);
  });

  it('POST /api/documents - should create a new document with owner and revision snapshot', async () => {
    const res = await fetch(`${baseUrl}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Automated Test Document',
        content: '<p>Initial automated content</p>',
        ownerId: 'user-elena',
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.document);
    assert.equal(data.document.title, 'Automated Test Document');
    assert.equal(data.document.ownerId, 'user-elena');
    assert.equal(data.document.userRole, 'owner');
    assert.equal(data.document.revisions.length, 1);
  });

  it('RBAC Flow - Creation, Sharing, Permissions & Deletion Lifecycle', async () => {
    // 1. Create a doc owned by Marcus
    const createRes = await fetch(`${baseUrl}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Marcus System Architecture RFC',
        content: '<h1>Architecture</h1><p>High performance distributed queue</p>',
        ownerId: 'user-marcus',
      }),
    });
    assert.equal(createRes.status, 201);
    const { document: doc } = await createRes.json();
    const docId = doc.id;

    // 2. Share with David as a 'viewer'
    const shareRes = await fetch(`${baseUrl}/api/documents/${docId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-marcus', // Owner requesting share
        targetUserId: 'user-david',
        role: 'viewer',
      }),
    });
    assert.equal(shareRes.status, 200);

    // 3. Unauthorized access check: Sarah has not been shared this doc
    const unauthorizedRes = await fetch(`${baseUrl}/api/documents/${docId}?userId=user-sarah`);
    assert.equal(unauthorizedRes.status, 403);

    // 4. Viewer access check: David can read the doc with 'viewer' role
    const viewerGetRes = await fetch(`${baseUrl}/api/documents/${docId}?userId=user-david`);
    assert.equal(viewerGetRes.status, 200);
    const viewerData = await viewerGetRes.json();
    assert.equal(viewerData.document.userRole, 'viewer');
    assert.equal(viewerData.document.isOwner, false);

    // 5. RBAC Protection: David (viewer) attempts to modify content -> MUST return 403
    const viewerEditRes = await fetch(`${baseUrl}/api/documents/${docId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-david',
        content: '<p>Unauthorized edit attempt</p>',
      }),
    });
    assert.equal(viewerEditRes.status, 403);
    const editErr = await viewerEditRes.json();
    assert.match(editErr.error, /viewers cannot modify/i);

    // 6. Share settings protection: David (viewer) attempts to change shares -> MUST return 403
    const viewerShareRes = await fetch(`${baseUrl}/api/documents/${docId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-david',
        targetUserId: 'user-sarah',
        role: 'editor',
      }),
    });
    assert.equal(viewerShareRes.status, 403);

    // 7. Share validation: Owner supplies invalid role -> MUST return 400
    const invalidRoleRes = await fetch(`${baseUrl}/api/documents/${docId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-marcus',
        targetUserId: 'user-sarah',
        role: 'superadmin',
      }),
    });
    assert.equal(invalidRoleRes.status, 400);

    // 8. Share validation: Owner supplies invalid email -> MUST return 400
    const invalidEmailRes = await fetch(`${baseUrl}/api/documents/${docId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-marcus',
        targetEmail: 'not-an-email-address',
        role: 'editor',
      }),
    });
    assert.equal(invalidEmailRes.status, 400);

    // 9. Upgrade David to 'editor'
    const upgradeRes = await fetch(`${baseUrl}/api/documents/${docId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-marcus',
        targetUserId: 'user-david',
        role: 'editor',
      }),
    });
    assert.equal(upgradeRes.status, 200);

    // 10. David (now editor) successfully modifies content
    const editorEditRes = await fetch(`${baseUrl}/api/documents/${docId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-david',
        content: '<p>Legitimate update from editor David</p>',
      }),
    });
    assert.equal(editorEditRes.status, 200);

    // 11. Deletion protection: David (editor) attempts to delete doc -> MUST return 403
    const nonOwnerDeleteRes = await fetch(`${baseUrl}/api/documents/${docId}?userId=user-david`, {
      method: 'DELETE',
    });
    assert.equal(nonOwnerDeleteRes.status, 403);

    // 12. Deletion authorized: Marcus (owner) deletes doc -> MUST return 200
    const ownerDeleteRes = await fetch(`${baseUrl}/api/documents/${docId}?userId=user-marcus`, {
      method: 'DELETE',
    });
    assert.equal(ownerDeleteRes.status, 200);

    // 13. Verify doc is deleted -> MUST return 404
    const verifyDeleteRes = await fetch(`${baseUrl}/api/documents/${docId}?userId=user-marcus`);
    assert.equal(verifyDeleteRes.status, 404);
  });

  it('GET /api/unknown-route - should return 404 with structured error JSON', async () => {
    const res = await fetch(`${baseUrl}/api/some-non-existent-endpoint`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.error, 'API endpoint not found.');
  });
});
