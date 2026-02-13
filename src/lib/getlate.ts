/**
 * getLate.dev API Client
 * 
 * Publikace příspěvků na sociální sítě.
 * Endpoint: POST /v1/posts
 * Scheduling: scheduledFor (ISO 8601)
 */

const GETLATE_API_URL = process.env.GETLATE_API_URL || 'https://api.getlate.dev/v1';
const GETLATE_API_KEY = process.env.GETLATE_API_KEY;

export interface LatePostPayload {
  socialSetId: string;
  text: string;
  platforms: string[];
  imageUrl?: string;
  scheduledFor?: string; // ISO 8601
}

export interface LatePostResponse {
  id: string;
  status: string;
  scheduledFor?: string;
}

export async function publishPost(payload: LatePostPayload): Promise<LatePostResponse> {
  if (!GETLATE_API_KEY) {
    throw new Error('GETLATE_API_KEY is not configured');
  }

  const res = await fetch(`${GETLATE_API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GETLATE_API_KEY}`,
    },
    body: JSON.stringify({
      socialSetId: payload.socialSetId,
      text: payload.text,
      platforms: payload.platforms,
      imageUrl: payload.imageUrl,
      scheduledFor: payload.scheduledFor,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`getLate.dev API error (${res.status}): ${error}`);
  }

  return res.json();
}

export async function publishBatch(posts: LatePostPayload[]): Promise<LatePostResponse[]> {
  const results: LatePostResponse[] = [];
  for (const post of posts) {
    const result = await publishPost(post);
    results.push(result);
  }
  return results;
}
