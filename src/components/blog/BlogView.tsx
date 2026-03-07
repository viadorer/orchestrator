'use client';

import { useEffect, useState } from 'react';
import { FileText, Send, Trash2, Filter, ChevronDown, ChevronUp, Sparkles, ExternalLink, Calendar, Clock, Tag, CheckCircle2, AlertCircle } from 'lucide-react';

interface BlogPost {
  id: string;
  project_id: string;
  text_content: string;
  markdown_body: string;
  blog_meta: {
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
  };
  image_url: string | null;
  status: string;
  created_at: string;
  sent_at: string | null;
  projects?: { name: string; slug: string };
}

const STATUS_LABELS: Record<string, string> = {
  review: 'K review',
  approved: 'Schváleno',
  sent: 'Publikováno',
  draft: 'Koncept',
};

const STATUS_COLORS: Record<string, string> = {
  review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  sent: 'bg-blue-100 text-blue-800',
  draft: 'bg-gray-100 text-gray-800',
};

export function BlogView() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('review');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const res = await fetch(`/api/blog?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to load blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [statusFilter]);

  const handlePublish = async (postId: string) => {
    if (!confirm('Publikovat tento článek na GitHub?')) return;
    
    setPublishing(postId);
    try {
      const res = await fetch('/api/blog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_id: postId }),
      });

      const result = await res.json();
      
      if (result.success) {
        alert(`✅ Publikováno na GitHub!\nRepo: ${result.repo}\nCommits: ${result.commitShas.length}`);
        loadPosts();
      } else {
        alert(`❌ Chyba: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Chyba: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Smazat tento článek?')) return;
    
    try {
      await fetch(`/api/queue/${postId}`, { method: 'DELETE' });
      loadPosts();
    } catch (err) {
      alert(`❌ Chyba: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const handleApprove = async (postId: string) => {
    try {
      await fetch(`/api/queue/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      loadPosts();
    } catch (err) {
      alert(`❌ Chyba: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blog články</h2>
          <p className="text-sm text-gray-500 mt-1">
            Generované články pro publikaci na GitHub
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Všechny</option>
            <option value="review">K review</option>
            <option value="approved">Schváleno</option>
            <option value="sent">Publikováno</option>
            <option value="draft">Koncepty</option>
          </select>
        </div>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Žádné blog posty</p>
          <p className="text-sm text-gray-500 mt-1">
            Vygeneruj nový článek přes MCP tools nebo API
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Post Header */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {post.blog_meta.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[post.status]}`}>
                        {STATUS_LABELS[post.status]}
                      </span>
                      {post.blog_meta.featured && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {post.blog_meta.excerpt}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>{post.blog_meta.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.blog_meta.readTime} min čtení</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{post.blog_meta.dateFormatted}</span>
                      </div>
                      {post.projects && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{post.projects.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {post.status === 'review' && (
                      <button
                        onClick={() => handleApprove(post.id)}
                        className="px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Schválit
                      </button>
                    )}
                    
                    {(post.status === 'approved' || post.status === 'review') && (
                      <button
                        onClick={() => handlePublish(post.id)}
                        disabled={publishing === post.id}
                        className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {publishing === post.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Publikuji...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Publikovat
                          </>
                        )}
                      </button>
                    )}
                    
                    {post.status === 'sent' && post.sent_at && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Publikováno {new Date(post.sent_at).toLocaleDateString('cs')}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setExpanded(expanded === post.id ? null : post.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {expanded === post.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* SEO Info */}
                {expanded === post.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">SEO metadata</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Title:</span>
                          <span className="ml-2 text-gray-900">{post.blog_meta.seoTitle}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Description:</span>
                          <span className="ml-2 text-gray-900">{post.blog_meta.seoDescription}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Slug:</span>
                          <span className="ml-2 font-mono text-gray-900">{post.blog_meta.slug}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Keywords:</span>
                          <span className="ml-2 text-gray-900">{post.blog_meta.keywords}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Obsah článku</h4>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: post.markdown_body.substring(0, 2000) }}
                        />
                        {post.markdown_body.length > 2000 && (
                          <p className="text-sm text-gray-500 mt-4">... (zkráceno)</p>
                        )}
                      </div>
                    </div>

                    {/* Cover Image */}
                    {post.image_url && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Cover image</h4>
                        <img
                          src={post.image_url}
                          alt={post.blog_meta.imageAlt}
                          className="rounded-lg max-w-md border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
