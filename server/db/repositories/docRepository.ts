import { getDatabase } from '../database.js';

export interface DocStep {
  stepNumber: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface LearningDoc {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  tags: string[];
  preview_image_url: string;
  preview_link_url: string;
  ai_relevance_summary: string;
  ai_relevance_score: number;
  markdown_content: string;
  steps: DocStep[];
  linked_task_id?: string | null;
  author_id?: string | null;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

interface DocDbRow {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  tags: string;
  preview_image_url: string;
  preview_link_url: string;
  ai_relevance_summary: string;
  ai_relevance_score: number;
  markdown_content: string;
  steps: string;
  linked_task_id: string | null;
  author_id: string | null;
  is_ai_generated: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDocInput {
  id?: string;
  title: string;
  subtitle?: string;
  category?: string;
  tags?: string[];
  preview_image_url?: string;
  preview_link_url?: string;
  ai_relevance_summary?: string;
  ai_relevance_score?: number;
  markdown_content: string;
  steps?: DocStep[];
  linked_task_id?: string | null;
  author_id?: string | null;
  is_ai_generated?: boolean;
  created_at?: string;
  updated_at?: string;
}

function mapDocRow(row: DocDbRow): LearningDoc {
  let parsedTags: string[] = [];
  try {
    parsedTags = JSON.parse(row.tags || '[]');
  } catch {
    parsedTags = [];
  }

  let parsedSteps: DocStep[] = [];
  try {
    parsedSteps = JSON.parse(row.steps || '[]');
  } catch {
    parsedSteps = [];
  }

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || '',
    category: row.category,
    tags: parsedTags,
    preview_image_url: row.preview_image_url || '',
    preview_link_url: row.preview_link_url || '',
    ai_relevance_summary: row.ai_relevance_summary,
    ai_relevance_score: row.ai_relevance_score,
    markdown_content: row.markdown_content,
    steps: parsedSteps,
    linked_task_id: row.linked_task_id,
    author_id: row.author_id,
    is_ai_generated: row.is_ai_generated === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const docRepository = {
  getAll(category?: string, tag?: string): LearningDoc[] {
    const db = getDatabase();
    let query = 'SELECT * FROM learning_docs WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }
    if (tag) {
      query += ' AND tags LIKE ?';
      params.push(`%"${tag}"%`);
    }

    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params) as DocDbRow[];
    return rows.map(mapDocRow);
  },

  getById(id: string): LearningDoc | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM learning_docs WHERE id = ?').get(id) as DocDbRow | undefined;
    return row ? mapDocRow(row) : null;
  },

  create(input: CreateDocInput): LearningDoc {
    const db = getDatabase();
    const id = input.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const tagsJson = JSON.stringify(input.tags || []);
    const stepsJson = JSON.stringify(input.steps || []);

    db.prepare(`
      INSERT INTO learning_docs (
        id, title, subtitle, category, tags, preview_image_url, preview_link_url,
        ai_relevance_summary, ai_relevance_score, markdown_content, steps, linked_task_id,
        author_id, is_ai_generated, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.title,
      input.subtitle || '',
      input.category || 'Architecture',
      tagsJson,
      input.preview_image_url || '',
      input.preview_link_url || '',
      input.ai_relevance_summary || 'Curated documentation matching task requirements.',
      input.ai_relevance_score ?? 90,
      input.markdown_content,
      stepsJson,
      input.linked_task_id || null,
      input.author_id || null,
      input.is_ai_generated ? 1 : 0,
      input.created_at || now,
      input.updated_at || now
    );

    return docRepository.getById(id)!;
  },

  update(id: string, updates: Partial<LearningDoc>): LearningDoc | null {
    const db = getDatabase();
    const existing = docRepository.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.subtitle !== undefined) {
      fields.push('subtitle = ?');
      values.push(updates.subtitle);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.preview_image_url !== undefined) {
      fields.push('preview_image_url = ?');
      values.push(updates.preview_image_url);
    }
    if (updates.preview_link_url !== undefined) {
      fields.push('preview_link_url = ?');
      values.push(updates.preview_link_url);
    }
    if (updates.ai_relevance_summary !== undefined) {
      fields.push('ai_relevance_summary = ?');
      values.push(updates.ai_relevance_summary);
    }
    if (updates.ai_relevance_score !== undefined) {
      fields.push('ai_relevance_score = ?');
      values.push(updates.ai_relevance_score);
    }
    if (updates.markdown_content !== undefined) {
      fields.push('markdown_content = ?');
      values.push(updates.markdown_content);
    }
    if (updates.steps !== undefined) {
      fields.push('steps = ?');
      values.push(JSON.stringify(updates.steps));
    }
    if (updates.linked_task_id !== undefined) {
      fields.push('linked_task_id = ?');
      values.push(updates.linked_task_id);
    }
    if (updates.is_ai_generated !== undefined) {
      fields.push('is_ai_generated = ?');
      values.push(updates.is_ai_generated ? 1 : 0);
    }

    if (fields.length === 0) return existing;

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE learning_docs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return docRepository.getById(id);
  },

  toggleStep(docId: string, stepNumber: number, completed: boolean): LearningDoc | null {
    const doc = docRepository.getById(docId);
    if (!doc) return null;

    let stepFound = false;
    const updatedSteps = doc.steps.map((step) => {
      if (step.stepNumber === stepNumber) {
        stepFound = true;
        return { ...step, completed };
      }
      return step;
    });

    if (!stepFound) {
      // If step number wasn't pre-existing, handle gracefully
      updatedSteps.push({
        stepNumber,
        title: `Step ${stepNumber}`,
        description: '',
        completed,
      });
    }

    return docRepository.update(docId, { steps: updatedSteps });
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM learning_docs WHERE id = ?').run(id);
    return result.changes > 0;
  },
};

export default docRepository;
