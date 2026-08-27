import { format, addDays } from 'date-fns';
import { settingsRepository } from '../db/repositories/settingsRepository.js';
import { docRepository } from '../db/repositories/docRepository.js';
import { taskRepository } from '../db/repositories/taskRepository.js';
import { activityRepository } from '../db/repositories/activityRepository.js';
import { getDatabase } from '../db/database.js';
import { creditService } from './creditService.js';
import { heuristicAIEngine } from './heuristicAIEngine.js';
import { GUIDE_SYSTEM_PROMPT, ROADMAP_SYSTEM_PROMPT } from './promptTemplates.js';
import { broadcastHelpers } from '../sockets/socketHandler.js';

export interface GenerateGuideParams {
  topic: string;
  taskId?: string;
  context?: string;
  userId?: string;
}

export interface GenerateRoadmapParams {
  projectGoal: string;
  targetDays?: number;
  userId?: string;
}

export class AIService {
  public getApiKey(): string | null {
    const dbKey = settingsRepository.getSetting<string>('gemini_api_key');
    if (dbKey && typeof dbKey === 'string' && dbKey.trim().length > 0) {
      return dbKey.trim();
    }
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey && envKey.trim().length > 0) {
      return envKey.trim();
    }
    return null;
  }

  public getModel(): string {
    const dbModel = settingsRepository.getSetting<string>('gemini_model');
    if (dbModel && typeof dbModel === 'string' && dbModel.trim().length > 0) {
      return dbModel.trim();
    }
    return 'gemini-1.5-flash';
  }

  public async testConnection(customKey?: string, modelOverride?: string) {
    const apiKey = customKey?.trim() || this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        error: 'NO_API_KEY',
        message: 'No API key provided. Please enter a Google Gemini API key from Google AI Studio.',
      };
    }

    const model = modelOverride?.trim() || this.getModel();
    const startTime = Date.now();

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'Respond with exactly: {"status": "ok", "message": "connected"}' }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {}
        const errorMsg = errorData.error?.message || response.statusText;
        const errorCode = errorData.error?.status || `HTTP_${response.status}`;

        return {
          success: false,
          error: errorCode,
          message: errorMsg || `HTTP error ${response.status}`,
          model,
          latencyMs,
          status: response.status,
          help:
            response.status === 400 || errorCode === 'INVALID_ARGUMENT'
              ? 'API Key is invalid or expired. Please generate a fresh key at aistudio.google.com.'
              : response.status === 429
              ? 'Rate limit reached on free tier. Wait a minute or check your quota.'
              : 'Check that Gemini API is enabled in your Google AI Studio console.',
        };
      }

      const resData = await response.json();
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      return {
        success: true,
        model,
        latencyMs,
        message: `Connected successfully to Google Gemini (${model})! 100% Free-tier eligible.`,
        preview: rawText,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: err.message || 'Failed to reach Google Gemini API endpoint.',
        model,
        latencyMs,
        help: 'Ensure your server has internet access to https://generativelanguage.googleapis.com.',
      };
    }
  }

  private logPromptHistory(
    userId: string,
    type: string,
    prompt: string,
    response: string,
    credits: number,
    fallback: boolean
  ) {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        INSERT INTO ai_prompt_history (id, user_id, prompt_type, prompt_text, response_text, credits_used, used_fallback, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const id = `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      stmt.run(id, userId, type, prompt, response, credits, fallback ? 1 : 0, new Date().toISOString());
    } catch (err) {
      console.error('[AIService] Failed to log prompt history:', err);
    }
  }

  public async generateGuide(params: GenerateGuideParams) {
    const { topic, taskId, context } = params;
    const userId = params.userId || 'user-cam';
    const GUIDE_COST = 5;

    // 1. Check & Deduct Credits Atomically
    const creditResult = creditService.deductCredits(userId, GUIDE_COST, `AI Guide: ${topic}`);

    let generatedData: any = null;
    let usedFallback = false;
    const apiKey = this.getApiKey();
    const model = this.getModel();

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `${GUIDE_SYSTEM_PROMPT}\n\nGenerate guide for Topic: "${topic}". Task ID: "${
                        taskId || 'none'
                      }". Context: "${context || 'none'}"`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.4,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const resData = await response.json();
        const rawJsonText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          generatedData = JSON.parse(rawJsonText);
        } else {
          throw new Error('Empty response from Gemini');
        }
      } catch (err) {
        console.warn('[AIService] Gemini API call failed, activating heuristic fallback:', err);
        usedFallback = true;
      }
    } else {
      usedFallback = true;
    }

    if (!generatedData || usedFallback) {
      generatedData = heuristicAIEngine.generateGuide(topic, taskId, context, userId);
      usedFallback = true;
    }

    // 2. Persist Learning Doc
    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const doc = docRepository.create({
      id: docId,
      title: generatedData.title || topic,
      subtitle: generatedData.subtitle || `AI-Curated Technical Blueprint for ${topic}`,
      category: generatedData.category || 'Architecture',
      tags: generatedData.tags || ['AI-Curated', 'Architecture'],
      preview_image_url:
        generatedData.preview_image_url ||
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
      preview_link_url: generatedData.preview_link_url || 'https://developer.mozilla.org',
      ai_relevance_summary:
        generatedData.ai_relevance_summary || `Curated specifically for ${userId}'s active task execution.`,
      ai_relevance_score: generatedData.ai_relevance_score || 94,
      markdown_content: generatedData.markdown_content,
      steps: (generatedData.steps || []).map((s: any, idx: number) => ({
        stepNumber: s.stepNumber || idx + 1,
        title: s.title,
        description: s.description || '',
        completed: false,
      })),
      linked_task_id: taskId || null,
      author_id: userId,
      is_ai_generated: true,
      created_at: now,
      updated_at: now,
    });

    // 3. Link to Task if requested
    if (taskId) {
      taskRepository.update(taskId, { doc_id: doc.id });
    }

    // 4. Log Prompt History & Activity
    this.logPromptHistory(userId, 'GUIDE', `Topic: ${topic}`, JSON.stringify(generatedData), GUIDE_COST, usedFallback);
    const activity = activityRepository.logActivity({
      user_id: userId,
      action_type: 'doc_created',
      target_type: 'doc',
      target_id: doc.id,
      target_title: `Generated Guide: ${doc.title}`,
      details: { usedFallback, cost: GUIDE_COST, taskId },
    });

    // 5. Broadcast Socket.io event
    broadcastHelpers.broadcastDocCreated(null, doc, activity);

    return {
      doc,
      creditBalance: creditResult.creditBalance,
      credits: creditResult.creditBalance,
      team_credits: creditResult.creditBalance,
      usedFallback,
    };
  }

  public async generateRoadmap(params: GenerateRoadmapParams) {
    const { projectGoal, targetDays = 10 } = params;
    const userId = params.userId || 'user-cam';
    const ROADMAP_COST = 10;

    // 1. Check & Deduct Credits Atomically
    const creditResult = creditService.deductCredits(userId, ROADMAP_COST, `AI Roadmap: ${projectGoal}`);

    let generatedTasksData: any[] = [];
    let usedFallback = false;
    const apiKey = this.getApiKey();
    const model = this.getModel();

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `${ROADMAP_SYSTEM_PROMPT}\n\nDecompose Project Goal: "${projectGoal}". Target duration: ${targetDays} days.`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.3,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const resData = await response.json();
        const rawJsonText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          const parsed = JSON.parse(rawJsonText);
          generatedTasksData = parsed.tasks || [];
        } else {
          throw new Error('Empty response from Gemini');
        }
      } catch (err) {
        console.warn('[AIService] Gemini API call failed, activating heuristic roadmap generator:', err);
        usedFallback = true;
      }
    } else {
      usedFallback = true;
    }

    if (generatedTasksData.length === 0 || usedFallback) {
      generatedTasksData = heuristicAIEngine.generateRoadmap(projectGoal, targetDays);
      usedFallback = true;
    }

    // 2. Persist Tasks into Database
    const createdTasks = [];
    const baseDate = new Date();

    for (let i = 0; i < generatedTasksData.length; i++) {
      const t = generatedTasksData[i];
      const startOffset = t.start_offset_days !== undefined ? t.start_offset_days : i * 2;
      const duration = t.duration_days !== undefined ? t.duration_days : 3;

      const startDateStr = format(addDays(baseDate, startOffset), 'yyyy-MM-dd');
      const endDateStr = format(addDays(baseDate, startOffset + duration), 'yyyy-MM-dd');

      let assigneeId = t.assignee_id || (i % 3 === 0 ? 'user-cam' : i % 3 === 1 ? 'user-liam' : 'user-alex');
      if (assigneeId && !assigneeId.startsWith('user-') && ['cam', 'liam', 'alex'].includes(assigneeId.toLowerCase())) {
        assigneeId = `user-${assigneeId.toLowerCase()}`;
      }

      const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const task = taskRepository.create({
        id: taskId,
        title: t.title,
        description: t.description || `Generated as part of roadmap: ${projectGoal}`,
        assignee_id: assigneeId,
        status: t.status || (i === 0 ? 'in_progress' : 'backlog'),
        priority: t.priority || 'medium',
        start_date: startDateStr,
        end_date: endDateStr,
        progress_pct: 0,
        category: t.category || 'Engineering',
        tags: t.tags || ['AI-Roadmap', projectGoal.slice(0, 15)],
        checklist: (t.checklist || []).map((c: any, cIdx: number) => ({
          id: `chk-${Date.now()}-${cIdx}`,
          text: typeof c === 'string' ? c : c.text,
          completed: false,
        })),
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      createdTasks.push(task);

      const activity = activityRepository.logActivity({
        user_id: userId,
        action_type: 'task_created',
        target_type: 'task',
        target_id: task.id,
        target_title: `Roadmap Task: ${task.title}`,
        details: { projectGoal, usedFallback },
      });
      broadcastHelpers.broadcastTaskCreated(null, task, activity);
    }

    // 3. Log Prompt History
    this.logPromptHistory(
      userId,
      'ROADMAP',
      `Goal: ${projectGoal}`,
      JSON.stringify(createdTasks),
      ROADMAP_COST,
      usedFallback
    );

    return {
      tasks: createdTasks,
      creditBalance: creditResult.creditBalance,
      credits: creditResult.creditBalance,
      team_credits: creditResult.creditBalance,
      usedFallback,
    };
  }
}

export const aiService = new AIService();
export default aiService;
