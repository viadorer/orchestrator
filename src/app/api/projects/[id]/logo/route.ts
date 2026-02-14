import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * Logo Upload API
 * POST /api/projects/[id]/logo
 * 
 * Accepts multipart/form-data with:
 * - file: File (PNG, JPG, SVG, WebP)
 * 
 * Uploads to Supabase Storage bucket 'media-assets'
 * Path: {project_id}/logo/{filename}
 * Updates visual_identity.logo_url in projects table
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { id: projectId } = await params;
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: PNG, JPG, SVG, WebP, GIF' }, { status: 400 });
  }

  // Max 2MB
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Max 2MB.' }, { status: 400 });
  }

  try {
    const arrayBuf = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuf);
    const ext = file.name.split('.').pop() || 'png';
    const storagePath = `${projectId}/logo/logo.${ext}`;

    // Delete old logo if exists
    await supabase.storage.from('media-assets').remove([storagePath]);

    // Upload new logo
    const { error: uploadError } = await supabase.storage
      .from('media-assets')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media-assets')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Update project visual_identity.logo_url
    const { data: project } = await supabase
      .from('projects')
      .select('visual_identity')
      .eq('id', projectId)
      .single();

    const vi = (project?.visual_identity as Record<string, unknown>) || {};
    vi.logo_url = publicUrl;

    const { error: updateError } = await supabase
      .from('projects')
      .update({ visual_identity: vi })
      .eq('id', projectId);

    if (updateError) {
      return NextResponse.json({ error: `DB update failed: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      logo_url: publicUrl,
      storage_path: storagePath,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]/logo
 * Remove logo from storage and clear logo_url
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { id: projectId } = await params;

  // Get current logo path
  const { data: project } = await supabase
    .from('projects')
    .select('visual_identity')
    .eq('id', projectId)
    .single();

  const vi = (project?.visual_identity as Record<string, unknown>) || {};

  // Try to remove from storage
  const logoUrl = vi.logo_url as string;
  if (logoUrl) {
    // Extract storage path from URL
    const match = logoUrl.match(/media-assets\/(.+)$/);
    if (match) {
      await supabase.storage.from('media-assets').remove([match[1]]);
    }
  }

  // Clear logo_url
  vi.logo_url = null;
  await supabase
    .from('projects')
    .update({ visual_identity: vi })
    .eq('id', projectId);

  return NextResponse.json({ success: true });
}
