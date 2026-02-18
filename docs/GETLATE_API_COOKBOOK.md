# getLate.dev API - Kompletní Kuchařka

**getLate.dev** je náš provider pro odesílání postů na všechny sociální sítě. Tato kuchařka obsahuje 100% dokumentaci API.

**Base URL**: `https://getlate.dev/api/v1`  
**Auth**: `Authorization: Bearer GETLATE_API_KEY`

---

## 📋 Obsah

1. [Autentizace](#autentizace)
2. [Profiles (Projekty)](#profiles-projekty)
3. [Connect (OAuth připojení)](#connect-oauth-připojení)
4. [Accounts (Sociální účty)](#accounts-sociální-účty)
5. [Posts (Příspěvky)](#posts-příspěvky)
6. [Media (Obrázky & Videa)](#media-obrázky--videa)
7. [Analytics](#analytics)
8. [Webhooks](#webhooks)
9. [Queue (Časové sloty)](#queue-časové-sloty)
10. [Inbox (Komentáře & DM)](#inbox-komentáře--dm)
11. [Platform-Specific Data](#platform-specific-data)
12. [Error Handling](#error-handling)

---

## 🔐 Autentizace

### Získání API Key
1. Přihlaš se na [getlate.dev](https://getlate.dev)
2. Jdi do **Settings → API Keys**
3. Klikni **Create API Key**
4. Zkopíruj klíč OKAMŽITĚ (už ho neuvidíš)

### Formát API Key
```
sk_[64 hex characters]
```
Celková délka: 67 znaků

### Použití v Requestech
```bash
curl https://getlate.dev/api/v1/posts \
  -H "Authorization: Bearer $GETLATE_API_KEY"
```

### Environment Variable
```bash
export LATE_API_KEY="sk_..."
```

### Security Best Practices
- ✅ Používej environment variables
- ✅ Vytvoř separátní klíče per app
- ✅ Rotuj klíče pravidelně
- ❌ Nikdy necommituj klíče do Git

---

## 👤 Profiles (Projekty)

Profiles = kontejnery pro sociální účty. Např. "Personal Brand", "Company", "Client XYZ".

### List Profiles
```bash
GET /v1/profiles
```

**Response:**
```json
{
  "profiles": [
    {
      "_id": "prof_abc123",
      "name": "My Brand",
      "description": "Personal brand accounts",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Profile
```bash
POST /v1/profiles
Content-Type: application/json

{
  "name": "My First Profile",
  "description": "Testing the Late API"
}
```

**Response:**
```json
{
  "profile": {
    "_id": "prof_abc123",
    "name": "My First Profile",
    "description": "Testing the Late API",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Get Profile
```bash
GET /v1/profiles/{profileId}
```

### Update Profile
```bash
PUT /v1/profiles/{profileId}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Profile
```bash
DELETE /v1/profiles/{profileId}
```

---

## 🔗 Connect (OAuth připojení)

### Supported Platforms (13)
- `twitter` (X)
- `instagram`
- `facebook`
- `linkedin`
- `tiktok`
- `youtube`
- `pinterest`
- `reddit`
- `bluesky`
- `threads`
- `googlebusiness`
- `telegram`
- `snapchat`

### Get Connect URL
```bash
GET /v1/connect/{platform}?profileId={profileId}
```

**Příklad:**
```bash
curl "https://getlate.dev/api/v1/connect/twitter?profileId=prof_abc123" \
  -H "Authorization: Bearer $GETLATE_API_KEY"
```

**Response:**
```json
{
  "authUrl": "https://getlate.dev/oauth/twitter?token=xyz..."
}
```

**Workflow:**
1. Zavolej endpoint → dostaneš `authUrl`
2. Redirect usera na `authUrl`
3. User autorizuje na platformě
4. getLate redirect zpět na tvůj callback URL
5. Account je připojen

### Disconnect Account
```bash
DELETE /v1/accounts/{accountId}
```

---

## 📱 Accounts (Sociální účty)

### List Accounts
```bash
GET /v1/accounts
```

**Response:**
```json
{
  "accounts": [
    {
      "_id": "acc_xyz789",
      "platform": "twitter",
      "username": "@acmecorp",
      "displayName": "Acme Corp",
      "profileId": "prof_abc123",
      "isActive": true,
      "connectedAt": "2024-01-01T00:00:00Z"
    },
    {
      "_id": "acc_def456",
      "platform": "linkedin",
      "username": "acme-corporation",
      "displayName": "Acme Corporation",
      "profileId": "prof_abc123",
      "isActive": true,
      "connectedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get Account
```bash
GET /v1/accounts/{accountId}
```

### Get Account by Profile
```bash
GET /v1/accounts?profileId={profileId}
```

### Get LinkedIn Organizations
```bash
GET /v1/accounts/{accountId}/linkedin-organizations
```

**Response:**
```json
{
  "organizations": [
    {
      "urn": "urn:li:organization:123456789",
      "name": "Acme Corporation",
      "vanityName": "acme-corp"
    }
  ]
}
```

### Get Google Business Locations
```bash
GET /v1/accounts/{accountId}/gmb-locations
```

**Response:**
```json
{
  "locations": [
    {
      "locationId": "locations/123456789",
      "name": "Acme Store - Prague",
      "address": "Wenceslas Square 1, Prague"
    }
  ]
}
```

### Get Follower Stats
```bash
GET /v1/accounts/follower-stats?accountId={accountId}
```

**Response:**
```json
{
  "accountId": "acc_xyz789",
  "platform": "twitter",
  "followers": 15420,
  "following": 342,
  "posts": 1250,
  "lastUpdated": "2024-11-02T08:30:00Z"
}
```

---

## 📝 Posts (Příspěvky)

### Create Post (Schedule)
```bash
POST /v1/posts
Content-Type: application/json

{
  "content": "Hello world! This is my first post from the Late API",
  "scheduledFor": "2024-01-16T12:00:00",
  "timezone": "Europe/Prague",
  "platforms": [
    {
      "platform": "twitter",
      "accountId": "acc_xyz789"
    },
    {
      "platform": "linkedin",
      "accountId": "acc_def456"
    }
  ]
}
```

**Response:**
```json
{
  "post": {
    "_id": "65f1c0a9e2b5af0012ab34cd",
    "content": "Hello world! This is my first post from the Late API",
    "status": "scheduled",
    "scheduledFor": "2024-01-16T12:00:00Z",
    "timezone": "Europe/Prague",
    "platforms": [
      {
        "platform": "twitter",
        "accountId": "acc_xyz789",
        "status": "pending"
      },
      {
        "platform": "linkedin",
        "accountId": "acc_def456",
        "status": "pending"
      }
    ],
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### Create Post (Publish Now)
```bash
POST /v1/posts
Content-Type: application/json

{
  "content": "This posts immediately!",
  "publishNow": true,
  "platforms": [
    {
      "platform": "twitter",
      "accountId": "acc_xyz789"
    }
  ]
}
```

**Response includes `platformPostUrl`:**
```json
{
  "post": {
    "_id": "65f1c0a9e2b5af0012ab34cd",
    "content": "This posts immediately!",
    "status": "published",
    "publishedAt": "2024-01-15T10:00:05Z",
    "platforms": [
      {
        "platform": "twitter",
        "accountId": "acc_xyz789",
        "status": "published",
        "platformPostId": "1852634789012345678",
        "platformPostUrl": "https://twitter.com/acmecorp/status/1852634789012345678"
      }
    ]
  }
}
```

### Create Post with Media
```bash
POST /v1/posts
Content-Type: application/json

{
  "content": "Check out this image!",
  "publishNow": true,
  "mediaItems": [
    {
      "url": "https://example.com/image.jpg",
      "altText": "A beautiful sunset"
    }
  ],
  "platforms": [
    {
      "platform": "instagram",
      "accountId": "acc_instagram123"
    }
  ]
}
```

### Create Post with Multiple Media (Carousel)
```bash
POST /v1/posts
Content-Type: application/json

{
  "content": "Swipe to see all photos!",
  "publishNow": true,
  "mediaItems": [
    {
      "url": "https://example.com/image1.jpg",
      "altText": "Photo 1"
    },
    {
      "url": "https://example.com/image2.jpg",
      "altText": "Photo 2"
    },
    {
      "url": "https://example.com/image3.jpg",
      "altText": "Photo 3"
    }
  ],
  "platforms": [
    {
      "platform": "instagram",
      "accountId": "acc_instagram123"
    }
  ]
}
```

### Create Post with Video
```bash
POST /v1/posts
Content-Type: application/json

{
  "content": "Watch this video!",
  "publishNow": true,
  "mediaItems": [
    {
      "url": "https://example.com/video.mp4",
      "type": "video"
    }
  ],
  "platforms": [
    {
      "platform": "tiktok",
      "accountId": "acc_tiktok123"
    }
  ]
}
```

### Create Draft
```bash
POST /v1/posts
Content-Type: application/json

{
  "content": "Draft post for later",
  "status": "draft",
  "platforms": [
    {
      "platform": "twitter",
      "accountId": "acc_xyz789"
    }
  ]
}
```

### List Posts
```bash
GET /v1/posts?page=1&limit=10&status=scheduled
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `status` (draft | scheduled | published | failed)
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)
- `includeDeleted` (default: false)

**Response:**
```json
{
  "posts": [
    {
      "_id": "65f1c0a9e2b5af0012ab34cd",
      "content": "Launch post",
      "status": "scheduled",
      "scheduledFor": "2024-11-01T10:00:00Z",
      "platforms": [
        {
          "platform": "twitter",
          "accountId": {
            "_id": "acc_xyz789",
            "platform": "twitter",
            "username": "@acme",
            "displayName": "Acme Corp",
            "isActive": true
          },
          "status": "pending"
        }
      ],
      "createdAt": "2024-10-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Get Post
```bash
GET /v1/posts/{postId}
```

### Update Post
```bash
PUT /v1/posts/{postId}
Content-Type: application/json

{
  "content": "Updated content!",
  "scheduledFor": "2024-11-02T14:00:00Z"
}
```

**Note:** Lze editovat pouze `draft`, `scheduled`, `failed`, `partial` posty.

### Delete Post
```bash
DELETE /v1/posts/{postId}
```

### Cancel Scheduled Post
```bash
POST /v1/posts/{postId}/cancel
```

---

## 🖼️ Media (Obrázky & Videa)

### Media v Posts
Media se přidává přes `mediaItems` array v POST request:

```json
{
  "content": "Post with media",
  "mediaItems": [
    {
      "url": "https://example.com/image.jpg",
      "type": "image",
      "altText": "Description for accessibility"
    }
  ]
}
```

### Media Types
- `image` - JPG, PNG, GIF, WebP
- `video` - MP4, MOV, WebM
- `document` - PDF (LinkedIn only)

### Platform-Specific Media Limits

| Platform | Images | Videos | Carousel | Max Size |
|----------|--------|--------|----------|----------|
| **Twitter** | 4 | 1 | ❌ | 5 MB (image), 512 MB (video) |
| **Instagram** | 10 | 1 | ✅ | 30 MB (image), 100 MB (video) |
| **Facebook** | 10 | 1 | ✅ | 10 MB (image), 10 GB (video) |
| **LinkedIn** | 20 | 1 | ✅ | 5 MB (image), 200 MB (video) |
| **TikTok** | 35 | 1 | ✅ (photos) | 2 GB |
| **YouTube** | ❌ | 1 | ❌ | 256 GB |
| **Pinterest** | 1 | 1 | ✅ | 20 MB (image), 2 GB (video) |
| **Bluesky** | 4 | 1 | ❌ | ~1 MB (auto-compressed) |
| **Threads** | 10 | 1 | ✅ | 30 MB (image), 100 MB (video) |

### Media Upload Flow
1. **Host media na vlastním serveru** (Supabase Storage, S3, Cloudinary, atd.)
2. **Poskytni public URL** v `mediaItems[].url`
3. **getLate stáhne a uploadne** na platformu

**Příklad s Supabase Storage:**
```typescript
// 1. Upload do Supabase Storage
const { data, error } = await supabase.storage
  .from('project-media')
  .upload(`${projectId}/image.jpg`, file);

// 2. Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('project-media')
  .getPublicUrl(`${projectId}/image.jpg`);

// 3. Use in getLate API
const response = await fetch('https://getlate.dev/api/v1/posts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LATE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'Post with media',
    mediaItems: [{ url: publicUrl, altText: 'Description' }],
    platforms: [{ platform: 'instagram', accountId: 'acc_...' }]
  })
});
```

---

## 📊 Analytics

### Get Post Analytics
```bash
GET /v1/analytics?postId={postId}
```

**Response:**
```json
{
  "postId": "65f1c0a9e2b5af0012ab34cd",
  "latePostId": "65f1c0a9e2b5af0012ab34ab",
  "status": "published",
  "content": "Check out our new product launch!",
  "scheduledFor": "2024-11-01T10:00:00Z",
  "publishedAt": "2024-11-01T10:00:05Z",
  "analytics": {
    "impressions": 15420,
    "reach": 12350,
    "likes": 342,
    "comments": 28,
    "shares": 45,
    "clicks": 189,
    "views": 0,
    "engagementRate": 2.78,
    "lastUpdated": "2024-11-02T08:30:00Z"
  },
  "platformAnalytics": [
    {
      "platform": "twitter",
      "status": "published",
      "accountId": "64e1f0a9e2b5af0012ab34cd",
      "accountUsername": "@acmecorp",
      "analytics": {
        "impressions": 15420,
        "reach": 12350,
        "likes": 342,
        "comments": 28,
        "shares": 45,
        "clicks": 189,
        "views": 0,
        "engagementRate": 2.78,
        "lastUpdated": "2024-11-02T08:30:00Z"
      }
    }
  ],
  "platform": "twitter",
  "platformPostUrl": "https://twitter.com/acmecorp/status/123456789",
  "isExternal": false
}
```

### List Analytics (Paginated)
```bash
GET /v1/analytics?page=1&limit=50&startDate=2024-01-01&endDate=2024-12-31
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50, max: 100)
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)
- `source` (late | external | all) - filter by origin
- `accountId` - filter by account

**Response:**
```json
{
  "overview": {
    "totalPosts": 156,
    "publishedPosts": 142,
    "scheduledPosts": 0,
    "lastSync": "2024-11-02T08:30:00Z"
  },
  "posts": [
    {
      "_id": "65f1c0a9e2b5af0012ab34cd",
      "latePostId": "65f1c0a9e2b5af0012ab34ab",
      "content": "Check out our new product launch!",
      "publishedAt": "2024-11-01T10:00:05Z",
      "analytics": {
        "impressions": 15420,
        "likes": 342,
        "comments": 28,
        "engagementRate": 2.78
      },
      "platformPostUrl": "https://www.instagram.com/reel/ABC123xyz/",
      "isExternal": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 156,
    "pages": 4
  },
  "hasAnalyticsAccess": true
}
```

### Analytics Metrics per Platform

| Platform | Impressions | Reach | Likes | Comments | Shares | Clicks | Views | Engagement Rate |
|----------|-------------|-------|-------|----------|--------|--------|-------|-----------------|
| **Twitter** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Instagram** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Facebook** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **LinkedIn** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **TikTok** | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **YouTube** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Pinterest** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Bluesky** | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Threads** | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

**Note:** Analytics jsou cached a refreshují se max 1× za hodinu.

---

## 🔔 Webhooks

### Available Events
- `post.scheduled` - Post byl úspěšně naplánován
- `post.published` - Post byl úspěšně publikován
- `post.failed` - Post selhal na všech platformách
- `post.partial` - Post se publikoval jen na některých platformách
- `account.connected` - Sociální účet byl připojen
- `account.disconnected` - Sociální účet byl odpojen

### Create Webhook
```bash
POST /v1/webhooks/settings
Content-Type: application/json

{
  "name": "My Production Webhook",
  "url": "https://example.com/webhook",
  "events": ["post.published", "post.failed"]
}
```

**Response:**
```json
{
  "webhook": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Production Webhook",
    "url": "https://example.com/webhook",
    "events": ["post.published", "post.failed"],
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### List Webhooks
```bash
GET /v1/webhooks/settings
```

**Response:**
```json
{
  "webhooks": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "My Production Webhook",
      "url": "https://example.com/webhook",
      "events": ["post.published", "post.failed"],
      "isActive": true,
      "lastFiredAt": "2024-01-15T10:30:00Z",
      "failureCount": 0
    }
  ]
}
```

### Update Webhook
```bash
PUT /v1/webhooks/settings/{webhookId}
Content-Type: application/json

{
  "name": "Updated Webhook",
  "events": ["post.published", "post.failed", "account.disconnected"]
}
```

### Delete Webhook
```bash
DELETE /v1/webhooks/settings/{webhookId}
```

### Webhook Payload Example (post.published)
```json
{
  "event": "post.published",
  "timestamp": "2024-01-15T10:00:05Z",
  "data": {
    "postId": "65f1c0a9e2b5af0012ab34cd",
    "content": "Hello world!",
    "platforms": [
      {
        "platform": "twitter",
        "accountId": "acc_xyz789",
        "status": "published",
        "platformPostId": "1852634789012345678",
        "platformPostUrl": "https://twitter.com/acmecorp/status/1852634789012345678"
      }
    ]
  }
}
```

### Webhook Payload Example (post.failed)
```json
{
  "event": "post.failed",
  "timestamp": "2024-01-15T10:00:05Z",
  "data": {
    "postId": "65f1c0a9e2b5af0012ab34cd",
    "content": "This post failed",
    "platforms": [
      {
        "platform": "instagram",
        "accountId": "acc_instagram123",
        "status": "failed",
        "errorMessage": "Instagram access token has expired. Please reconnect your account.",
        "errorCategory": "auth_expired",
        "errorSource": "user"
      }
    ]
  }
}
```

### Webhook Security
- getLate pošle `X-Late-Signature` header s HMAC-SHA256 signature
- Verify signature na tvém serveru:

```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

### Webhook Retry Logic
- Max 10 pokusů
- Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s
- Po 10 neúspěšných pokusech se webhook automaticky deaktivuje

### Get Webhook Logs
```bash
GET /v1/webhooks/logs?webhookId={webhookId}&page=1&limit=50
```

**Response:**
```json
{
  "logs": [
    {
      "_id": "log_abc123",
      "webhookId": "507f1f77bcf86cd799439011",
      "event": "post.published",
      "status": "success",
      "statusCode": 200,
      "attempt": 1,
      "sentAt": "2024-01-15T10:00:05Z",
      "responseTime": 234
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 156
  }
}
```

**Note:** Logy se automaticky mažou po 7 dnech.

---

## ⏰ Queue (Časové sloty)

Queue = opakující se časové sloty pro auto-scheduling postů.

### Create Queue Slot
```bash
POST /v1/queue
Content-Type: application/json

{
  "profileId": "prof_abc123",
  "time": "09:00",
  "timezone": "Europe/Prague",
  "days": ["monday", "wednesday", "friday"],
  "platforms": [
    {
      "platform": "twitter",
      "accountId": "acc_xyz789"
    }
  ]
}
```

### List Queue Slots
```bash
GET /v1/queue?profileId={profileId}
```

### Update Queue Slot
```bash
PUT /v1/queue/{slotId}
Content-Type: application/json

{
  "time": "10:00",
  "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
}
```

### Delete Queue Slot
```bash
DELETE /v1/queue/{slotId}
```

---

## 💬 Inbox (Komentáře & DM)

### List Comments
```bash
GET /v1/inbox/comments?accountId={accountId}&page=1&limit=50
```

**Response:**
```json
{
  "comments": [
    {
      "_id": "cmt_abc123",
      "postId": "65f1c0a9e2b5af0012ab34cd",
      "platform": "twitter",
      "accountId": "acc_xyz789",
      "author": {
        "username": "@johndoe",
        "displayName": "John Doe",
        "profileUrl": "https://twitter.com/johndoe"
      },
      "text": "Great post!",
      "createdAt": "2024-01-15T10:05:00Z",
      "isRead": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 156
  }
}
```

### Reply to Comment
```bash
POST /v1/inbox/comments/{commentId}/reply
Content-Type: application/json

{
  "text": "Thank you!"
}
```

### Mark Comment as Read
```bash
PUT /v1/inbox/comments/{commentId}
Content-Type: application/json

{
  "isRead": true
}
```

### List DMs
```bash
GET /v1/inbox/messages?accountId={accountId}&page=1&limit=50
```

### Send DM
```bash
POST /v1/inbox/messages
Content-Type: application/json

{
  "accountId": "acc_xyz789",
  "recipientId": "user_123",
  "text": "Hello!"
}
```

### Platform Support for Inbox

| Platform | Comments | DMs | Notes |
|----------|----------|-----|-------|
| **Twitter** | ✅ Read/Write | ✅ Read/Write | Full support |
| **Instagram** | ✅ Read/Write | ✅ Read/Write | Full support |
| **Facebook** | ✅ Read/Write | ✅ Read/Write | Full support |
| **LinkedIn** | ✅ Read/Write | ❌ | No DM API |
| **TikTok** | ✅ Write only | ❌ | Cannot read comments |
| **YouTube** | ✅ Read/Write | ❌ | No DM API |
| **Pinterest** | ✅ Read/Write | ❌ | No DM API |
| **Reddit** | ✅ Read/Write | ✅ Read/Write | Full support |
| **Bluesky** | ✅ Read/Write | ❌ | No DM API yet |
| **Threads** | ✅ Read/Write | ❌ | No DM API |

---

## 🎯 Platform-Specific Data

Každá platforma má specifická nastavení. Použij `platformSpecificData` v `platforms[]` array.

### Twitter/X
```json
{
  "platform": "twitter",
  "accountId": "acc_xyz789",
  "platformSpecificData": {
    "replyToTweetId": "1234567890",
    "quoteTweetId": "9876543210"
  }
}
```

### Instagram
```json
{
  "platform": "instagram",
  "accountId": "acc_instagram123",
  "platformSpecificData": {
    "location": {
      "name": "Prague, Czech Republic",
      "latitude": 50.0755,
      "longitude": 14.4378
    },
    "userTags": [
      {
        "username": "johndoe",
        "x": 0.5,
        "y": 0.3
      }
    ],
    "audioName": "My Podcast Intro",
    "thumbOffset": 5000
  }
}
```

**Instagram Aspect Ratios:**
- Feed: 0.8-1.91 (portrait to landscape)
- Stories: 9:16 (1080×1920)
- Reels: 9:16 (1080×1920)
- Carousel: 1:1 (1080×1080) or 4:5 (1080×1350)

### Facebook
```json
{
  "platform": "facebook",
  "accountId": "acc_facebook123",
  "platformSpecificData": {
    "pageId": "960094663858399",
    "targetingLocation": "Prague",
    "scheduledPublishTime": "2024-01-16T12:00:00Z"
  }
}
```

### LinkedIn
```json
{
  "platform": "linkedin",
  "accountId": "acc_linkedin123",
  "platformSpecificData": {
    "organizationUrn": "urn:li:organization:123456789",
    "firstComment": "What do you think?",
    "disableLinkPreview": false
  }
}
```

**LinkedIn Media:**
- Images: Max 20 per post
- Videos: Max 1 per post
- Documents: Max 1 PDF (max 100 MB, ~300 pages)
- Cannot mix documents with other media

### TikTok
```json
{
  "platform": "tiktok",
  "accountId": "acc_tiktok123",
  "platformSpecificData": {
    "privacyLevel": "PUBLIC_TO_EVERYONE",
    "disableComment": false,
    "disableDuet": false,
    "disableStitch": false,
    "videoTitle": "My Video Title",
    "videoCoverTimestamp": 1.5
  }
}
```

**TikTok Privacy Levels:**
- `PUBLIC_TO_EVERYONE` (default)
- `MUTUAL_FOLLOW_FRIENDS`
- `SELF_ONLY`

**TikTok Photo Posts:**
```json
{
  "platform": "tiktok",
  "accountId": "acc_tiktok123",
  "platformSpecificData": {
    "photoMode": "SLIDESHOW",
    "photoTitles": ["Title 1", "Title 2", "Title 3"]
  }
}
```

### YouTube
```json
{
  "platform": "youtube",
  "accountId": "acc_youtube123",
  "platformSpecificData": {
    "title": "My Video Title",
    "visibility": "public",
    "madeForKids": false,
    "firstComment": "What do you think?",
    "containsSyntheticMedia": false,
    "categoryId": "22"
  }
}
```

**YouTube Visibility:**
- `public` (default) - Anyone can watch
- `unlisted` - Link only
- `private` - Invite only

**YouTube Categories:**
- `1` - Film & Animation
- `2` - Autos & Vehicles
- `10` - Music
- `15` - Pets & Animals
- `17` - Sports
- `20` - Gaming
- `22` - People & Blogs (default)
- `23` - Comedy
- `24` - Entertainment
- `25` - News & Politics
- `26` - Howto & Style
- `27` - Education
- `28` - Science & Technology

**YouTube Shorts:**
- Videos under 3 minutes are auto-detected as Shorts
- Custom thumbnails only for regular videos

### Pinterest
```json
{
  "platform": "pinterest",
  "accountId": "acc_pinterest123",
  "platformSpecificData": {
    "title": "My Pin Title",
    "boardId": "board_abc123",
    "link": "https://example.com",
    "coverImageUrl": "https://example.com/cover.jpg"
  }
}
```

**Pinterest Requirements:**
- `boardId` is required
- Single image or single video per Pin
- Title max 100 characters

### Reddit
```json
{
  "platform": "reddit",
  "accountId": "acc_reddit123",
  "platformSpecificData": {
    "subreddit": "programming",
    "title": "My Post Title",
    "flair": "Discussion",
    "nsfw": false,
    "spoiler": false
  }
}
```

### Bluesky
```json
{
  "platform": "bluesky",
  "accountId": "acc_bluesky123",
  "platformSpecificData": {
    "replyToUri": "at://did:plc:abc123/app.bsky.feed.post/xyz789"
  }
}
```

**Bluesky Media:**
- Max 4 images per post
- Images auto-compressed to ≤ ~1 MB

### Threads
```json
{
  "platform": "threads",
  "accountId": "acc_threads123",
  "platformSpecificData": {
    "replyToPostId": "post_abc123"
  }
}
```

### Google Business
```json
{
  "platform": "googlebusiness",
  "accountId": "acc_gmb123",
  "platformSpecificData": {
    "locationId": "locations/123456789",
    "languageCode": "cs",
    "callToAction": {
      "actionType": "BOOK",
      "url": "https://example.com/book"
    },
    "event": {
      "title": "Grand Opening",
      "schedule": {
        "startDate": "2024-01-16",
        "startTime": "10:00",
        "endDate": "2024-01-16",
        "endTime": "18:00"
      }
    }
  }
}
```

**Google Business CTA Types:**
- `BOOK` - Book appointment
- `ORDER` - Order online
- `SHOP` - Shop now
- `LEARN_MORE` - Learn more
- `SIGN_UP` - Sign up
- `CALL` - Call now

### Telegram
```json
{
  "platform": "telegram",
  "accountId": "acc_telegram123",
  "platformSpecificData": {
    "channelId": "@mychannel",
    "disableNotification": false,
    "disableWebPagePreview": false
  }
}
```

### Snapchat
```json
{
  "platform": "snapchat",
  "accountId": "acc_snapchat123",
  "platformSpecificData": {
    "contentType": "story",
    "attachmentUrl": "https://example.com"
  }
}
```

**Snapchat Content Types:**
- `story` - 24h story
- `saved_story` - Permanent story
- `spotlight` - Public content
- `public_profile` - Profile post

**Snapchat Requirements:**
- Media is required (single image or video)
- No text-only posts

---

## ❌ Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `402` - Payment Required (analytics add-on required)
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "Error message",
  "code": "error_code",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

#### Authentication Errors
- `unauthorized` - Invalid API key
- `api_key_expired` - API key has expired
- `api_key_revoked` - API key was revoked

#### Post Errors
- `post_not_found` - Post doesn't exist
- `post_already_published` - Cannot edit published post
- `post_content_required` - Content or media required
- `post_too_long` - Content exceeds platform limit
- `post_invalid_schedule` - Invalid scheduledFor date

#### Platform Errors
- `auth_expired` - Platform access token expired (reconnect account)
- `auth_revoked` - User revoked access
- `platform_error` - Platform API error
- `platform_rate_limit` - Platform rate limit exceeded
- `user_content` - Content violates platform rules

#### Media Errors
- `media_too_large` - File exceeds size limit
- `media_invalid_format` - Unsupported file format
- `media_download_failed` - Could not download from URL
- `media_too_many` - Too many media items for platform

### Error Categories
- `user` - User error (fix content/settings)
- `platform` - Platform error (temporary, retry later)
- `system` - getLate system error (contact support)

### Retry Logic
- `auth_expired` → Reconnect account
- `platform_rate_limit` → Wait and retry
- `platform_error` → Retry with exponential backoff
- `user_content` → Fix content and retry
- `system` → Contact support

### Post Status Flow
```
draft → scheduled → publishing → published
                              ↘ failed
                              ↘ partial (some platforms succeeded)
```

---

## 📚 Complete Example: Hugo Orchestrator Integration

### 1. Setup
```typescript
// lib/getlate.ts
const LATE_API_KEY = process.env.LATE_API_KEY;
const LATE_BASE_URL = 'https://getlate.dev/api/v1';

async function lateRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${LATE_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${LATE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`getLate API Error: ${error.error}`);
  }

  return response.json();
}
```

### 2. Publish Post from Hugo
```typescript
// app/api/publish/route.ts
import { lateRequest } from '@/lib/getlate';

export async function POST(request: Request) {
  const { postId } = await request.json();

  // 1. Get post from content_queue
  const { data: post } = await supabase
    .from('content_queue')
    .select('*')
    .eq('id', postId)
    .single();

  // 2. Get project with late_accounts
  const { data: project } = await supabase
    .from('projects')
    .select('late_accounts, platforms')
    .eq('id', post.project_id)
    .single();

  // 3. Build platforms array
  const platforms = post.platforms.map((platform: string) => ({
    platform,
    accountId: project.late_accounts[platform],
  }));

  // 4. Publish via getLate
  const result = await lateRequest('/posts', {
    method: 'POST',
    body: JSON.stringify({
      content: post.text_content,
      publishNow: true,
      mediaItems: post.image_url ? [{
        url: post.image_url,
        altText: post.alt_text,
      }] : [],
      platforms,
    }),
  });

  // 5. Update content_queue with late_post_id
  await supabase
    .from('content_queue')
    .update({
      status: 'sent',
      late_post_id: result.post._id,
      sent_at: new Date().toISOString(),
    })
    .eq('id', postId);

  return Response.json({ success: true, latePostId: result.post._id });
}
```

### 3. Schedule Post
```typescript
// Schedule for specific time
const result = await lateRequest('/posts', {
  method: 'POST',
  body: JSON.stringify({
    content: post.text_content,
    scheduledFor: '2024-01-16T12:00:00',
    timezone: 'Europe/Prague',
    mediaItems: post.image_url ? [{
      url: post.image_url,
      altText: post.alt_text,
    }] : [],
    platforms,
  }),
});
```

### 4. Handle Webhooks
```typescript
// app/api/webhooks/getlate/route.ts
import crypto from 'crypto';

export async function POST(request: Request) {
  const signature = request.headers.get('X-Late-Signature');
  const payload = await request.text();

  // Verify signature
  const hmac = crypto.createHmac('sha256', process.env.LATE_WEBHOOK_SECRET!);
  const digest = hmac.update(payload).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature!), Buffer.from(digest))) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(payload);

  switch (event.event) {
    case 'post.published':
      // Update content_queue status
      await supabase
        .from('content_queue')
        .update({ status: 'sent' })
        .eq('late_post_id', event.data.postId);
      break;

    case 'post.failed':
      // Mark as failed, log error
      await supabase
        .from('content_queue')
        .update({
          status: 'failed',
          error_message: event.data.platforms[0].errorMessage,
        })
        .eq('late_post_id', event.data.postId);
      break;

    case 'account.disconnected':
      // Notify admin
      console.error(`Account disconnected: ${event.data.accountId}`);
      break;
  }

  return Response.json({ received: true });
}
```

### 5. Get Analytics
```typescript
// app/api/analytics/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');

  const analytics = await lateRequest(`/analytics?postId=${postId}`);

  return Response.json(analytics);
}
```

---

## 🎯 Best Practices

### 1. Media Hosting
✅ **DO:**
- Host media na vlastním serveru (Supabase Storage, S3, Cloudinary)
- Používej CDN pro rychlé stahování
- Poskytuj public URLs (ne signed URLs s expirace)

❌ **DON'T:**
- Nepoužívej temporary URLs
- Nepoužívej URLs za authentication

### 2. Error Handling
✅ **DO:**
- Implementuj retry logic pro `platform_error`
- Loguj všechny errory
- Notifikuj admina při `auth_expired`

❌ **DON'T:**
- Neretryuj `user_content` errors (fix content first)
- Neignoruj `auth_expired` (account needs reconnect)

### 3. Rate Limits
- getLate: 100 requests/minute per API key
- Implementuj exponential backoff
- Používej webhooks místo pollingu

### 4. Webhooks
✅ **DO:**
- Verify signature
- Respond rychle (< 5s)
- Process async (queue job)

❌ **DON'T:**
- Neblokuj webhook response
- Neignoruj failed deliveries

### 5. Testing
- Používej `status: "draft"` pro testing
- Test na staging accountech
- Verify media URLs před publikací

---

## 📖 Další Zdroje

- **Official Docs**: https://docs.getlate.dev
- **Dashboard**: https://getlate.dev
- **OpenAPI Spec**: https://docs.getlate.dev/api/openapi
- **Status Page**: https://status.getlate.dev
- **Support**: support@getlate.dev

---

## 🔄 Changelog

### Feb 2026
- ✅ 13 platforem podporováno
- ✅ Analytics add-on
- ✅ Webhook events rozšířeny
- ✅ YouTube Shorts auto-detection
- ✅ TikTok photo posts
- ✅ LinkedIn 20 images support
- ✅ Bluesky support

---

**Tato kuchařka obsahuje 100% getLate.dev API dokumentace pro Hugo Orchestrator.**
