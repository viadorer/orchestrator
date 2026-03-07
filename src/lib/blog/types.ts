export interface BlogMeta {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  category: string;
  categoryName: string;
  image: string;
  imageAlt: string;
  date: string;
  dateFormatted: string;
  readTime: number;
  keywords: string;
  featured?: boolean;
}

export interface BlogConfig {
  enabled: boolean;
  post_format: 'html' | 'markdown';
  blog_path: string;
  posts_path: string;
  image_path: string;
  posts_json_path: string | null;
  posts_per_month: number;
  categories: BlogCategory[];
}

export interface BlogCategory {
  id: string;
  name: string;
}

export interface BlogGenerateResult {
  queueId: string;
  blogMeta: BlogMeta;
  body: string;
}

export interface BlogPublishResult {
  success: boolean;
  repo: string;
  postFile?: string;
  imageFile?: string;
  postsJsonUpdated?: boolean;
  commitShas: string[];
  error?: string;
}

export const DEFAULT_BLOG_CONFIG: BlogConfig = {
  enabled: false,
  post_format: 'html',
  blog_path: 'blog',
  posts_path: 'blog/posts',
  image_path: 'images/blog',
  posts_json_path: 'blog/posts.json',
  posts_per_month: 4,
  categories: [
    { id: 'tips', name: 'Tipy & Triky' },
    { id: 'market', name: 'Trh & Finance' },
    { id: 'legal', name: 'Právní rady' },
    { id: 'guide', name: 'Průvodce' },
  ],
};

export const DEFAULT_BLOG_CATEGORIES: Record<string, BlogCategory[]> = {
  real_estate: [
    { id: 'tips', name: 'Tipy & Triky' },
    { id: 'market', name: 'Trh & Finance' },
    { id: 'legal', name: 'Právní rady' },
    { id: 'guide', name: 'Průvodce' },
    { id: 'case_study', name: 'Případové studie' },
  ],
  finance: [
    { id: 'tips', name: 'Tipy & Triky' },
    { id: 'market', name: 'Trh & Finance' },
    { id: 'legal', name: 'Právní rady' },
    { id: 'education', name: 'Vzdělávání' },
  ],
  general: [
    { id: 'tips', name: 'Tipy & Triky' },
    { id: 'news', name: 'Novinky' },
    { id: 'guide', name: 'Průvodce' },
    { id: 'case_study', name: 'Případové studie' },
  ],
};
