/**
 * Platform Constraints & Validation
 * 
 * Limity per platforma (aktuální k únoru 2026).
 * Zdroj: Brandwatch, Buffer, oficiální docs.
 */

export interface ImageSpec {
  width: number;
  height: number;
  aspectRatio: string;
  label: string; // e.g. 'landscape', 'square', 'portrait'
}

export interface VideoSpec {
  width: number;
  height: number;
  aspectRatio: string;
  maxDurationSec: number;
  optimalDurationSec: number;
  maxSizeMB: number;
  format: string; // e.g. 'MP4'
}

export interface ContentSpec {
  tone: string;           // e.g. 'professional', 'casual', 'playful'
  hookStrategy: string;   // how to start the post
  structureHint: string;  // formatting guidance
  ctaStyle: string;       // CTA approach
  hashtagPlacement: string; // 'end', 'inline', 'none'
  emojiPolicy: string;    // 'none', 'minimal', 'moderate'
}

export interface PlatformLimits {
  name: string;
  maxChars: number;
  visibleChars: number; // kolik je vidět před "zobrazit více"
  maxHashtags: number;
  optimalChars: number; // doporučená délka pro engagement
  hasImageSupport: boolean;
  hasVideoSupport: boolean;
  hasCarouselSupport: boolean;
  truncationText: string; // co se zobrazí za viditelnou částí
  // Preview styling
  previewBg: string;
  previewAccent: string;
  previewFont: string;
  // Content generation specs
  imageSpecs: ImageSpec[];       // recommended image dimensions (first = default)
  videoSpec: VideoSpec | null;   // video specs (null = no video)
  maxImages: number;             // max images per post
  contentSpec: ContentSpec;      // AI generation guidance
  aiPromptHint: string;          // concise instruction injected into AI prompt
}

export const PLATFORM_LIMITS: Record<string, PlatformLimits> = {
  facebook: {
    name: 'Facebook',
    maxChars: 63206,
    visibleChars: 477,
    maxHashtags: 30,
    optimalChars: 80,
    hasImageSupport: true,
    hasVideoSupport: true,
    hasCarouselSupport: true,
    truncationText: '... Zobrazit více',
    previewBg: '#ffffff',
    previewAccent: '#1877F2',
    previewFont: 'system-ui, -apple-system, Helvetica, Arial, sans-serif',
    imageSpecs: [
      { width: 1080, height: 1350, aspectRatio: '4:5', label: 'portrait' },
      { width: 1200, height: 1200, aspectRatio: '1:1', label: 'square' },
      { width: 1200, height: 630, aspectRatio: '1.91:1', label: 'landscape' },
      { width: 1080, height: 1920, aspectRatio: '9:16', label: 'story' },
    ],
    videoSpec: { width: 1080, height: 1920, aspectRatio: '9:16', maxDurationSec: 90, optimalDurationSec: 30, maxSizeMB: 4096, format: 'MP4' },
    maxImages: 10,
    contentSpec: {
      tone: 'storytelling, emocionální, přátelský',
      hookStrategy: 'Silný emocionální hook v prvních 477 znacích. Příběh nebo otázka.',
      structureHint: 'Krátký a punchy (80 znaků ideál) NEBO delší storytelling. Krátké odstavce.',
      ctaStyle: 'Otázka k diskuzi, sdílení, nebo odkaz',
      hashtagPlacement: 'end',
      emojiPolicy: 'none',
    },
    aiPromptHint: 'Facebook: Krátký storytelling (ideál 80 znaků, max 477 viditelných). Emocionální hook. Obrázek: portrait 1080×1350 (4:5, nejlepší engagement), square 1200×1200 (1:1), landscape 1200×630 (1.91:1, pro sdílené odkazy).',
  },
  instagram: {
    name: 'Instagram',
    maxChars: 2200,
    visibleChars: 125,
    maxHashtags: 30,
    optimalChars: 150,
    hasImageSupport: true,
    hasVideoSupport: true,
    hasCarouselSupport: true,
    truncationText: '...více',
    previewBg: '#000000',
    previewAccent: '#E1306C',
    previewFont: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, sans-serif',
    imageSpecs: [
      { width: 1080, height: 1350, aspectRatio: '4:5', label: 'portrait' },
      { width: 1080, height: 1080, aspectRatio: '1:1', label: 'square' },
      { width: 1080, height: 1920, aspectRatio: '9:16', label: 'story' },
      { width: 1080, height: 566, aspectRatio: '1.91:1', label: 'landscape' },
    ],
    videoSpec: { width: 1080, height: 1920, aspectRatio: '9:16', maxDurationSec: 90, optimalDurationSec: 15, maxSizeMB: 4096, format: 'MP4' },
    maxImages: 10,
    contentSpec: {
      tone: 'vizuální, casual, authentic, inspirativní',
      hookStrategy: 'Prvních 125 znaků = vše co uživatel vidí. Silný vizuální hook.',
      structureHint: 'Krátký caption (150 znaků). Vizuál je hlavní obsah. Hashtagy na konci.',
      ctaStyle: 'Otázka, "uložte si", "sdílejte"',
      hashtagPlacement: 'end',
      emojiPolicy: 'none',
    },
    aiPromptHint: 'Instagram: Vizuál je král. Caption max 150 znaků, hook v prvních 125. Obrázek: portrait 1080×1350 (4:5, NEJLEPŠÍ VOLBA), square 1080×1080 (1:1, dobré pro mřížku), story/reels 1080×1920 (9:16). NEPOŽÍVEJTE landscape — působí drobně. 15-20 hashtagů na konci.',
  },
  linkedin: {
    name: 'LinkedIn',
    maxChars: 3000,
    visibleChars: 210,
    maxHashtags: 5,
    optimalChars: 1300,
    hasImageSupport: true,
    hasVideoSupport: true,
    hasCarouselSupport: true,
    truncationText: '...zobrazit více',
    previewBg: '#ffffff',
    previewAccent: '#0A66C2',
    previewFont: '-apple-system, system-ui, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    imageSpecs: [
      { width: 1200, height: 1200, aspectRatio: '1:1', label: 'square' },
      { width: 1080, height: 1350, aspectRatio: '4:5', label: 'portrait' },
      { width: 1200, height: 627, aspectRatio: '1.91:1', label: 'landscape' },
      { width: 1200, height: 644, aspectRatio: '1.86:1', label: 'article_cover' },
    ],
    videoSpec: { width: 1920, height: 1080, aspectRatio: '16:9', maxDurationSec: 600, optimalDurationSec: 60, maxSizeMB: 200, format: 'MP4' },
    maxImages: 20,
    contentSpec: {
      tone: 'profesionální, data-driven, expertní',
      hookStrategy: 'Prvních 210 znaků = hook. Začni faktem, číslem nebo provokativní otázkou.',
      structureHint: 'Dlouhý formát (1200-1300 znaků). Krátké odstavce (1-2 věty). Prázdné řádky mezi nimi. Externí odkaz dát do prvního komentáře (algoritmus penál za externí URL v postu).',
      ctaStyle: 'Otázka na konci k diskuzi. Odkaz v prvním komentáři.',
      hashtagPlacement: 'end',
      emojiPolicy: 'none',
    },
    aiPromptHint: 'LinkedIn: Profesionální long-form (1200-1300 znaků). Hook v prvních 210 znacích. Krátké odstavce. 3-5 hashtagů na konci. Obrázek: square 1200×1200 (1:1, nejbezpečnější), portrait 1080×1350 (4:5, víc místa na mobilu), landscape 1200×627 (1.91:1, pro sdílené odkazy). Externí odkaz dát do 1. komentáře, ne do postu.',
  },
  x: {
    name: 'X (Twitter)',
    maxChars: 280,
    visibleChars: 280,
    maxHashtags: 5,
    optimalChars: 200,
    hasImageSupport: true,
    hasVideoSupport: true,
    hasCarouselSupport: false,
    truncationText: '',
    previewBg: '#000000',
    previewAccent: '#1DA1F2',
    previewFont: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, sans-serif',
    imageSpecs: [
      { width: 1200, height: 675, aspectRatio: '16:9', label: 'landscape' },
      { width: 1200, height: 1200, aspectRatio: '1:1', label: 'square' },
    ],
    videoSpec: { width: 1280, height: 720, aspectRatio: '16:9', maxDurationSec: 140, optimalDurationSec: 30, maxSizeMB: 512, format: 'MP4' },
    maxImages: 4,
    contentSpec: {
      tone: 'punchy, direct, conversational, witty',
      hookStrategy: 'Celý post = hook. Max 280 znaků. Každé slovo musí mít váhu.',
      structureHint: 'Jedna myšlenka. Žádné odstavce. Přímý a úderný.',
      ctaStyle: 'Retweet bait, otázka, kontroverzní take',
      hashtagPlacement: 'inline',
      emojiPolicy: 'none',
    },
    aiPromptHint: 'X/Twitter: HARD LIMIT 280 znaků. Punchy, direct. Jedna myšlenka. Max 2 hashtagy inline. Obrázek 1200×675px.',
  },
  tiktok: {
    name: 'TikTok',
    maxChars: 4000,
    visibleChars: 150,
    maxHashtags: 30,
    optimalChars: 300,
    hasImageSupport: true,
    hasVideoSupport: true,
    hasCarouselSupport: true,
    truncationText: '...více',
    previewBg: '#000000',
    previewAccent: '#FE2C55',
    previewFont: 'Proxima Nova, -apple-system, sans-serif',
    imageSpecs: [
      { width: 1080, height: 1920, aspectRatio: '9:16', label: 'vertical' },
    ],
    videoSpec: { width: 1080, height: 1920, aspectRatio: '9:16', maxDurationSec: 600, optimalDurationSec: 30, maxSizeMB: 287, format: 'MP4' },
    maxImages: 35,
    contentSpec: {
      tone: 'casual, playful, authentic, gen-z friendly',
      hookStrategy: 'Hook v prvních 1.5-3 sekundách videa. Vizuální nebo textový háček HNED na začátku. Prvních 150 znaků caption = vše viditelné.',
      structureHint: 'Caption: klíčová slova do prvních 2 řádků (TikTok SEO). Krátký (100-150 znaků). Trending audio. Photo carousel má často větší dosah než průměrné video.',
      ctaStyle: 'Follow, like, komentuj, duet',
      hashtagPlacement: 'end',
      emojiPolicy: 'none',
    },
    aiPromptHint: 'TikTok: Caption max 150 znaků viditelných. Casual a playful. VŽDY 9:16 vertical (1080×1920). Safe zone: text jen do středu 80% plochy (pravá strana = UI ikony, spodek = caption, horní = lišta). SEO klíčová slova do prvních 2 řádků. Photo carousel má velký dosah. 3-5 hashtagů.',
  },
  youtube: {
    name: 'YouTube',
    maxChars: 5000,
    visibleChars: 200,
    maxHashtags: 15,
    optimalChars: 300,
    hasImageSupport: false,
    hasVideoSupport: true,
    hasCarouselSupport: false,
    truncationText: '...ZOBRAZIT VÍCE',
    previewBg: '#0f0f0f',
    previewAccent: '#FF0000',
    previewFont: 'Roboto, Arial, sans-serif',
    imageSpecs: [
      { width: 1280, height: 720, aspectRatio: '16:9', label: 'thumbnail' },
    ],
    videoSpec: { width: 1920, height: 1080, aspectRatio: '16:9', maxDurationSec: 43200, optimalDurationSec: 480, maxSizeMB: 262144, format: 'MP4' },
    maxImages: 0,
    contentSpec: {
      tone: 'informativní, expertní, edukační',
      hookStrategy: 'Prvních 200 znaků popisu = hook. Klíčová slova pro SEO.',
      structureHint: 'Popis videa: 300 znaků. Timestamps. Klíčová slova.',
      ctaStyle: 'Subscribe, like, komentuj, odkaz v popisu',
      hashtagPlacement: 'end',
      emojiPolicy: 'none',
    },
    aiPromptHint: 'YouTube: Popis videa (300 znaků). SEO klíčová slova. Thumbnail 1280×720px. Video 1920×1080.',
  },
  threads: {
    name: 'Threads',
    maxChars: 500,
    visibleChars: 500,
    maxHashtags: 10,
    optimalChars: 300,
    hasImageSupport: true,
    hasVideoSupport: true,
    hasCarouselSupport: true,
    truncationText: '',
    previewBg: '#101010',
    previewAccent: '#ffffff',
    previewFont: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    imageSpecs: [
      { width: 1080, height: 1080, aspectRatio: '1:1', label: 'square' },
    ],
    videoSpec: { width: 1080, height: 1920, aspectRatio: '9:16', maxDurationSec: 300, optimalDurationSec: 30, maxSizeMB: 100, format: 'MP4' },
    maxImages: 10,
    contentSpec: {
      tone: 'conversational, authentic, casual',
      hookStrategy: 'Celý post viditelný (500 znaků). Conversational opener.',
      structureHint: 'Krátký a přímý (300 znaků). Konverzační tón.',
      ctaStyle: 'Otázka, diskuze, share',
      hashtagPlacement: 'none',
      emojiPolicy: 'none',
    },
    aiPromptHint: 'Threads: Max 500 znaků, ideál 300. Konverzační tón. Bez hashtagů. Obrázek 1080×1080.',
  },
  bluesky: {
    name: 'Bluesky',
    maxChars: 300,
    visibleChars: 300,
    maxHashtags: 10,
    optimalChars: 250,
    hasImageSupport: true,
    hasVideoSupport: true,
    hasCarouselSupport: false,
    truncationText: '',
    previewBg: '#ffffff',
    previewAccent: '#0085FF',
    previewFont: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    imageSpecs: [
      { width: 1200, height: 675, aspectRatio: '16:9', label: 'landscape' },
    ],
    videoSpec: { width: 1920, height: 1080, aspectRatio: '16:9', maxDurationSec: 60, optimalDurationSec: 30, maxSizeMB: 50, format: 'MP4' },
    maxImages: 4,
    contentSpec: {
      tone: 'conversational, thoughtful, community-driven',
      hookStrategy: 'Celý post viditelný (300 znaků). Přímý a thoughtful.',
      structureHint: 'Krátký (250 znaků). Jedna myšlenka. Přátelský tón.',
      ctaStyle: 'Diskuze, repost',
      hashtagPlacement: 'none',
      emojiPolicy: 'none',
    },
    aiPromptHint: 'Bluesky: Max 300 znaků, ideál 250. Thoughtful a přátelský. Obrázek max ~1MB (auto-compressed).',
  },
  pinterest: {
    name: 'Pinterest',
    maxChars: 500,
    visibleChars: 100,
    maxHashtags: 20,
    optimalChars: 200,
    hasImageSupport: true,
    hasVideoSupport: true,
    hasCarouselSupport: true,
    truncationText: '...Více',
    previewBg: '#ffffff',
    previewAccent: '#E60023',
    previewFont: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    imageSpecs: [
      { width: 1000, height: 1500, aspectRatio: '2:3', label: 'pin' },
      { width: 1000, height: 1000, aspectRatio: '1:1', label: 'square' },
    ],
    videoSpec: { width: 1080, height: 1920, aspectRatio: '9:16', maxDurationSec: 900, optimalDurationSec: 30, maxSizeMB: 2048, format: 'MP4' },
    maxImages: 1,
    contentSpec: {
      tone: 'inspirativní, vizuální, SEO-friendly',
      hookStrategy: 'Prvních 100 znaků viditelných. Popisný a SEO-optimalizovaný.',
      structureHint: 'Popis pinu (200 znaků). Klíčová slova pro vyhledávání.',
      ctaStyle: 'Uložit, kliknout na odkaz',
      hashtagPlacement: 'end',
      emojiPolicy: 'none',
    },
    aiPromptHint: 'Pinterest: Popis 200 znaků, SEO klíčová slova. Obrázek 1000×1500px (2:3 portrait). Inspirativní tón.',
  },
  reddit: {
    name: 'Reddit',
    maxChars: 40000,
    visibleChars: 300,
    maxHashtags: 0,
    optimalChars: 500,
    hasImageSupport: true,
    hasVideoSupport: true,
    hasCarouselSupport: false,
    truncationText: '...read more',
    previewBg: '#1a1a1b',
    previewAccent: '#FF4500',
    previewFont: '-apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans, sans-serif',
    imageSpecs: [
      { width: 1200, height: 1200, aspectRatio: '1:1', label: 'square' },
    ],
    videoSpec: { width: 1280, height: 720, aspectRatio: '16:9', maxDurationSec: 900, optimalDurationSec: 60, maxSizeMB: 1024, format: 'MP4' },
    maxImages: 1,
    contentSpec: {
      tone: 'informativní, community-driven, autentický',
      hookStrategy: 'Silný title (300 znaků max). Prvních 300 znaků body = hook.',
      structureHint: 'Delší formát (500 znaků). Informativní. Žádné hashtagy.',
      ctaStyle: 'Diskuze, AMA, feedback',
      hashtagPlacement: 'none',
      emojiPolicy: 'none',
    },
    aiPromptHint: 'Reddit: Title + body (500 znaků). Informativní, autentický. ŽÁDNÉ hashtagy. ŽÁDNÉ emoji.',
  },
  'google-business': {
    name: 'Google Business',
    maxChars: 1500,
    visibleChars: 200,
    maxHashtags: 0,
    optimalChars: 300,
    hasImageSupport: true,
    hasVideoSupport: false,
    hasCarouselSupport: false,
    truncationText: '...Více',
    previewBg: '#ffffff',
    previewAccent: '#4285F4',
    previewFont: 'Google Sans, Roboto, Arial, sans-serif',
    imageSpecs: [
      { width: 1200, height: 900, aspectRatio: '4:3', label: 'landscape' },
    ],
    videoSpec: null,
    maxImages: 1,
    contentSpec: {
      tone: 'profesionální, lokální, informativní',
      hookStrategy: 'Prvních 200 znaků = hook. Lokální relevance.',
      structureHint: 'Krátký (300 znaků). Informace o firmě, akce, novinky.',
      ctaStyle: 'Navštivte nás, zavolejte, objednejte',
      hashtagPlacement: 'none',
      emojiPolicy: 'none',
    },
    aiPromptHint: 'Google Business: Max 300 znaků. Lokální a profesionální. Obrázek 1200×900px (4:3). ŽÁDNÉ hashtagy.',
  },
  telegram: {
    name: 'Telegram',
    maxChars: 4096,
    visibleChars: 4096,
    maxHashtags: 30,
    optimalChars: 500,
    hasImageSupport: true,
    hasVideoSupport: true,
    hasCarouselSupport: false,
    truncationText: '',
    previewBg: '#17212b',
    previewAccent: '#5288c1',
    previewFont: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    imageSpecs: [
      { width: 1280, height: 720, aspectRatio: '16:9', label: 'landscape' },
    ],
    videoSpec: { width: 1920, height: 1080, aspectRatio: '16:9', maxDurationSec: 3600, optimalDurationSec: 60, maxSizeMB: 2048, format: 'MP4' },
    maxImages: 10,
    contentSpec: {
      tone: 'informativní, přímý, newsletter-style',
      hookStrategy: 'Celý text viditelný. Silný opener.',
      structureHint: 'Delší formát (500 znaků). Strukturovaný. Markdown formatting.',
      ctaStyle: 'Odkaz, forward, diskuze',
      hashtagPlacement: 'end',
      emojiPolicy: 'none',
    },
    aiPromptHint: 'Telegram: Newsletter styl (500 znaků). Strukturovaný text. Markdown OK. Obrázek 1280×720.',
  },
  snapchat: {
    name: 'Snapchat',
    maxChars: 250,
    visibleChars: 250,
    maxHashtags: 0,
    optimalChars: 100,
    hasImageSupport: true,
    hasVideoSupport: true,
    hasCarouselSupport: false,
    truncationText: '',
    previewBg: '#FFFC00',
    previewAccent: '#000000',
    previewFont: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    imageSpecs: [
      { width: 1080, height: 1920, aspectRatio: '9:16', label: 'vertical' },
    ],
    videoSpec: { width: 1080, height: 1920, aspectRatio: '9:16', maxDurationSec: 60, optimalDurationSec: 10, maxSizeMB: 1024, format: 'MP4' },
    maxImages: 1,
    contentSpec: {
      tone: 'casual, fun, ephemeral',
      hookStrategy: 'Vizuál je vše. Text jen jako overlay (100 znaků).',
      structureHint: 'Ultra krátký (100 znaků). Vizuál-first.',
      ctaStyle: 'Swipe up, screenshot',
      hashtagPlacement: 'none',
      emojiPolicy: 'none',
    },
    aiPromptHint: 'Snapchat: Max 100 znaků. Vizuál je hlavní. 1080×1920 vertical. VYŽADUJE media.',
  },
};

/** All platform keys supported by getLate.dev */
export const ALL_PLATFORMS = Object.keys(PLATFORM_LIMITS);

// ============================================
// Validation
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    charCount: number;
    hashtagCount: number;
    isOverLimit: boolean;
    isTruncated: boolean;
    visibleText: string;
    hiddenText: string;
  };
}

/**
 * Validate post content against platform limits.
 * Returns errors (blocking) and warnings (informational).
 */
export function validatePost(text: string, platform: string): ValidationResult {
  const limits = PLATFORM_LIMITS[platform];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!limits) {
    return {
      valid: false,
      errors: [`Neznámá platforma: ${platform}`],
      warnings: [],
      stats: { charCount: text.length, hashtagCount: 0, isOverLimit: false, isTruncated: false, visibleText: text, hiddenText: '' },
    };
  }

  const charCount = text.length;
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  const isOverLimit = charCount > limits.maxChars;
  const isTruncated = charCount > limits.visibleChars;

  // Errors (blocking)
  if (isOverLimit) {
    errors.push(`Text má ${charCount} znaků, limit pro ${limits.name} je ${limits.maxChars}. Zkraťte o ${charCount - limits.maxChars} znaků.`);
  }

  if (hashtagCount > limits.maxHashtags) {
    errors.push(`${hashtagCount} hashtagů, limit pro ${limits.name} je ${limits.maxHashtags}.`);
  }

  // Warnings (informational)
  if (isTruncated && !isOverLimit) {
    warnings.push(`Text bude oříznut po ${limits.visibleChars} znacích. Uživatel uvidí "${limits.truncationText}".`);
  }

  if (charCount > limits.optimalChars * 2) {
    warnings.push(`Text je výrazně delší než optimální délka (${limits.optimalChars} znaků) pro ${limits.name}.`);
  }

  // Check if hook is in visible part
  const visibleText = text.substring(0, limits.visibleChars);
  const hiddenText = text.substring(limits.visibleChars);

  if (isTruncated) {
    const hasNumberInVisible = /\d/.test(visibleText);
    if (!hasNumberInVisible) {
      warnings.push(`Viditelná část neobsahuje žádné číslo. Hook by měl být v prvních ${limits.visibleChars} znacích.`);
    }
  }

  // Empty content
  if (charCount === 0) {
    errors.push('Text je prázdný.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      charCount,
      hashtagCount,
      isOverLimit,
      isTruncated,
      visibleText,
      hiddenText,
    },
  };
}

/**
 * Validate post for ALL target platforms at once.
 */
export function validatePostMultiPlatform(text: string, platforms: string[]): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};
  for (const platform of platforms) {
    results[platform] = validatePost(text, platform);
  }
  return results;
}

/**
 * Check if post is valid for ALL target platforms.
 */
export function isPostValidForAllPlatforms(text: string, platforms: string[]): boolean {
  return platforms.every(p => validatePost(text, p).valid);
}

// ============================================
// Multi-Platform Content Generation Helpers
// ============================================

/**
 * Build detailed platform-specific prompt block for AI content generation.
 * Injected into the prompt so Hugo knows exactly how to write for each platform.
 */
export function buildPlatformPromptBlock(platform: string): string {
  const limits = PLATFORM_LIMITS[platform];
  if (!limits) return `Platforma: ${platform} (neznámá – piš obecný post)`;

  const spec = limits.contentSpec;
  const img = limits.imageSpecs[0];
  const lines: string[] = [];

  lines.push(`\n--- PRAVIDLA PRO ${limits.name.toUpperCase()} ---`);
  lines.push(limits.aiPromptHint);
  lines.push(`\nSPECIFIKACE:`);
  lines.push(`- Délka textu: optimální ${limits.optimalChars} znaků, max ${limits.maxChars} znaků`);
  lines.push(`- Viditelných znaků před oříznutím: ${limits.visibleChars}`);
  lines.push(`- Hashtagy: max ${limits.maxHashtags}, umístění: ${spec.hashtagPlacement}`);
  lines.push(`- Emoji: ${spec.emojiPolicy}`);
  lines.push(`\nTÓN A STYL:`);
  lines.push(`- Tón: ${spec.tone}`);
  lines.push(`- Hook strategie: ${spec.hookStrategy}`);
  lines.push(`- Struktura: ${spec.structureHint}`);
  lines.push(`- CTA styl: ${spec.ctaStyle}`);

  if (img) {
    lines.push(`\nOBRÁZEK:`);
    lines.push(`- Rozměry: ${img.width}×${img.height}px (${img.aspectRatio}, ${img.label})`);
    lines.push(`- V image_prompt uveď aspect ratio: ${img.aspectRatio}`);
  }

  if (limits.videoSpec) {
    lines.push(`\nVIDEO (pokud relevantní):`);
    lines.push(`- Rozměry: ${limits.videoSpec.width}×${limits.videoSpec.height}px (${limits.videoSpec.aspectRatio})`);
    lines.push(`- Optimální délka: ${limits.videoSpec.optimalDurationSec}s`);
  }

  return lines.join('\n');
}

/**
 * Get the default (first/recommended) image spec for a platform.
 */
export function getDefaultImageSpec(platform: string): ImageSpec | null {
  const limits = PLATFORM_LIMITS[platform];
  if (!limits || limits.imageSpecs.length === 0) return null;
  return limits.imageSpecs[0];
}

/**
 * Build a compact multi-platform generation instruction.
 * Used when Hugo generates variants for multiple platforms in one AI call.
 */
export function buildMultiPlatformPromptBlock(platforms: string[]): string {
  const lines: string[] = [];
  lines.push('\n=== MULTI-PLATFORM GENEROVÁNÍ ===');
  lines.push('Vytvoř SAMOSTATNOU variantu příspěvku pro KAŽDOU platformu.');
  lines.push('Každá varianta musí být optimalizovaná pro danou síť – jiná délka, jiný tón, jiný formát.');
  lines.push('');

  for (const platform of platforms) {
    const limits = PLATFORM_LIMITS[platform];
    if (!limits) continue;
    const img = limits.imageSpecs[0];
    const imgStr = img ? `${img.width}×${img.height}px ${img.aspectRatio}` : 'žádný';
    lines.push(`[${limits.name}] ${limits.optimalChars} znaků | tón: ${limits.contentSpec.tone} | obrázek: ${imgStr} | hashtagy: ${limits.maxHashtags > 0 ? `max ${limits.maxHashtags} (${limits.contentSpec.hashtagPlacement})` : 'žádné'}`);
  }

  lines.push('');
  lines.push('VÝSTUP: JSON objekt s klíčem "variants" – pole objektů, každý s:');
  lines.push('  { "platform": "...", "text": "...", "image_prompt": "...", "image_spec": { "width": N, "height": N, "aspectRatio": "..." }, "scores": {...} }');

  return lines.join('\n');
}
