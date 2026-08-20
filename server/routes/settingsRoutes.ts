import { Router, Request, Response, NextFunction } from 'express';
import { settingsRepository } from '../db/repositories/settingsRepository.js';
import { creditService } from '../services/creditService.js';
import { config } from '../config.js';

export const settingsRouter = Router();

// GET /api/settings
settingsRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const hasApiKey = settingsRepository.hasApiKey() || Boolean(config.geminiApiKey);
    const credits = creditService.getBalance();
    const model = settingsRepository.getSetting('ai_model') || config.defaultModel;

    res.json({
      hasApiKey,
      credits,
      team_credits: credits,
      creditBalance: credits,
      model,
      ai_model: model,
    });
  } catch (err) {
    next(err);
  }
});

// Handler for updating API key
const handleApiKeyUpdate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apiKey } = req.body;
    if (typeof apiKey !== 'string') {
      res.status(400).json({ error: 'ValidationError', message: 'apiKey string is required.' });
      return;
    }

    settingsRepository.setApiKey(apiKey);

    res.json({
      success: true,
      hasApiKey: Boolean(apiKey.trim()),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/settings/apikey and POST /api/settings/api-key
settingsRouter.post('/apikey', handleApiKeyUpdate);
settingsRouter.post('/api-key', handleApiKeyUpdate);

// POST /api/settings/credits/topup
settingsRouter.post('/credits/topup', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, userId } = req.body;

    if (amount === undefined || amount === null || typeof amount === 'object') {
      res.status(400).json({ error: 'ValidationError', message: 'Top-up amount is required.' });
      return;
    }

    if (typeof amount === 'string' && (isNaN(Number(amount)) || amount.trim() === '')) {
      res.status(400).json({ error: 'ValidationError', message: 'Top-up amount must be a valid number.' });
      return;
    }

    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: 'ValidationError', message: 'Top-up amount must be a positive number greater than 0.' });
      return;
    }

    const newBalance = creditService.topUpCredits(numAmount, userId || 'user-cam');

    res.json({
      creditBalance: newBalance,
      credits: newBalance,
      team_credits: newBalance,
      added: numAmount,
    });
  } catch (err: any) {
    res.status(400).json({ error: 'ValidationError', message: err.message });
  }
});

export default settingsRouter;
