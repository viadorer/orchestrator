/**
 * Cloudflare R2 Storage Service
 * 
 * S3-compatible storage for media assets (images, videos).
 * Adapted from eshopsys.com implementation.
 * 
 * Env vars required:
 * - R2_ACCOUNT_ID
 * - R2_BUCKET_NAME
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_ENDPOINT (e.g. https://<account_id>.r2.cloudflarestorage.com)
 * - R2_PUBLIC_URL (e.g. https://media.orchestrator.cz)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_ENDPOINT = process.env.R2_ENDPOINT || '';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

let s3Client: S3Client | null = null;

function getClient(): S3Client | null {
  if (s3Client) return s3Client;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
    console.warn('[r2] Cloudflare R2 not configured — missing env vars');
    return null;
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  console.log(`[r2] Cloudflare R2 initialized — Bucket: ${R2_BUCKET_NAME}`);
  return s3Client;
}

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ENDPOINT && R2_BUCKET_NAME);
}

// ─── MIME types ──────────────────────────────────────────────

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() || '';
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// ─── Upload ──────────────────────────────────────────────────

export interface R2UploadResult {
  success: boolean;
  key: string;
  public_url: string | null;
  size: number;
  content_type: string;
  error?: string;
}

/**
 * Upload a file (Buffer) to Cloudflare R2.
 * Key format: {projectId}/{folder}/{timestamp}-{filename}
 */
export async function uploadToR2(
  buffer: Buffer,
  filename: string,
  options: {
    projectId: string;
    folder?: string; // 'photos' | 'generated' | 'videos'
    contentType?: string;
    metadata?: Record<string, string>;
  }
): Promise<R2UploadResult> {
  const client = getClient();
  if (!client) {
    return { success: false, key: '', public_url: null, size: 0, content_type: '', error: 'R2 not configured' };
  }

  try {
    const timestamp = Date.now();
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folder = options.folder || 'photos';
    const key = `${options.projectId}/${folder}/${timestamp}-${sanitized}`;
    const contentType = options.contentType || getContentType(filename);

    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          projectId: options.projectId,
          uploadedAt: new Date().toISOString(),
          ...options.metadata,
        },
      })
    );

    let publicUrl: string | null = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : null;
    if (!publicUrl) {
      // Fallback: 7-day signed URL when R2_PUBLIC_URL is not configured
      publicUrl = await getR2SignedUrl(key, 7 * 24 * 3600);
      if (publicUrl) console.warn(`[r2] R2_PUBLIC_URL not set — using 7-day signed URL for ${key}`);
    }

    console.log(`[r2] Uploaded: ${key} (${(buffer.length / 1024).toFixed(1)} KB)`);

    return {
      success: true,
      key,
      public_url: publicUrl,
      size: buffer.length,
      content_type: contentType,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[r2] Upload failed:`, msg);
    return { success: false, key: '', public_url: null, size: 0, content_type: '', error: msg };
  }
}

// ─── Delete ──────────────────────────────────────────────────

export async function deleteFromR2(key: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    console.log(`[r2] Deleted: ${key}`);
    return true;
  } catch (err) {
    console.error(`[r2] Delete failed:`, err instanceof Error ? err.message : err);
    return false;
  }
}

// ─── Get URL ─────────────────────────────────────────────────

export function getR2PublicUrl(key: string): string | null {
  if (!R2_PUBLIC_URL) return null;
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function getR2SignedUrl(key: string, expiresIn = 3600): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    return await getSignedUrl(client, command, { expiresIn });
  } catch (err) {
    console.error(`[r2] Signed URL failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Download an object from R2 as a Buffer.
 * Used by post-upload server-side normalization (e.g. resize a 12 MB iPhone
 * photo that came in via the presigned URL flow).
 * Returns null on any error so callers can skip silently.
 */
export async function downloadFromR2(key: string): Promise<Buffer | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }),
    );
    if (!response.Body) return null;
    // Body is a streaming/Readable; collect into a Buffer.
    const chunks: Uint8Array[] = [];
    const stream = response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (err) {
    console.error(`[r2] Download failed for ${key}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Presigned Upload URL ────────────────────────────────────

/**
 * Generate a presigned PUT URL for direct client→R2 upload (bypasses server).
 * Client uploads with: PUT <url> with body = file, Content-Type header.
 */
export async function getR2PresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });
    return await getSignedUrl(client, command, { expiresIn });
  } catch (err) {
    console.error(`[r2] Presigned upload URL failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── List ────────────────────────────────────────────────────

export interface R2ListItem {
  key: string;
  size: number;
  lastModified: Date | undefined;
  public_url: string | null;
}

/**
 * List files in a project folder.
 */
export async function listR2Files(
  projectId: string,
  folder?: string,
  maxKeys = 100
): Promise<R2ListItem[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const prefix = folder ? `${projectId}/${folder}/` : `${projectId}/`;

    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: maxKeys,
      })
    );

    return (response.Contents || []).map(obj => ({
      key: obj.Key || '',
      size: obj.Size || 0,
      lastModified: obj.LastModified,
      public_url: obj.Key ? getR2PublicUrl(obj.Key) : null,
    }));
  } catch (err) {
    console.error(`[r2] List failed:`, err instanceof Error ? err.message : err);
    return [];
  }
}
