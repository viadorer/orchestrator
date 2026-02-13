/**
 * Platform Constraints & Validation
 * 
 * Limity per platforma (aktuální k únoru 2026).
 * Zdroj: Brandwatch, Buffer, oficiální docs.
 */

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
  },
  tiktok: {
    name: 'TikTok',
    maxChars: 4000,
    visibleChars: 150,
    maxHashtags: 30,
    optimalChars: 300,
    hasImageSupport: true,
    hasVideoSupport: true,
    hasCarouselSupport: false,
    truncationText: '...více',
    previewBg: '#000000',
    previewAccent: '#FE2C55',
    previewFont: 'Proxima Nova, -apple-system, sans-serif',
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
