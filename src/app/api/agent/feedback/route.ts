import { saveFeedback } from '@/lib/ai/agent-orchestrator';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/require-auth';

/**
 * Feedback Loop – Admin upraví post, úprava se uloží jako learning pro Huga
 *
 * POST /api/agent/feedback
 * Body: { contentId, editedText, feedbackNote? }
 */
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const body = await request.json();
  const { contentId, editedText, feedbackNote } = body;

  if (!contentId || !editedText) {
    return NextResponse.json(
      { error: 'contentId and editedText are required' },
      { status: 400 }
    );
  }

  const success = await saveFeedback(contentId, editedText, feedbackNote);

  if (!success) {
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Feedback saved. Hugo will learn from this edit in future generations.',
  });
}
