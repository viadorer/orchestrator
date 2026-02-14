import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * GET /api/projects/[id]/prompts/export?format=sql|csv|md
 * Export all prompt templates for a project
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

  // Load all prompts (including inactive)
  const { data: prompts, error } = await supabase
    .from('project_prompt_templates')
    .select('*')
    .eq('project_id', id)
    .order('category')
    .order('sort_order');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!prompts || prompts.length === 0) {
    return NextResponse.json({ error: 'No prompts found' }, { status: 404 });
  }

  const filename = `${project.slug}_prompts_${new Date().toISOString().slice(0, 10)}`;

  switch (format) {
    case 'sql': {
      const lines: string[] = [];
      lines.push(`-- Prompt templates export: ${project.name}`);
      lines.push(`-- Exported: ${new Date().toISOString()}`);
      lines.push(`-- Project ID: ${id}`);
      lines.push('');
      lines.push('-- To import into another project, replace the project_id value');
      lines.push(`-- DELETE FROM project_prompt_templates WHERE project_id = '${id}';`);
      lines.push('');

      for (const p of prompts) {
        const content = p.content.replace(/'/g, "''");
        const desc = p.description ? `'${(p.description as string).replace(/'/g, "''")}'` : 'NULL';
        lines.push(`INSERT INTO project_prompt_templates (project_id, slug, category, content, description, sort_order, is_active)`);
        lines.push(`VALUES ('${id}', '${p.slug}', '${p.category}', '${content}', ${desc}, ${p.sort_order}, ${p.is_active});`);
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
      lines.push('slug,category,sort_order,is_active,description,content');

      for (const p of prompts) {
        const content = `"${(p.content as string).replace(/"/g, '""')}"`;
        const desc = p.description ? `"${(p.description as string).replace(/"/g, '""')}"` : '""';
        lines.push(`${p.slug},${p.category},${p.sort_order},${p.is_active},${desc},${content}`);
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
      lines.push(`# Prompt šablony: ${project.name}`);
      lines.push(`> Exportováno: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
      lines.push(`> Počet šablon: ${prompts.length}`);
      lines.push('');

      // Group by category
      const byCategory = new Map<string, typeof prompts>();
      for (const p of prompts) {
        if (!byCategory.has(p.category)) byCategory.set(p.category, []);
        byCategory.get(p.category)!.push(p);
      }

      for (const [category, entries] of byCategory) {
        lines.push(`## ${category.toUpperCase()}`);
        lines.push('');

        for (const p of entries) {
          const status = p.is_active ? '' : ' *(neaktivní)*';
          lines.push(`### ${p.slug}${status}`);
          if (p.description) lines.push(`*${p.description}*`);
          lines.push('');
          lines.push('```');
          lines.push(p.content);
          lines.push('```');
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
