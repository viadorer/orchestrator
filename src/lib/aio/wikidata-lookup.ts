/**
 * Wikidata Lookup
 *
 * Hledá existující entity na Wikidata pro sameAs linking v JSON-LD.
 * Používá Wikidata REST API (wbsearchentities + wbgetentities).
 *
 * Klíčové pro AI visibility — Wikidata jsou zdrojem pravdy pro LLM modely.
 */

// ============================================
// Types
// ============================================

export interface WikidataEntity {
  id: string;
  label: string;
  description: string;
  url: string;
  aliases: string[];
  claims: WikidataClaim[];
}

export interface WikidataClaim {
  property: string;
  propertyLabel: string;
  value: string;
}

export interface WikidataSearchResult {
  id: string;
  label: string;
  description: string;
  url: string;
  match: {
    type: string;
    language: string;
    text: string;
  };
}

interface WbSearchResponse {
  search: Array<{
    id: string;
    label: string;
    description: string;
    url: string;
    match: { type: string; language: string; text: string };
    aliases?: string[];
  }>;
}

interface WbEntityResponse {
  entities: Record<string, {
    id: string;
    labels: Record<string, { value: string }>;
    descriptions: Record<string, { value: string }>;
    aliases: Record<string, Array<{ value: string }>>;
    claims: Record<string, Array<{
      mainsnak: {
        datatype: string;
        datavalue?: {
          type: string;
          value: unknown;
        };
      };
    }>>;
  }>;
}

// ============================================
// Property labels for common properties
// ============================================

const PROPERTY_LABELS: Record<string, string> = {
  P31: 'instance of',
  P279: 'subclass of',
  P856: 'official website',
  P17: 'country',
  P131: 'located in',
  P154: 'logo image',
  P159: 'headquarters location',
  P170: 'creator',
  P178: 'developer',
  P277: 'programming language',
  P306: 'operating system',
  P348: 'software version',
  P571: 'inception',
  P749: 'parent organization',
  P1324: 'source code repository',
  P1566: 'GeoNames ID',
  P1082: 'population',
  P625: 'coordinate location',
  P18: 'image',
};

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

// ============================================
// Search
// ============================================

/**
 * Hledá entity na Wikidata podle textu.
 * Vrací max 10 výsledků.
 */
export async function searchWikidata(
  query: string,
  language: string = 'cs',
  limit: number = 10,
): Promise<WikidataSearchResult[]> {
  const params = new URLSearchParams({
    action: 'wbsearchentities',
    search: query,
    language,
    format: 'json',
    limit: String(limit),
    uselang: language,
  });

  const res = await fetch(`${WIKIDATA_API}?${params.toString()}`);
  if (!res.ok) return [];

  const data = (await res.json()) as WbSearchResponse;

  return data.search.map(item => ({
    id: item.id,
    label: item.label,
    description: item.description || '',
    url: `https://www.wikidata.org/wiki/${item.id}`,
    match: item.match,
  }));
}

// ============================================
// Entity Detail
// ============================================

/**
 * Načte detail entity z Wikidata podle Q-ID.
 * Vrací label, description, aliases a vybrané claims.
 */
export async function getWikidataEntity(
  entityId: string,
  language: string = 'cs',
): Promise<WikidataEntity | null> {
  const params = new URLSearchParams({
    action: 'wbgetentities',
    ids: entityId,
    format: 'json',
    languages: `${language}|en`,
    props: 'labels|descriptions|aliases|claims',
  });

  const res = await fetch(`${WIKIDATA_API}?${params.toString()}`);
  if (!res.ok) return null;

  const data = (await res.json()) as WbEntityResponse;
  const entity = data.entities[entityId];
  if (!entity) return null;

  const label = entity.labels[language]?.value || entity.labels['en']?.value || entityId;
  const description = entity.descriptions[language]?.value || entity.descriptions['en']?.value || '';
  const aliases = (entity.aliases[language] || entity.aliases['en'] || []).map(a => a.value);

  const claims: WikidataClaim[] = [];
  for (const [propId, claimList] of Object.entries(entity.claims)) {
    for (const claim of claimList) {
      const value = extractClaimValue(claim.mainsnak.datavalue);
      if (value) {
        claims.push({
          property: propId,
          propertyLabel: PROPERTY_LABELS[propId] || propId,
          value,
        });
      }
    }
  }

  return {
    id: entityId,
    label,
    description,
    url: `https://www.wikidata.org/wiki/${entityId}`,
    aliases,
    claims,
  };
}

function extractClaimValue(datavalue?: { type: string; value: unknown }): string | null {
  if (!datavalue) return null;

  switch (datavalue.type) {
    case 'string':
      return datavalue.value as string;
    case 'wikibase-entityid': {
      const v = datavalue.value as { id: string };
      return v.id;
    }
    case 'quantity': {
      const v = datavalue.value as { amount: string; unit: string };
      return v.amount.replace('+', '');
    }
    case 'time': {
      const v = datavalue.value as { time: string };
      return v.time.replace('+', '').substring(0, 10);
    }
    case 'monolingualtext': {
      const v = datavalue.value as { text: string };
      return v.text;
    }
    default:
      return null;
  }
}

// ============================================
// Smart Lookup — hledá relevantní entity pro sameAs
// ============================================

/**
 * Inteligentní lookup pro entity profile.
 * Hledá přesnou shodu i related entity (obor, lokalita).
 * Vrací doporučené sameAs URL.
 */
export async function lookupSameAsEntities(
  entityName: string,
  category?: string,
  keywords?: string[],
): Promise<{
  exactMatch: WikidataSearchResult | null;
  relatedEntities: WikidataSearchResult[];
  suggestedSameAs: string[];
}> {
  // 1. Hledej přesnou shodu
  const exactResults = await searchWikidata(entityName, 'cs', 5);
  const exactMatch = exactResults.length > 0 ? exactResults[0] : null;

  // 2. Hledej related entity podle kategorie
  const relatedEntities: WikidataSearchResult[] = [];
  const suggestedSameAs: string[] = [];

  if (exactMatch) {
    suggestedSameAs.push(exactMatch.url);
  }

  // Hledej oborové entity
  const categorySearches: string[] = [];
  if (category) categorySearches.push(category);
  if (keywords && keywords.length > 0) {
    categorySearches.push(...keywords.slice(0, 3));
  }

  for (const term of categorySearches) {
    const results = await searchWikidata(term, 'cs', 3);
    for (const r of results) {
      if (!relatedEntities.some(e => e.id === r.id) && r.id !== exactMatch?.id) {
        relatedEntities.push(r);
      }
    }
  }

  return { exactMatch, relatedEntities, suggestedSameAs };
}
