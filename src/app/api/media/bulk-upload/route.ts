import { uploadMediaFile } from '@/lib/media/upload-media';
import { NextResponse } from 'next/server';

export const maxDuration = 120; // seconds — bulk uploads take time
export const dynamic = 'force-dynamic';

const MAX_FILES = 50;

/**
 * Bulk Media Upload API
 * POST /api/media/bulk-upload
 *
 * Optimized for external tools (mobile, CLI, Zapier).
 * Accepts multipart/form-data with:
 * - files: File[] (up to 50 images)
 * - project_id: string (required)
 * - tags: string (comma-separated, optional)
 * - description: string (optional)
 * - shared: "true"/"false" (optional, default false)
 * - auto_analyze: "true"/"false" (optional, default true)
 *
 * Returns immediately with asset IDs and public URLs.
 * AI analysis (Gemini Vision + embedding) runs async in background.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const projectId = formData.get('project_id') as string;

  if (!projectId) {
    return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
  }

  const files = formData.getAll('files').filter((v): v is File => v instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Max ${MAX_FILES} files per request` }, { status: 400 });
  }

  const manualTags = (formData.get('tags') as string || '').split(',').map(t => t.trim()).filter(Boolean);
  const description = formData.get('description') as string || null;
  const isShared = formData.get('shared') === 'true';
  const autoAnalyze = formData.get('auto_analyze') !== 'false';

  const results = await Promise.all(
    files.map(file =>
      uploadMediaFile(file, {
        projectId,
        manualTags,
        description,
        isShared,
        autoAnalyze,
      })
    )
  );

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return NextResponse.json({
    uploaded: succeeded,
    failed,
    total: files.length,
    results,
  });
}
