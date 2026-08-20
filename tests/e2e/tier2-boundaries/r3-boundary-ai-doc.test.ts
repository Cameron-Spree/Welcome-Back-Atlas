/**
 * Tier 2 Boundary Test Suite: R3 - Learn Tab & AI Documentation Engine Boundaries
 * Covers empty/whitespace topics, max-length prompts, missing required fields, non-existent step toggles, boundary relevance scores, and complex markdown.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, TestServerInstance } from '../helpers/testServer.js';

describe('Tier 2 — Boundary: R3 Learn Tab & AI Documentation Engine', () => {
  let serverInstance: TestServerInstance;

  beforeAll(async () => {
    serverInstance = await startTestServer();
  });

  afterAll(async () => {
    await serverInstance?.close();
  });

  it('1. Rejects AI guide generation with empty or whitespace-only topic string', async () => {
    const invalidTopics = ['', '   ', '\t\n', '      '];

    for (const topic of invalidTopics) {
      const res = await serverInstance.request
        .post('/api/ai/generate-guide')
        .send({
          topic,
          userId: 'user-cam',
        });

      expect([400, 422]).toContain(res.status);
    }
  });

  it('2. Handles maximum length prompt and extensive context in AI guide generation cleanly', async () => {
    const longTopic = 'Enterprise Multi-Region Database Sharding Architecture with Zero-Downtime Migration Patterns';
    const extensiveContext = 'Context: '.repeat(100) + 'Detailed specifications and edge-case handling.';

    const res = await serverInstance.request
      .post('/api/ai/generate-guide')
      .send({
        topic: longTopic,
        context: extensiveContext,
        userId: 'user-cam',
      });

    // Should succeed and return generated guide
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('doc');
    expect(res.body.doc).toHaveProperty('markdown_content');
    expect(res.body.doc.markdown_content.length).toBeGreaterThan(50);
  });

  it('3. Returns 400 when required fields (userId, topic) are missing from generate-guide request', async () => {
    // Missing topic
    const resNoTopic = await serverInstance.request
      .post('/api/ai/generate-guide')
      .send({ userId: 'user-cam' });
    expect([400, 422]).toContain(resNoTopic.status);

    // Missing userId
    const resNoUser = await serverInstance.request
      .post('/api/ai/generate-guide')
      .send({ topic: 'React Performance Tuning' });
    expect([400, 422]).toContain(resNoUser.status);

    // Completely empty body
    const resEmpty = await serverInstance.request
      .post('/api/ai/generate-guide')
      .send({});
    expect([400, 422]).toContain(resEmpty.status);
  });

  it('4. Returns 404 or 400 when attempting to toggle a non-existent stepNumber on an existing doc', async () => {
    // 1. Get an existing document
    const docsRes = await serverInstance.request.get('/api/docs');
    expect(docsRes.status).toBe(200);
    expect(docsRes.body.length).toBeGreaterThan(0);
    const docId = docsRes.body[0].id;

    // 2. Try toggling invalid step numbers
    const invalidStepNumbers = [9999, -1, 0, 100000];

    for (const stepNum of invalidStepNumbers) {
      const res = await serverInstance.request
        .patch(`/api/docs/${docId}/step`)
        .send({
          stepNumber: stepNum,
          completed: true,
        });

      expect([404, 400, 422]).toContain(res.status);
    }
  });

  it('5. Returns 404 when attempting to toggle a step on a non-existent document ID', async () => {
    const fakeDocIds = ['doc_non_existent_9999', 'unknown-uuid-0000', 'null'];

    for (const fakeId of fakeDocIds) {
      const res = await serverInstance.request
        .patch(`/api/docs/${fakeId}/step`)
        .send({
          stepNumber: 1,
          completed: true,
        });

      expect([404, 400]).toContain(res.status);
    }
  });

  it('6. Correctly handles documents with boundary AI relevance scores (0, 100) and null linked tasks', async () => {
    // Create doc with relevance score = 0 and no linked task
    const doc0Res = await serverInstance.request
      .post('/api/docs')
      .send({
        title: 'Zero Relevance Reference Doc',
        subtitle: 'General reference without direct task binding',
        category: 'Architecture',
        tags: ['reference', 'general'],
        preview_image_url: 'https://example.com/banner.png',
        preview_link_url: 'https://example.com/doc',
        ai_relevance_summary: 'Broad general reference, no active sprint task correlation.',
        ai_relevance_score: 0,
        markdown_content: '# General Doc\n\nNo specific task correlation.',
        steps: [{ stepNumber: 1, title: 'Read info', description: 'Read doc', completed: false }],
        linked_task_id: null,
        is_ai_generated: false,
      });

    expect([200, 201]).toContain(doc0Res.status);
    expect(doc0Res.body.ai_relevance_score).toBe(0);

    // Create doc with relevance score = 100
    const doc100Res = await serverInstance.request
      .post('/api/docs')
      .send({
        title: 'Max Relevance Essential Guide',
        subtitle: 'Critical path blocker for current task',
        category: 'Core',
        tags: ['critical', 'urgent'],
        preview_image_url: 'https://example.com/banner100.png',
        preview_link_url: 'https://example.com/doc100',
        ai_relevance_summary: '100% direct match to assigned critical task.',
        ai_relevance_score: 100,
        markdown_content: '# Critical Guide\n\nDirect match.',
        steps: [{ stepNumber: 1, title: 'Execute hotfix', description: 'Urgent action', completed: false }],
        linked_task_id: null,
        is_ai_generated: false,
      });

    expect([200, 201]).toContain(doc100Res.status);
    expect(doc100Res.body.ai_relevance_score).toBe(100);

    // Retrieve docs list and verify both are queryable
    const allDocsRes = await serverInstance.request.get('/api/docs');
    expect(allDocsRes.status).toBe(200);
    const score0Doc = allDocsRes.body.find((d: any) => d.id === doc0Res.body.id);
    const score100Doc = allDocsRes.body.find((d: any) => d.id === doc100Res.body.id);
    expect(score0Doc?.ai_relevance_score).toBe(0);
    expect(score100Doc?.ai_relevance_score).toBe(100);
  });

  it('7. Stores and retrieves markdown docs with empty content or empty step checklists without errors', async () => {
    const emptyDocRes = await serverInstance.request
      .post('/api/docs')
      .send({
        title: 'Empty Draft Document',
        subtitle: 'Placeholder doc',
        category: 'Drafts',
        tags: [],
        preview_image_url: '',
        preview_link_url: '',
        ai_relevance_summary: '',
        ai_relevance_score: 50,
        markdown_content: '',
        steps: [],
        is_ai_generated: false,
      });

    expect([200, 201]).toContain(emptyDocRes.status);
    expect(emptyDocRes.body.markdown_content).toBe('');
    expect(Array.isArray(emptyDocRes.body.steps)).toBe(true);
    expect(emptyDocRes.body.steps.length).toBe(0);
  });

  it('8. Preserves complex markdown formatting including backticks, code blocks, and HTML entities', async () => {
    const complexMarkdown = `
# Complex Architecture Guide

\`\`\`typescript
interface ComplexGeneric<T extends Record<string, any>> {
  id: string;
  handler: (data: T) => Promise<void>;
}
\`\`\`

| Feature | Support | Notes |
| :--- | :---: | ---: |
| SQLite WAL | Yes | 100% Concurrent |
| WebSocket | Yes | Bi-directional |

- Nested list 1
  - Sub-item 1a \`inline code\`
  - Sub-item 1b with **bold** and *italic*

<blockquote>HTML Blockquote with &amp; entity</blockquote>
`;

    const docRes = await serverInstance.request
      .post('/api/docs')
      .send({
        title: 'Complex Markdown Formatting Doc',
        subtitle: 'Formatting stress test',
        category: 'Syntax',
        tags: ['markdown', 'syntax-stress'],
        preview_image_url: 'https://example.com/banner.png',
        preview_link_url: 'https://example.com/guide',
        ai_relevance_summary: 'Syntax test summary.',
        ai_relevance_score: 75,
        markdown_content: complexMarkdown,
        steps: [{ stepNumber: 1, title: 'Verify Markdown', description: 'Step description', completed: false }],
        is_ai_generated: false,
      });

    expect([200, 201]).toContain(docRes.status);

    // Fetch by ID and verify identical markdown content
    const fetchRes = await serverInstance.request.get(`/api/docs/${docRes.body.id}`);
    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.markdown_content).toBe(complexMarkdown);
  });
});
