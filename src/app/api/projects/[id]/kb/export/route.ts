import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * GET /api/projects/[id]/kb/export?format=sql|csv|md
 * Export all Knowledge Base entries for a project
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'md';

  // Load project name
  const { data: project } = await supabase
    .from('projects')
    .select('name, slug')
    .eq('id', id)
    .single();

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Load all KB entries (including inactive)
  const { data: entries, error } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('project_id', id)
    .order('category')
    .order('title');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: 'No KB entries found' }, { status: 404 });
  }

  const filename = `${project.slug}_kb_${new Date().toISOString().slice(0, 10)}`;

  switch (format) {
    case 'sql': {
      const lines: string[] = [];
      lines.push(`-- Knowledge Base export: ${project.name}`);
      lines.push(`-- Exported: ${new Date().toISOString()}`);
      lines.push(`-- Project ID: ${id}`);
      lines.push(`-- Entries: ${entries.length}`);
      lines.push('');
      lines.push('-- To import into another project, replace the project_id value');
      lines.push(`-- DELETE FROM knowledge_base WHERE project_id = '${id}';`);
      lines.push('');

      for (const e of entries) {
        const title = (e.title as string).replace(/'/g, "''");
        const content = (e.content as string).replace(/'/g, "''");
        const source = e.source ? `'${(e.source as string).replace(/'/g, "''")}'` : 'NULL';
        lines.push(`INSERT INTO knowledge_base (project_id, category, title, content, source, is_active)`);
        lines.push(`VALUES ('${id}', '${e.category}', '${title}', '${content}', ${source}, ${e.is_active});`);
        lines.push('');
      }

      return new Response(lines.join('\n'), {
        headers: {
          'Content-Type': 'application/sql; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.sql"`,
        },
      });
    }

    case 'csv': {
      const lines: string[] = [];
      lines.push('category,title,content,source,is_active');

      for (const e of entries) {
        const title = `"${(e.title as string).replace(/"/g, '""')}"`;
        const content = `"${(e.content as string).replace(/"/g, '""')}"`;
        const source = e.source ? `"${(e.source as string).replace(/"/g, '""')}"` : '""';
        lines.push(`${e.category},${title},${content},${source},${e.is_active}`);
      }

      return new Response(lines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    case 'md':
    default: {
      const lines: string[] = [];
      lines.push(`# Knowledge Base: ${project.name}`);
      lines.push(`> Exportováno: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
      lines.push(`> Počet záznamů: ${entries.length}`);
      lines.push('');

      // Group by category
      const byCategory = new Map<string, typeof entries>();
      for (const e of entries) {
        const cat = e.category as string;
        if (!byCategory.has(cat)) byCategory.set(cat, []);
        byCategory.get(cat)!.push(e);
      }

      for (const [category, catEntries] of byCategory) {
        lines.push(`## ${category.toUpperCase()} (${catEntries.length})`);
        lines.push('');

        for (const e of catEntries) {
          const status = e.is_active ? '' : ' *(neaktivní)*';
          lines.push(`### ${e.title}${status}`);
          if (e.source) lines.push(`*Zdroj: ${e.source}*`);
          lines.push('');
          lines.push(e.content as string);
          lines.push('');
          lines.push('---');
          lines.push('');
        }
      }

      return new Response(lines.join('\n'), {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.md"`,
        },
      });
    }
  }
}
