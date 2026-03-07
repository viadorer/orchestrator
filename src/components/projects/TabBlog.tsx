'use client';

import { useState } from 'react';
import { Save, Sparkles } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  orchestrator_config: Record<string, unknown> | null;
}

export function TabBlog({ project, onSave }: { project: Project; onSave: (f: Partial<Project>) => void }) {
  const [config, setConfig] = useState<{
    enabled: boolean;
    post_format: 'html' | 'markdown';
    blog_path: string;
    posts_path: string;
    image_path: string;
    posts_json_path: string | null;
    posts_per_month: number;
    categories: Array<{ id: string; name: string }>;
  }>(() => {
    const blogConfig = (project.orchestrator_config as Record<string, unknown>)?.blog_config as Record<string, unknown> | undefined;
    return {
      enabled: (blogConfig?.enabled as boolean) ?? false,
      post_format: (blogConfig?.post_format as 'html' | 'markdown') ?? 'html',
      blog_path: (blogConfig?.blog_path as string) ?? 'blog',
      posts_path: (blogConfig?.posts_path as string) ?? 'blog/posts',
      image_path: (blogConfig?.image_path as string) ?? 'images/blog',
      posts_json_path: (blogConfig?.posts_json_path as string | null) ?? 'blog/posts.json',
      posts_per_month: (blogConfig?.posts_per_month as number) ?? 4,
      categories: (blogConfig?.categories as Array<{ id: string; name: string }>) ?? [
        { id: 'tips', name: 'Tipy & Triky' },
        { id: 'market', name: 'Trh & Finance' },
        { id: 'legal', name: 'Právní rady' },
        { id: 'guide', name: 'Průvodce' },
      ],
    };
  });

  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('');

  const handleSave = () => {
    const orchConfig = (project.orchestrator_config as Record<string, unknown>) || {};
    onSave({
      orchestrator_config: {
        ...orchConfig,
        blog_config: config,
      },
    });
  };

  const handleGenerate = async () => {
    if (!config.enabled) {
      alert('Blog systém není aktivní. Zapni ho nejdřív.');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          topic: topic || undefined,
          category: category || undefined,
          post_format: config.post_format,
        }),
      });

      const result = await res.json();
      
      if (res.ok) {
        alert(`✅ Článek vygenerován!\nTitulek: ${result.blogMeta.title}\nSlug: ${result.blogMeta.slug}\n\nNajdeš ho v sekci Blog`);
        setTopic('');
        setCategory('');
      } else {
        alert(`❌ Chyba: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Chyba: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800 border border-slate-700">
        <div>
          <h3 className="text-sm font-medium text-white">Blog systém</h3>
          <p className="text-xs text-slate-400 mt-1">Automatické generování blog článků přes AI</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Format */}
      <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
        <h4 className="text-sm font-medium text-white mb-3">Formát článků</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setConfig({ ...config, post_format: 'html' })}
            className={`p-3 rounded-lg border-2 transition-colors ${
              config.post_format === 'html'
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="font-medium">HTML</div>
            <div className="text-xs opacity-75 mt-1">Tailwind CSS prose</div>
          </button>
          <button
            onClick={() => setConfig({ ...config, post_format: 'markdown' })}
            className={`p-3 rounded-lg border-2 transition-colors ${
              config.post_format === 'markdown'
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="font-medium">Markdown</div>
            <div className="text-xs opacity-75 mt-1">Čistý .md formát</div>
          </button>
        </div>
      </div>

      {/* Paths */}
      <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-3">
        <h4 className="text-sm font-medium text-white">Cesty v GitHub repozitáři</h4>
        
        <div>
          <label className="block text-xs text-slate-400 mb-1">Blog složka</label>
          <input
            type="text"
            value={config.blog_path}
            onChange={(e) => setConfig({ ...config, blog_path: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="blog"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Posts složka</label>
          <input
            type="text"
            value={config.posts_path}
            onChange={(e) => setConfig({ ...config, posts_path: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="blog/posts"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Obrázky složka</label>
          <input
            type="text"
            value={config.image_path}
            onChange={(e) => setConfig({ ...config, image_path: e.target.value })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="images/blog"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">posts.json cesta (prázdné = bez JSON)</label>
          <input
            type="text"
            value={config.posts_json_path || ''}
            onChange={(e) => setConfig({ ...config, posts_json_path: (e.target.value || null) as string | null })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="blog/posts.json"
          />
        </div>
      </div>

      {/* Frequency */}
      <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
        <h4 className="text-sm font-medium text-white mb-3">Frekvence generování</h4>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="30"
            value={config.posts_per_month}
            onChange={(e) => setConfig({ ...config, posts_per_month: parseInt(e.target.value) || 4 })}
            className="w-20 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-sm text-slate-300">článků za měsíc</span>
        </div>
      </div>

      {/* Save Config */}
      <button
        onClick={handleSave}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        Uložit konfiguraci
      </button>

      {/* Generate Article */}
      <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-3">
        <h4 className="text-sm font-medium text-white">Vygenerovat článek</h4>
        
        <div>
          <label className="block text-xs text-slate-400 mb-1">Téma (volitelné)</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="AI vybere téma z KB a RSS pokud nevyplníš"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Kategorie (volitelné)</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Auto</option>
            {config.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !config.enabled}
          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Generuji...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Vygenerovat článek
            </>
          )}
        </button>
      </div>
    </div>
  );
}
