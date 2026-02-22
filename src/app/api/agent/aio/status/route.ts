import { NextResponse } from 'next/server';

export async function GET() {
  const ghToken = process.env.GITHUB_PAT;
  const openaiKey = process.env.OPENAI_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;

  const status: Record<string, unknown> = {
    github_pat_configured: !!ghToken,
    openai_configured: !!openaiKey,
    perplexity_configured: !!perplexityKey,
    gemini_configured: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    timestamp: new Date().toISOString(),
  };

  // Test GitHub
  if (ghToken) {
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (userRes.ok) {
        const user = await userRes.json() as { login: string; public_repos: number };
        status.github_auth = true;
        status.github_user = user.login;

        const rateRes = await fetch('https://api.github.com/rate_limit', {
          headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        const rate = await rateRes.json() as { rate: { limit: number; remaining: number; reset: number } };
        status.rate_limit = {
          limit: rate.rate.limit,
          remaining: rate.rate.remaining,
          resets_at: new Date(rate.rate.reset * 1000).toISOString(),
        };

        const repoRes = await fetch('https://api.github.com/repos/viadorer/orchestrator', {
          headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (repoRes.ok) {
          const repo = await repoRes.json() as { full_name: string; permissions?: { push: boolean; admin: boolean } };
          status.test_repo = {
            name: repo.full_name,
            push_access: repo.permissions?.push ?? false,
            admin_access: repo.permissions?.admin ?? false,
          };
        }
      } else {
        status.github_auth = false;
        status.github_error = `HTTP ${userRes.status}`;
      }
    } catch (err) {
      status.github_auth = false;
      status.github_error = err instanceof Error ? err.message : 'Unknown';
    }
  }

  // Test OpenAI
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${openaiKey}` },
      });
      status.openai_auth = res.ok;
      if (!res.ok) status.openai_error = `HTTP ${res.status}`;
    } catch (err) {
      status.openai_auth = false;
      status.openai_error = err instanceof Error ? err.message : 'Unknown';
    }
  }

  // Test Perplexity
  if (perplexityKey) {
    try {
      const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5,
        }),
      });
      status.perplexity_auth = res.ok;
      if (!res.ok) {
        const errText = await res.text();
        status.perplexity_error = `HTTP ${res.status}: ${errText.substring(0, 200)}`;
      }
    } catch (err) {
      status.perplexity_auth = false;
      status.perplexity_error = err instanceof Error ? err.message : 'Unknown';
    }
  }

  return NextResponse.json(status);
}
