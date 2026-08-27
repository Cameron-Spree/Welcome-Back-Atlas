import { Router, Request, Response, NextFunction } from 'express';
import { aiService } from '../services/aiService.js';
import { creditService, InsufficientCreditsError } from '../services/creditService.js';
import { config } from '../config.js';

export const aiRouter = Router();

// POST /api/ai/generate-guide (Cost: 5 credits)
aiRouter.post('/generate-guide', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, taskId, context, userId } = req.body;
    const activeUserId = userId || 'user-cam';
    const cost = config.creditCosts.guide; // 5

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      res.status(400).json({ error: 'ValidationError', message: 'topic string is required and cannot be empty.' });
      return;
    }

    if (!creditService.hasEnoughCredits(cost)) {
      res.status(402).json({
        error: 'InsufficientCredits',
        message: `Insufficient AI credits. Required: ${cost}, Available: ${creditService.getBalance()}. Please top up.`,
        required: cost,
        current: creditService.getBalance(),
      });
      return;
    }

    const result = await aiService.generateGuide({
      topic: topic.trim(),
      taskId,
      context,
      userId: activeUserId,
    });

    res.json(result);
  } catch (err: any) {
    if (err instanceof InsufficientCreditsError || err.statusCode === 402 || err.name === 'InsufficientCreditsError') {
      res.status(402).json({
        error: 'InsufficientCredits',
        message: err.message,
        current: creditService.getBalance(),
      });
      return;
    }
    next(err);
  }
});

// POST /api/ai/generate-roadmap (Cost: 10 credits)
aiRouter.post('/generate-roadmap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectGoal, targetDays, userId } = req.body;
    const activeUserId = userId || 'user-cam';
    const cost = config.creditCosts.roadmap; // 10

    if (!projectGoal || typeof projectGoal !== 'string' || projectGoal.trim().length === 0) {
      res.status(400).json({ error: 'ValidationError', message: 'projectGoal string is required and cannot be empty.' });
      return;
    }

    if (!creditService.hasEnoughCredits(cost)) {
      res.status(402).json({
        error: 'InsufficientCredits',
        message: `Insufficient AI credits. Required: ${cost}, Available: ${creditService.getBalance()}. Please top up.`,
        required: cost,
        current: creditService.getBalance(),
      });
      return;
    }

    const result = await aiService.generateRoadmap({
      projectGoal: projectGoal.trim(),
      targetDays: Number(targetDays) || 14,
      userId: activeUserId,
    });

    res.json(result);
  } catch (err: any) {
    if (err instanceof InsufficientCreditsError || err.statusCode === 402 || err.name === 'InsufficientCreditsError') {
      res.status(402).json({
        error: 'InsufficientCredits',
        message: err.message,
        current: creditService.getBalance(),
      });
      return;
    }
    next(err);
  }
});

// POST /api/ai/test-connection (Test probe Gemini API key and model)
aiRouter.post('/test-connection', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apiKey, model } = req.body;
    const result = await aiService.testConnection(apiKey, model);
    res.json(result);
  } catch (err: any) {
    next(err);
  }
});

export default aiRouter;
