import { Router, Request, Response, NextFunction } from 'express';
import { userRepository } from '../db/repositories/userRepository.js';
import { taskRepository } from '../db/repositories/taskRepository.js';
import { docRepository } from '../db/repositories/docRepository.js';
import { activityRepository } from '../db/repositories/activityRepository.js';
import { settingsRepository } from '../db/repositories/settingsRepository.js';
import { creditService } from '../services/creditService.js';
import { config } from '../config.js';

export const syncRouter = Router();

// GET /api/sync/state
syncRouter.get('/state', (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = userRepository.getAll();
    const tasks = taskRepository.getAll();
    const docs = docRepository.getAll();
    const activities = activityRepository.getRecent(50);
    const credits = creditService.getBalance();
    const hasApiKey = settingsRepository.hasApiKey() || Boolean(config.geminiApiKey);
    const model = settingsRepository.getSetting('ai_model') || config.defaultModel;

    res.json({
      users,
      tasks,
      docs,
      activities,
      credits,
      team_credits: credits,
      creditBalance: credits,
      hasApiKey,
      model,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default syncRouter;
