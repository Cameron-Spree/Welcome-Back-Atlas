import { getDatabase } from '../database.js';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignee_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string;
  end_date: string;
  progress_pct: number;
  color?: string;
  category: string;
  tags: string[];
  checklist: ChecklistItem[];
  doc_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskDbRow {
  id: string;
  title: string;
  description: string;
  assignee_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string;
  end_date: string;
  progress_pct: number;
  color: string | null;
  category: string;
  tags: string;
  checklist: string;
  doc_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  assignee?: string;
  assigneeId?: string;
  assignee_id?: string;
  status?: TaskStatus;
  category?: string;
  priority?: TaskPriority;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateTaskInput {
  id?: string;
  title: string;
  description?: string;
  assignee_id?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  start_date?: string;
  end_date?: string;
  progress_pct?: number;
  color?: string;
  category?: string;
  tags?: string[];
  checklist?: ChecklistItem[];
  doc_id?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

function mapTaskRow(row: TaskDbRow): TaskItem {
  let parsedTags: string[] = [];
  try {
    parsedTags = JSON.parse(row.tags || '[]');
  } catch {
    parsedTags = [];
  }

  let parsedChecklist: ChecklistItem[] = [];
  try {
    parsedChecklist = JSON.parse(row.checklist || '[]');
  } catch {
    parsedChecklist = [];
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    assignee_id: row.assignee_id,
    status: row.status,
    priority: row.priority,
    start_date: row.start_date,
    end_date: row.end_date,
    progress_pct: row.progress_pct,
    color: row.color || '#10b981',
    category: row.category || 'Engineering',
    tags: parsedTags,
    checklist: parsedChecklist,
    doc_id: row.doc_id,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const taskRepository = {
  getAll(filters?: TaskFilters): TaskItem[] {
    const db = getDatabase();
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    const rawAssignee = filters?.assignee_id || filters?.assigneeId || filters?.assignee;
    if (rawAssignee && rawAssignee !== 'all') {
      const clean = rawAssignee.trim();
      const alt = clean.startsWith('user-') ? clean.replace('user-', '') : `user-${clean}`;
      query += ' AND (assignee_id = ? OR assignee_id = ?)';
      params.push(clean, alt);
    }
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters?.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }
    if (filters?.startDate && filters?.endDate) {
      query += ' AND start_date <= ? AND end_date >= ?';
      params.push(filters.endDate, filters.startDate);
    }
    if (filters?.search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)';
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY start_date ASC, priority DESC';

    const rows = db.prepare(query).all(...params) as TaskDbRow[];
    return rows.map(mapTaskRow);
  },

  filterTasks(filters: TaskFilters): TaskItem[] {
    return taskRepository.getAll(filters);
  },

  getById(id: string): TaskItem | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskDbRow | undefined;
    return row ? mapTaskRow(row) : null;
  },

  create(input: CreateTaskInput): TaskItem {
    const db = getDatabase();
    const id = input.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const tagsJson = JSON.stringify(input.tags || []);
    const checklistJson = JSON.stringify(input.checklist || []);

    let startDate = input.start_date || new Date().toISOString().split('T')[0];
    let endDate = input.end_date || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

    // Normalize if inverted
    if (startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
    }

    // Normalize assignee_id to user-id if possible
    let assigneeId = input.assignee_id || null;
    if (assigneeId && !assigneeId.startsWith('user-') && ['cam', 'liam', 'alex'].includes(assigneeId.toLowerCase())) {
      assigneeId = `user-${assigneeId.toLowerCase()}`;
    }

    db.prepare(`
      INSERT INTO tasks (
        id, title, description, assignee_id, status, priority, start_date, end_date,
        progress_pct, color, category, tags, checklist, doc_id, created_by, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.title,
      input.description || '',
      assigneeId,
      input.status || 'backlog',
      input.priority || 'medium',
      startDate,
      endDate,
      input.progress_pct ?? 0,
      input.color || '#10b981',
      input.category || 'Engineering',
      tagsJson,
      checklistJson,
      input.doc_id || null,
      input.created_by || null,
      input.created_at || now,
      input.updated_at || now
    );

    return taskRepository.getById(id)!;
  },

  update(id: string, updates: Partial<TaskItem>): TaskItem | null {
    const db = getDatabase();
    const existing = taskRepository.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.assignee_id !== undefined) {
      let aId = updates.assignee_id;
      if (aId && !aId.startsWith('user-') && ['cam', 'liam', 'alex'].includes(aId.toLowerCase())) {
        aId = `user-${aId.toLowerCase()}`;
      }
      fields.push('assignee_id = ?');
      values.push(aId);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?');
      values.push(updates.priority);
    }
    if (updates.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(updates.start_date);
    }
    if (updates.end_date !== undefined) {
      fields.push('end_date = ?');
      values.push(updates.end_date);
    }
    if (updates.progress_pct !== undefined) {
      fields.push('progress_pct = ?');
      values.push(updates.progress_pct);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.checklist !== undefined) {
      fields.push('checklist = ?');
      values.push(JSON.stringify(updates.checklist));
    }
    if (updates.doc_id !== undefined) {
      fields.push('doc_id = ?');
      values.push(updates.doc_id);
    }

    if (fields.length === 0) return existing;

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return taskRepository.getById(id);
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return result.changes > 0;
  },

  moveTask(
    id: string,
    statusOrPayload: TaskStatus | { status?: TaskStatus; start_date?: string; end_date?: string },
    startDate?: string,
    endDate?: string
  ): TaskItem | null {
    if (typeof statusOrPayload === 'object') {
      const updates: Partial<TaskItem> = {};
      if (statusOrPayload.status) updates.status = statusOrPayload.status;
      if (statusOrPayload.start_date) updates.start_date = statusOrPayload.start_date;
      if (statusOrPayload.end_date) updates.end_date = statusOrPayload.end_date;
      if (statusOrPayload.status === 'done') updates.progress_pct = 100;
      return taskRepository.update(id, updates);
    } else {
      const updates: Partial<TaskItem> = { status: statusOrPayload };
      if (startDate) updates.start_date = startDate;
      if (endDate) updates.end_date = endDate;
      if (statusOrPayload === 'done') updates.progress_pct = 100;
      return taskRepository.update(id, updates);
    }
  },

  updateChecklist(taskId: string, checklist: ChecklistItem[]): TaskItem | null {
    const total = checklist.length;
    const completed = checklist.filter((item) => item.completed).length;
    const progress_pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const status: TaskStatus = progress_pct === 100 ? 'done' : progress_pct > 0 ? 'in_progress' : 'backlog';

    return taskRepository.update(taskId, {
      checklist,
      progress_pct,
      status,
    });
  },

  toggleChecklistItem(taskId: string, checklistItemId: string, completed: boolean): TaskItem | null {
    const task = taskRepository.getById(taskId);
    if (!task) return null;

    const updatedChecklist = task.checklist.map((item) =>
      item.id === checklistItemId ? { ...item, completed } : item
    );

    return taskRepository.updateChecklist(taskId, updatedChecklist);
  },
};

export default taskRepository;
