import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  clientOrigin: string;
  dataDir: string;
  dbPath: string;
  geminiApiKey: string;
  defaultModel: string;
  starterCredits: number;
  creditCosts: {
    guide: number;
    roadmap: number;
  };
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 3001,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  dataDir: path.resolve(__dirname, '../../data'),
  dbPath: process.env.DATABASE_PATH || process.env.DB_PATH || path.resolve(__dirname, '../../data/atlas.sqlite'),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  defaultModel: process.env.AI_MODEL || 'gemini-1.5-flash',
  starterCredits: 100,
  creditCosts: {
    guide: 5,
    roadmap: 10,
  },
};

export default config;
