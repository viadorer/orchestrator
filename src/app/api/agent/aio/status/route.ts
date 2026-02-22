import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.GITHUB_PAT;

  const status: Record<string, unknown> = {
    github_pat_configured: !!token,
    timestamp: new Date().toISOString(),
  };

  if (!token) {
    return NextResponse.json({ ...status, error: 'GITHUB_PAT not set' });
  }

  try {
    // Test GitHub auth
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!userRes.ok) {
      status.github_auth = false;
      status.error = `GitHub API ${userRes.status}: ${await userRes.text()}`;
      return NextResponse.json(status);
    }

    const user = await userRes.json() as { login: string; public_repos: number };
    status.github_auth = true;
    status.github_user = user.login;
    status.public_repos = user.public_repos;

    // Test rate limit
    const rateRes = await fetch('https://api.github.com/rate_limit', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    const rate = await rateRes.json() as { rate: { limit: number; remaining: number; reset: number } };
    status.rate_limit = {
      limit: rate.rate.limit,
      remaining: rate.rate.remaining,
      resets_at: new Date(rate.rate.reset * 1000).toISOString(),
    };

    // Test write access to a known repo
    const repoRes = await fetch('https://api.github.com/repos/viadorer/orchestrator', {
      headers: {
        Authorization: `Bearer ${token}`,
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

    return NextResponse.json(status);
  } catch (err) {
    status.error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(status, { status: 500 });
  }
}
