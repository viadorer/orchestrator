import { supabase } from '@/lib/supabase/client';
import { resolveTemplateToStaticUrl } from '@/lib/visual/resolve-template';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/require-auth';

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { ids } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('content_queue')
    .update({ status: 'approved' })
    .in('id', ids)
    .select('id, project_id, template_url, card_url, target_platform, platforms, generation_context');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Pre-render templates to static PNGs (async, non-blocking for response)
  // This way publish won't have to render them at publish time (14s timeout risk)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'http://localhost:3000';

  const preRenderResults: Array<{ id: string; static_url?: string; error?: string }> = [];

  for (const post of (data || [])) {
    const templateBase = post.template_url || post.card_url || post.generation_context?.template_url_value;
    if (!templateBase || !templateBase.includes('/api/visual/template')) continue;

    try {
      const platform = post.target_platform || (post.platforms?.[0]) || 'facebook';
      let templateSrc = templateBase;
      try {
        const tUrl = new URL(templateSrc, baseUrl);
        tUrl.searchParams.set('platform', platform);
        tUrl.searchParams.delete('w');
        tUrl.searchParams.delete('h');
        templateSrc = tUrl.pathname + '?' + tUrl.searchParams.toString();
      } catch { /* keep original */ }

      const resolvedUrl = templateSrc.startsWith('http') ? templateSrc : `${baseUrl}${templateSrc}`;
      const staticUrl = await resolveTemplateToStaticUrl(resolvedUrl, post.id, post.project_id, platform, 25000);

      // Only save if we got a real static URL (not the original template URL back)
      if (staticUrl !== resolvedUrl && staticUrl !== templateSrc) {
        await supabase
          .from('content_queue')
          .update({ static_image_url: staticUrl })
          .eq('id', post.id);
        preRenderResults.push({ id: post.id, static_url: staticUrl });
      } else {
        preRenderResults.push({ id: post.id, error: 'Pre-render returned original URL' });
      }
    } catch (err) {
      console.error(`[bulk-approve] Pre-render failed for ${post.id}:`, err);
      preRenderResults.push({ id: post.id, error: err instanceof Error ? err.message : 'Unknown' });
    }
  }

  return NextResponse.json({
    approved: data?.length || 0,
    pre_rendered: preRenderResults.filter(r => r.static_url).length,
    pre_render_errors: preRenderResults.filter(r => r.error).length,
  });
}
