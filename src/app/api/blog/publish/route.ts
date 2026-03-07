import { NextResponse } from 'next/server';
import { publishBlogToGitHub } from '@/lib/blog/github-publisher';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { queue_id } = body as { queue_id: string };

    if (!queue_id) {
      return NextResponse.json({ error: 'queue_id is required' }, { status: 400 });
    }

    const result = await publishBlogToGitHub(queue_id);

    if (!result.success) {
      return NextResponse.json({ error: result.error, ...result }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
