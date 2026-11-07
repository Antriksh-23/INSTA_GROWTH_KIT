/**
 * commentClassifier — Classifies comment intent using Gemini API
 * with a Hinglish keyword fallback.
 */

import type { ClassifiedComment, Comment, Env } from './types';

export async function classifyComment(
  comment: Comment,
  env: Env,
): Promise<ClassifiedComment> {
  // TODO: Implement in Phase 3C
  return {
    ...comment,
    intent: 'question',
    confidence: 0,
  };
}
