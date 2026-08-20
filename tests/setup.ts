import { beforeAll, afterAll, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';

// Set test environment flags
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Ephemeral port for test runs
process.env.GEMINI_API_KEY = ''; // Default to heuristic fallback mode

// Global test directory for isolated SQLite databases
export const TEST_TMP_DIR = path.resolve(process.cwd(), '.tmp-tests');

beforeAll(() => {
  if (!fs.existsSync(TEST_TMP_DIR)) {
    fs.mkdirSync(TEST_TMP_DIR, { recursive: true });
  }
});

afterEach(() => {
  // Clean up any timers or mock residue if needed
});

afterAll(() => {
  // Clean up temp test database directory if empty or finished
  try {
    if (fs.existsSync(TEST_TMP_DIR)) {
      const files = fs.readdirSync(TEST_TMP_DIR);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(TEST_TMP_DIR, file));
        } catch {
          // Ignore busy locks
        }
      }
      try {
        fs.rmdirSync(TEST_TMP_DIR);
      } catch {
        // Ignore if still in use
      }
    }
  } catch {
    // Ignore cleanup errors on teardown
  }
});
