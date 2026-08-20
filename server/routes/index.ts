import { Router } from 'express';
import { syncRouter } from './syncRoutes.js';
import { userRouter } from './userRoutes.js';
import { taskRouter } from './taskRoutes.js';
import { docRouter } from './docRoutes.js';
import { activityRouter } from './activityRoutes.js';
import { settingsRouter } from './settingsRoutes.js';
import { aiRouter } from './aiRoutes.js';
import { searchRouter } from './searchRoutes.js';

export const apiRouter = Router();

apiRouter.use('/sync', syncRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/tasks', taskRouter);
apiRouter.use('/docs', docRouter);
apiRouter.use('/activities', activityRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/search', searchRouter);

export function createApiRouter() {
  return apiRouter;
}

export default apiRouter;
