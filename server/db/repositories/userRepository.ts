import { getDatabase } from '../database.js';

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  role_title: string;
  avatarColor: string;
  color_theme: 'emerald' | 'indigo' | 'amber' | 'purple' | 'blue' | string;
  avatarUrl: string;
  avatar_url: string;
  status: 'Online' | 'Focused' | 'Away';
  statusMessage: string;
  status_message: string;
  streakDays: number;
  learning_streak_days: number;
  created_at: string;
  updated_at: string;
}

interface UserDbRow {
  id: string;
  name: string;
  role_title: string;
  avatar_url: string;
  color_theme: string;
  status: 'Online' | 'Focused' | 'Away';
  status_message: string;
  learning_streak_days: number;
  created_at: string;
  updated_at: string;
}

function mapUserRow(row: UserDbRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    role: row.role_title,
    role_title: row.role_title,
    avatarColor: row.color_theme,
    color_theme: row.color_theme,
    avatarUrl: row.avatar_url,
    avatar_url: row.avatar_url,
    status: row.status,
    statusMessage: row.status_message || '',
    status_message: row.status_message || '',
    streakDays: row.learning_streak_days,
    learning_streak_days: row.learning_streak_days,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const userRepository = {
  getAll(): UserProfile[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM users ORDER BY name ASC').all() as UserDbRow[];
    return rows.map(mapUserRow);
  },

  getById(idOrName: string): UserProfile | null {
    const db = getDatabase();
    const clean = idOrName.trim();
    const altId = clean.startsWith('user-') ? clean.replace('user-', '') : `user-${clean}`;

    const row = db.prepare(`
      SELECT * FROM users 
      WHERE id = ? OR id = ? OR LOWER(name) = LOWER(?) OR LOWER(id) = LOWER(?)
    `).get(clean, altId, clean, clean) as UserDbRow | undefined;

    return row ? mapUserRow(row) : null;
  },

  updateStatus(idOrName: string, status: 'Online' | 'Focused' | 'Away', statusMessage?: string): UserProfile | null {
    const existing = userRepository.getById(idOrName);
    if (!existing) return null;

    const db = getDatabase();
    const now = new Date().toISOString();

    if (statusMessage !== undefined) {
      db.prepare(`
        UPDATE users 
        SET status = ?, status_message = ?, updated_at = ? 
        WHERE id = ?
      `).run(status, statusMessage, now, existing.id);
    } else {
      db.prepare(`
        UPDATE users 
        SET status = ?, updated_at = ? 
        WHERE id = ?
      `).run(status, now, existing.id);
    }

    return userRepository.getById(existing.id);
  },

  updateStreak(idOrName: string, streakDays: number): UserProfile | null {
    const existing = userRepository.getById(idOrName);
    if (!existing) return null;

    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE users 
      SET learning_streak_days = ?, updated_at = ? 
      WHERE id = ?
    `).run(streakDays, now, existing.id);

    return userRepository.getById(existing.id);
  },

  create(user: {
    id?: string;
    name: string;
    role_title: string;
    avatar_url?: string;
    color_theme?: string;
    status?: 'Online' | 'Focused' | 'Away';
    status_message?: string;
    learning_streak_days?: number;
  }): UserProfile {
    const db = getDatabase();
    const id = user.id || `user-${user.name.toLowerCase()}`;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, name, role_title, avatar_url, color_theme, status, status_message, learning_streak_days, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      user.name,
      user.role_title,
      user.avatar_url || '',
      user.color_theme || 'emerald',
      user.status || 'Online',
      user.status_message || '',
      user.learning_streak_days || 0,
      now,
      now
    );

    return userRepository.getById(id)!;
  },
};

export default userRepository;
