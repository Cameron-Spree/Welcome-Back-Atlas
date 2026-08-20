import { Router, Request, Response, NextFunction } from 'express';
import { taskRepository } from '../db/repositories/taskRepository.js';
import { docRepository } from '../db/repositories/docRepository.js';
import { userRepository } from '../db/repositories/userRepository.js';
import { activityRepository } from '../db/repositories/activityRepository.js';

export const searchRouter = Router();

// GET /api/search?q=...
searchRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawQuery = (req.query.q || req.query.query || '') as string;
    const query = typeof rawQuery === 'string' ? rawQuery.trim().slice(0, 500) : '';

    if (!query) {
      res.json({
        tasks: [],
        docs: [],
        users: [],
        activities: [],
      });
      return;
    }

    const tasks = taskRepository.getAll({ search: query });
    const docs = docRepository.getAll(undefined, undefined).filter(
      (d) =>
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.markdown_content.toLowerCase().includes(query.toLowerCase()) ||
        d.ai_relevance_summary.toLowerCase().includes(query.toLowerCase())
    );
    const users = userRepository.getAll().filter(
      (u) =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.role_title.toLowerCase().includes(query.toLowerCase())
    );
    const activities = activityRepository.getRecent(20).filter(
      (a) =>
        a.target_title.toLowerCase().includes(query.toLowerCase()) ||
        a.action_type.toLowerCase().includes(query.toLowerCase())
    );

    res.json({
      tasks,
      docs,
      users,
      activities,
    });
  } catch (err) {
    next(err);
  }
});

export default searchRouter;
