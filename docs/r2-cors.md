# Cloudflare R2 — CORS configuration

The mobile upload page (`/upload`) and any browser-based upload flow uses **presigned PUT URLs** to send large files directly to R2, bypassing the Vercel function body limit. This requires R2 to accept cross-origin PUT requests from the app's domain.

If you see errors like:

- `R2 PUT network error` in the upload UI
- `Access-Control-Allow-Origin missing` in the browser dev console

…it almost always means CORS is not configured on the R2 bucket.

## Required CORS rules

Apply these rules to the bucket pointed to by `R2_BUCKET_NAME`. Include every origin that should be able to upload — the production app, every preview deploy domain you care about, and `http://localhost:3000` for local dev.

```json
[
  {
    "AllowedOrigins": [
      "https://orchestrator.cz",
      "https://www.orchestrator.cz",
      "https://orchestrator.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": [
      "Content-Type",
      "Content-Length",
      "Content-MD5",
      "x-amz-content-sha256",
      "x-amz-date",
      "x-amz-acl"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Add wildcard preview support if you also want CORS for every Vercel preview URL:

```json
"AllowedOrigins": ["https://*.vercel.app", ...]
```

## How to apply

### Option A — Cloudflare dashboard

1. Open <https://dash.cloudflare.com/> → R2 → click your bucket → **Settings** tab
2. Scroll to **CORS Policy** → click **Add CORS policy** (or **Edit** the existing one)
3. Paste the JSON above
4. Save

The policy takes effect within a minute. No deploy needed on the Next.js app side.

### Option B — Wrangler CLI

```bash
echo '[<the JSON above>]' > cors.json
wrangler r2 bucket cors put orchestrator-media --file cors.json
```

(Replace `orchestrator-media` with your actual bucket name from `R2_BUCKET_NAME`.)

## How to verify

From the app domain, in the browser dev console:

```js
fetch('https://<bucket-public-url>/test', { method: 'OPTIONS' })
  .then(r => console.log(r.status, r.headers.get('access-control-allow-origin')))
```

A `200 OK` and an echoed origin means CORS is good.

## Why this is needed at all

The presigned URL flow works like this:

1. Browser asks our server: "give me a PUT URL for `myfile.jpg`"
2. Server returns a signed R2 URL valid for 1 hour
3. Browser does `fetch(url, { method: 'PUT', body: file })` — **this is a cross-origin request**

Without CORS, step 3 is blocked by the browser before it ever reaches Cloudflare. The error surfaces as a generic `network error` because the browser refuses to expose CORS failures to JavaScript for security reasons.
