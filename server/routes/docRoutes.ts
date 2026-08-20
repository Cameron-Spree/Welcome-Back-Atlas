import { Router, Request, Response, NextFunction } from 'express';
import { docRepository } from '../db/repositories/docRepository.js';
import { activityRepository } from '../db/repositories/activityRepository.js';
import { broadcastHelpers } from '../sockets/socketHandler.js';

export const docRouter = Router();

// GET /api/docs
docRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, tag, search } = req.query;
    let docs = docRepository.getAll(category as string, tag as string);
    if (search) {
      const q = (search as string).toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.markdown_content.toLowerCase().includes(q) ||
          d.ai_relevance_summary.toLowerCase().includes(q)
      );
    }
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// GET /api/docs/:id
docRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = docRepository.getById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'DocNotFound', message: `Doc ${req.params.id} not found.` });
      return;
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// POST /api/docs
docRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      id,
      title,
      subtitle,
      category,
      tags,
      preview_image_url,
      preview_link_url,
      ai_relevance_summary,
      ai_relevance_score,
      markdown_content,
      steps,
      linked_task_id,
      userId,
      is_ai_generated,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0 || !markdown_content) {
      res.status(400).json({ error: 'ValidationError', message: 'Title and markdown_content are required.' });
      return;
    }

    const createdDoc = docRepository.create({
      id,
      title: title.trim(),
      subtitle: subtitle || '',
      category: category || 'Architecture',
      tags: tags || [],
      preview_image_url: preview_image_url || '',
      preview_link_url: preview_link_url || '',
      ai_relevance_summary: ai_relevance_summary || 'Curated documentation matching task requirements.',
      ai_relevance_score: ai_relevance_score ?? 90,
      markdown_content,
      steps: steps || [],
      linked_task_id: linked_task_id || null,
      author_id: userId || 'user-cam',
      is_ai_generated: is_ai_generated ? true : false,
    });

    const activity = activityRepository.logActivity({
      user_id: userId || 'user-cam',
      action_type: 'doc_created',
      target_type: 'doc',
      target_id: createdDoc.id,
      target_title: createdDoc.title,
      details: { category: createdDoc.category },
    });

    const io = req.app.locals.io || null;
    broadcastHelpers.broadcastDocCreated(io, createdDoc, activity);

    res.status(201).json(createdDoc);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/docs/:id/step
docRouter.patch('/:id/step', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stepNumber, completed, userId } = req.body;

    if (typeof stepNumber !== 'number' || typeof completed !== 'boolean') {
      res.status(400).json({
        error: 'ValidationError',
        message: 'stepNumber (number) and completed (boolean) are required.',
      });
      return;
    }

    const updatedDoc = docRepository.toggleStep(req.params.id, stepNumber, completed);
    if (!updatedDoc) {
      res.status(404).json({ error: 'DocNotFound', message: `Doc ${req.params.id} not found.` });
      return;
    }

    const step = updatedDoc.steps.find((s) => s.stepNumber === stepNumber);
    const stepTitle = step ? step.title : `Step ${stepNumber}`;

    const activity = activityRepository.logActivity({
      user_id: userId || 'user-cam',
      action_type: 'doc_step_toggled',
      target_type: 'doc',
      target_id: updatedDoc.id,
      target_title: updatedDoc.title,
      details: { stepNumber, stepTitle, completed },
    });

    const io = req.app.locals.io || null;
    broadcastHelpers.broadcastDocStepToggled(io, updatedDoc.id, stepNumber, completed, updatedDoc, activity);

    res.json(updatedDoc);
  } catch (err) {
    next(err);
  }
});

export default docRouter;
