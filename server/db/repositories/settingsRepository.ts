import { getDatabase } from '../database.js';

interface SettingDbRow {
  key: string;
  value: string;
  updated_at: string;
}

export const settingsRepository = {
  getSetting<T = any>(key: string, defaultValue?: T): T | null {
    const db = getDatabase();
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as SettingDbRow | undefined;
    if (!row) return defaultValue !== undefined ? defaultValue : null;

    try {
      return JSON.parse(row.value) as T;
    } catch {
      return (row.value as unknown) as T;
    }
  },

  setSetting<T = any>(key: string, value: T): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    const serialized = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value);

    db.prepare(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, serialized, now);
  },

  getAllSettings(): Record<string, any> {
    const db = getDatabase();
    const rows = db.prepare('SELECT key, value FROM app_settings').all() as SettingDbRow[];
    const result: Record<string, any> = {};

    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    }

    return result;
  },

  getCredits(): number {
    const credits = settingsRepository.getSetting<number>('team_credits', 100);
    return typeof credits === 'number' ? credits : 100;
  },

  setCredits(amount: number): number {
    return settingsRepository.updateCredits(amount, false);
  },

  updateCredits(value: number, isDelta?: boolean): number {
    const db = getDatabase();
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      const current = settingsRepository.getCredits();

      let next: number;
      if (isDelta === true || (isDelta === undefined && value < 0)) {
        next = current + value;
      } else {
        next = value;
      }

      if (next < 0) {
        throw new Error(`Insufficient credits: current balance is ${current}, attempted deduction is ${Math.abs(value)}`);
      }

      db.prepare(`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('team_credits', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(JSON.stringify(next), now);

      return next;
    });

    return tx();
  },

  setApiKey(apiKey: string): void {
    settingsRepository.setSetting<string>('gemini_api_key', apiKey.trim());
  },

  getApiKey(): string {
    const dbKey = settingsRepository.getSetting<string>('gemini_api_key', '') || '';
    if (dbKey && dbKey.trim().length > 0) return dbKey.trim();
    return process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
  },

  hasApiKey(): boolean {
    const key = settingsRepository.getApiKey();
    return typeof key === 'string' && key.trim().length > 0;
  },
};

export default settingsRepository;
