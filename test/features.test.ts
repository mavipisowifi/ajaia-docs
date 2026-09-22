import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../server.js';

describe('Document Features & Revision History Tests', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    await new Promise<void>((resolve) => {
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

  it('File Ingestion - should convert raw markdown into rich HTML structure', async () => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const markdownContent = `# Engineering RFC: Real-Time Sync\n\n**Status:** Approved\n\n- Low latency\n- End-to-end encryption`;
    
    const bodyParts = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="sync_rfc.md"',
      'Content-Type: text/markdown',
      '',
      markdownContent,
      `--${boundary}--`,
      '',
    ].join('\r\n');

    const res = await fetch(`${baseUrl}/api/import-file`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: bodyParts,
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.title, 'Sync rfc');
    assert.match(data.content, /<h1[^>]*>Engineering RFC: Real-Time Sync<\/h1>/i);
    assert.match(data.content, /<strong>Status:<\/strong> Approved/i);
    assert.match(data.content, /<li>Low latency<\/li>/i);
  });

  it('Revision History & Rollback - should track revisions and allow rollbacks', async () => {
    // 1. Create initial document
    const createRes = await fetch(`${baseUrl}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Revision Rollback Test Doc',
        content: '<p>Version 1 content</p>',
        ownerId: 'user-elena',
      }),
    });
    const { document: doc } = await createRes.json();
    const docId = doc.id;
    const initialRevId = doc.revisions[0].id;

    // 2. Share with David as viewer
    await fetch(`${baseUrl}/api/documents/${docId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-elena',
        targetUserId: 'user-david',
        role: 'viewer',
      }),
    });

    // 3. Update document to Version 2
    const updateRes = await fetch(`${baseUrl}/api/documents/${docId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-elena',
        title: 'Revision Rollback Test Doc (v2)',
        content: '<p>Version 2 content heavily modified</p>',
      }),
    });
    assert.equal(updateRes.status, 200);

    // 4. Viewer (David) tries to restore Version 1 -> MUST be rejected with 403 Forbidden
    const viewerRestoreRes = await fetch(`${baseUrl}/api/documents/${docId}/revisions/${initialRevId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-david' }),
    });
    assert.equal(viewerRestoreRes.status, 403);
    const viewerErr = await viewerRestoreRes.json();
    assert.match(viewerErr.error, /only editors or owners/i);

    // 5. Owner (Elena) restores Version 1 -> MUST succeed
    const ownerRestoreRes = await fetch(`${baseUrl}/api/documents/${docId}/revisions/${initialRevId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-elena' }),
    });
    assert.equal(ownerRestoreRes.status, 200);
    const restoredData = await ownerRestoreRes.json();
    assert.equal(restoredData.document.content, '<p>Version 1 content</p>');

    // 6. Cleanup
    await fetch(`${baseUrl}/api/documents/${docId}?userId=user-elena`, {
      method: 'DELETE',
    });
  });
});
