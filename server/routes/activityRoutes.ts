import { Router, Request, Response, NextFunction } from 'express';
import { activityRepository } from '../db/repositories/activityRepository.js';

export const activityRouter = Router();

// GET /api/activities
activityRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const userId = (req.query.userId || req.query.user_id) as string | undefined;
    const activities = activityRepository.getRecent(limit, userId);
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

export default activityRouter;
