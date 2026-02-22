import { searchWikidata, getWikidataEntity, lookupSameAsEntities } from '@/lib/aio/wikidata-lookup';
import { NextResponse } from 'next/server';

/**
 * GET /api/agent/aio/wikidata?action=search&q=odhad.online
 * GET /api/agent/aio/wikidata?action=entity&id=Q40424
 * GET /api/agent/aio/wikidata?action=lookup&name=odhad.online&category=software&keywords=nemovitosti,odhad
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'search';

  try {
    switch (action) {
      case 'search': {
        const q = searchParams.get('q');
        if (!q) return NextResponse.json({ error: 'q parameter required' }, { status: 400 });
        const lang = searchParams.get('lang') || 'cs';
        const results = await searchWikidata(q, lang);
        return NextResponse.json({ results });
      }

      case 'entity': {
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id parameter required' }, { status: 400 });
        const lang = searchParams.get('lang') || 'cs';
        const entity = await getWikidataEntity(id, lang);
        if (!entity) return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
        return NextResponse.json(entity);
      }

      case 'lookup': {
        const name = searchParams.get('name');
        if (!name) return NextResponse.json({ error: 'name parameter required' }, { status: 400 });
        const category = searchParams.get('category') || undefined;
        const keywordsRaw = searchParams.get('keywords') || '';
        const keywords = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()) : undefined;
        const result = await lookupSameAsEntities(name, category, keywords);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Wikidata lookup failed' },
      { status: 500 },
    );
  }
}
