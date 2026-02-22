/**
 * AIO Data-Driven Report Generator
 *
 * Generuje faktické datové reporty optimalizované pro AI citace.
 * Výstup: strukturovaný text s čísly, který LLM může vzít a bez úprav použít jako odpověď.
 *
 * Používá se jako nový content type 'data_report' v content engine.
 * Reporty se injektují do statických HTML stránek přes GitHub API.
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { supabase } from '@/lib/supabase/client';

// ============================================
// Types
// ============================================

export interface DataReportInput {
  projectId: string;
  topic: string;
  dataPoints?: Array<{ label: string; value: string | number; unit?: string }>;
  locale?: string;
  period?: string;
}

export interface DataReport {
  title: string;
  content: string;
  factSection: string;
  schemaData: Record<string, unknown>;
}

// ============================================
// System Prompt
// ============================================

const DATA_REPORT_PROMPT = `Jsi datový analytik a specialista na AI citovatelnost. Tvým úkolem je vytvořit krátký faktický report na základě poskytnutých dat a kontextu.

Struktura reportu:

1. NADPIS: Faktický a konkrétní (např. "Ceny bytů Plzeň-Bory: Analýza Q1 2026").

2. KLÍČOVÁ DATA: První odstavec musí obsahovat nejdůležitější čísla (průměrná cena, trend v %).

3. KONTEXTUALIZACE: Porovnání s minulým obdobím nebo okolními oblastmi.

4. STRUČNÁ FAKTA PRO ASISTENTY: Na konec přidej sekci se strojově čitelnými odrážkami.

Stylistická pravidla:
- Žádná adjektiva jako "úžasný", "skvělý", "výhodný".
- Používej věty typu: "Data ukazují...", "Průměrná hodnota dosahuje...", "Meziroční změna činí...".
- Každá věta musí obsahovat konkrétní číslo nebo fakt.
- Cílem je, aby LLM model mohl tvou větu vzít a bez úprav ji použít jako odpověď na dotaz uživatele.
- Piš česky, formálně, ve třetí osobě.

Vrať POUZE validní JSON:
{
  "title": "Nadpis reportu",
  "content": "Celý text reportu (3-5 odstavců)",
  "fact_section": "Stručná fakta pro asistenty (odrážky oddělené \\n)"
}

Žádný markdown, žádný komentář, pouze JSON.`;

// ============================================
// Report Generation
// ============================================

export async function generateDataReport(
  input: DataReportInput,
): Promise<DataReport | null> {
  if (!supabase) return null;

  // Load KB entries for context
  const { data: kbEntries } = await supabase
    .from('knowledge_base')
    .select('category, title, content')
    .eq('project_id', input.projectId)
    .eq('is_active', true);

  // Load entity profile
  const { data: entity } = await supabase
    .from('aio_entity_profiles')
    .select('official_name, short_description, keywords')
    .eq('project_id', input.projectId)
    .single();

  const entityName = (entity?.official_name as string) || 'Neznámý projekt';
  const kbContext = kbEntries
    ? kbEntries.map((e) => `${e.title}: ${e.content}`).join('\n')
    : '';

  const dataPointsText = input.dataPoints
    ? input.dataPoints
        .map((d) => `- ${d.label}: ${d.value}${d.unit ? ` ${d.unit}` : ''}`)
        .join('\n')
    : 'Žádná specifická data nebyla poskytnuta. Vygeneruj report na základě kontextu.';

  const prompt = `${DATA_REPORT_PROMPT}

Entita: ${entityName}
Téma: ${input.topic}
Období: ${input.period || 'aktuální'}
Lokalita: ${input.locale || 'Česká republika'}

Datové body:
${dataPointsText}

Kontext z knowledge base:
${kbContext.substring(0, 4000)}`;

  const { text: rawResponse } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt,
    temperature: 0.3,
  });

  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  const title = (parsed.title as string) || input.topic;
  const content = (parsed.content as string) || '';
  const factSection = (parsed.fact_section as string) || '';

  // Build Dataset schema for this report
  const schemaData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: title,
    description: content.substring(0, 200),
    creator: {
      '@type': 'Organization',
      name: entityName,
    },
    datePublished: new Date().toISOString().split('T')[0],
  };

  if (input.locale) {
    schemaData.spatialCoverage = {
      '@type': 'Place',
      name: input.locale,
    };
  }

  if (input.period) {
    schemaData.temporalCoverage = input.period;
  }

  if (input.dataPoints && input.dataPoints.length > 0) {
    schemaData.variableMeasured = input.dataPoints.map((d) => ({
      '@type': 'PropertyValue',
      name: d.label,
      value: d.value,
      ...(d.unit ? { unitCode: d.unit } : {}),
    }));
  }

  return {
    title,
    content,
    factSection,
    schemaData,
  };
}

// ============================================
// Build HTML page with report + schema
// ============================================

export function buildReportHtml(
  report: DataReport,
  entityName: string,
  websiteUrl?: string,
): string {
  const schemaTag = `<script type="application/ld+json">\n${JSON.stringify(report.schemaData, null, 2)}\n</script>`;

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title} | ${entityName}</title>
  <meta name="description" content="${report.content.substring(0, 160)}">
  ${schemaTag}
</head>
<body>
  <article>
    <h1>${report.title}</h1>
    ${report.content.split('\n\n').map((p) => `<p>${p}</p>`).join('\n    ')}
    <section>
      <h2>Stručná fakta</h2>
      <ul>
        ${report.factSection.split('\n').filter(Boolean).map((f) => `<li>${f.replace(/^[-•]\s*/, '')}</li>`).join('\n        ')}
      </ul>
    </section>
  </article>
  <footer>
    <p>Zdroj: <a href="${websiteUrl || '#'}">${entityName}</a></p>
    <p>Aktualizováno: ${new Date().toISOString().split('T')[0]}</p>
  </footer>
</body>
</html>`;
}
