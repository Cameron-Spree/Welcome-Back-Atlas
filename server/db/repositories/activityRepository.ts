import { getDatabase } from '../database.js';

export interface ActivityLogItem {
  id: string;
  user_id: string;
  action_type: string;
  target_type: string;
  target_id?: string | null;
  target_title: string;
  details: Record<string, any>;
  timestamp: string;
}

interface ActivityDbRow {
  id: string;
  user_id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  target_title: string;
  details: string;
  timestamp: string;
}

export interface CreateActivityInput {
  id?: string;
  user_id: string;
  action_type: string;
  target_type: string;
  target_id?: string | null;
  target_title: string;
  details?: Record<string, any>;
  timestamp?: string;
}

function mapActivityRow(row: ActivityDbRow): ActivityLogItem {
  let parsedDetails: Record<string, any> = {};
  try {
    parsedDetails = JSON.parse(row.details || '{}');
  } catch {
    parsedDetails = {};
  }

  return {
    id: row.id,
    user_id: row.user_id,
    action_type: row.action_type,
    target_type: row.target_type,
    target_id: row.target_id,
    target_title: row.target_title,
    details: parsedDetails,
    timestamp: row.timestamp,
  };
}

export const activityRepository = {
  getRecent(limit = 20, userId?: string): ActivityLogItem[] {
    const db = getDatabase();
    let query = 'SELECT * FROM activity_logs';
    const params: any[] = [];

    if (userId) {
      const clean = userId.trim();
      const alt = clean.startsWith('user-') ? clean.replace('user-', '') : `user-${clean}`;
      query += ' WHERE (user_id = ? OR user_id = ?)';
      params.push(clean, alt);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const rows = db.prepare(query).all(...params) as ActivityDbRow[];
    return rows.map(mapActivityRow);
  },

  logActivity(input: CreateActivityInput): ActivityLogItem {
    const db = getDatabase();
    const id = input.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = input.timestamp || new Date().toISOString();
    const detailsJson = JSON.stringify(input.details || {});

    // Normalize user_id if needed
    let userId = input.user_id;
    if (userId && !userId.startsWith('user-') && ['cam', 'liam', 'alex'].includes(userId.toLowerCase())) {
      userId = `user-${userId.toLowerCase()}`;
    }

    db.prepare(`
      INSERT INTO activity_logs (id, user_id, action_type, target_type, target_id, target_title, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      input.action_type,
      input.target_type,
      input.target_id || null,
      input.target_title,
      detailsJson,
      timestamp
    );

    return {
      id,
      user_id: userId,
      action_type: input.action_type,
      target_type: input.target_type,
      target_id: input.target_id || null,
      target_title: input.target_title,
      details: input.details || {},
      timestamp,
    };
  },
};

export default activityRepository;
