/**
 * Jednorázový skript pro přidání AIO tagů do index.html v GitHub repech.
 * Spouštění: node --env-file=.env.local scripts/add-aio-tags.mjs
 */

const REPOS = [
  'viadorer/Davidchoc.com',
];

const TAG = `
    <script type="application/ld+json" src="/ai-data.json"></script>
    <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Context">`;

const ANCHOR = '<meta name="viewport"';

async function gh(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `token ${process.env.GITHUB_PAT}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return res.json();
}

for (const repo of REPOS) {
  console.log(`\n--- ${repo} ---`);
  
  const data = await gh(`https://api.github.com/repos/${repo}/contents/index.html`);
  if (data.message) { console.log('ERROR:', data.message); continue; }

  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  
  if (content.includes('ai-data.json')) { console.log('SKIP: already has tags'); continue; }
  
  const idx = content.indexOf(ANCHOR);
  if (idx === -1) { console.log('SKIP: no viewport meta found'); continue; }
  
  const end = content.indexOf('>', idx) + 1;
  const updated = content.slice(0, end) + TAG + content.slice(end);
  
  const encoded = Buffer.from(updated, 'utf-8').toString('base64');
  const result = await gh(`https://api.github.com/repos/${repo}/contents/index.html`, {
    method: 'PUT',
    body: JSON.stringify({
      content: encoded,
      sha: data.sha,
      message: 'AIO: Add ai-data.json and llms.txt references',
      branch: 'main',
    }),
  });
  
  if (result.commit) {
    console.log('OK:', result.commit.sha.slice(0, 12));
  } else {
    console.log('ERROR:', result.message);
  }
}
