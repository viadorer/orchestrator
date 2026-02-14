import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

/**
 * GET /api/chat/[projectId]/suggestions
 * Generate sample questions from project's Knowledge Base
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  if (!supabase) return NextResponse.json({ questions: [] });

  const { projectId } = await params;

  // Load project name + KB entries
  const [projectRes, kbRes] = await Promise.all([
    supabase.from('projects').select('name, description').eq('id', projectId).single(),
    supabase
      .from('knowledge_base')
      .select('title, category')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const project = projectRes.data;
  const kbEntries = kbRes.data || [];

  if (!project || kbEntries.length === 0) {
    return NextResponse.json({ questions: [] });
  }

  // Generate questions from KB entries
  const questions: string[] = [];
  const projectName = project.name as string;

  // Category-based question templates
  const templates: Record<string, (title: string, name: string) => string> = {
    'faq': (title) => title.endsWith('?') ? title : `Co je ${title}?`,
    'product': (title, name) => `Jak funguje ${title} v ${name}?`,
    'case_study': (title) => `Řekněte mi víc o ${title}`,
    'general': (title) => `Co je ${title}?`,
    'audience': (_title, name) => `Pro koho je ${name}?`,
    'mission': (_title, name) => `Jaká je vize ${name}?`,
    'data': (title) => `Jaká jsou data o ${title}?`,
    'legal': (title) => `Jak funguje ${title}?`,
  };

  const usedCategories = new Set<string>();

  for (const entry of kbEntries) {
    if (questions.length >= 3) break;
    const category = (entry.category as string) || 'general';
    // One question per category for variety
    if (usedCategories.has(category)) continue;
    usedCategories.add(category);

    const template = templates[category] || templates['general'];
    const question = template(entry.title as string, projectName);
    // Keep questions short
    if (question.length <= 50) {
      questions.push(question);
    }
  }

  // Fallback: if we don't have 3 questions, add generic ones from project
  if (questions.length < 3 && projectName) {
    const fallbacks = [
      `Co je ${projectName}?`,
      `Jak mohu začít s ${projectName}?`,
      `Jaké jsou výhody ${projectName}?`,
    ];
    for (const fb of fallbacks) {
      if (questions.length >= 3) break;
      if (!questions.includes(fb)) questions.push(fb);
    }
  }

  return NextResponse.json({ questions: questions.slice(0, 3) });
}
