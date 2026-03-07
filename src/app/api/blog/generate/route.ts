import { NextResponse } from 'next/server';
import { generateBlogPost } from '@/lib/blog/blog-generator';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project_id, topic, category, post_format } = body as {
      project_id: string;
      topic?: string;
      category?: string;
      post_format?: 'html' | 'markdown';
    };

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    const result = await generateBlogPost({
      projectId: project_id,
      topic,
      category,
      postFormat: post_format,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
