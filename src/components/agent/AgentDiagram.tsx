'use client';

import {
  Bot, Clock, Database, Brain, FileText, Image, Rss,
  Zap, CheckCircle, Send, ArrowDown, ArrowRight, RefreshCw,
  Sparkles, Shield, BarChart3, BookOpen, MessageCircle,
  Calendar, TrendingUp, Eye, Lightbulb,
} from 'lucide-react';

/**
 * Visual diagram of Hugo Agent architecture and flow.
 * Shows how the autonomous agent operates, what data it uses,
 * and how tasks flow through the system.
 */

function DiagramNode({
  icon: Icon,
  label,
  sublabel,
  color,
  pulse,
  className = '',
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  color: string;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <div className={`relative w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
        {pulse && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 animate-pulse border-2 border-slate-950" />
        )}
      </div>
      <span className="text-xs font-medium text-white text-center leading-tight">{label}</span>
      {sublabel && <span className="text-[10px] text-slate-500 text-center leading-tight">{sublabel}</span>}
    </div>
  );
}

function Arrow({ direction = 'down', label }: { direction?: 'down' | 'right'; label?: string }) {
  return (
    <div className={`flex ${direction === 'down' ? 'flex-col' : 'flex-row'} items-center gap-0.5`}>
      {label && <span className="text-[9px] text-slate-600 whitespace-nowrap">{label}</span>}
      {direction === 'down' ? (
        <ArrowDown className="w-4 h-4 text-slate-600" />
      ) : (
        <ArrowRight className="w-4 h-4 text-slate-600" />
      )}
    </div>
  );
}

function SectionCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900/50 border border-slate-800 rounded-xl p-4 ${className}`}>
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  );
}

export function AgentDiagram() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Hugo Agent – Architektura</h2>
          <p className="text-xs text-slate-400">Autonomni AI orchestrator pro tvorbu obsahu</p>
        </div>
      </div>

      {/* Main Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Column 1: Triggers */}
        <SectionCard title="1. Spouštěče">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Cron Job</p>
                <p className="text-[11px] text-slate-400">Každou hodinu (Vercel Cron)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <Zap className="w-5 h-5 text-violet-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Manuální spuštění</p>
                <p className="text-[11px] text-slate-400">UI tlačítko v Agent panelu</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <Rss className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">RSS Cron</p>
                <p className="text-[11px] text-slate-400">Každých 6 hodin</p>
              </div>
            </div>

            <Arrow direction="down" label="spouští" />

            <div className="p-3 rounded-lg bg-violet-600/10 border border-violet-500/30">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-violet-300">Auto-Schedule</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1 ml-6">
                <li>Zkontroluje orchestrator_config</li>
                <li>Respektuje posting window</li>
                <li>Hlídá denní limity</li>
                <li>Vytváří tasky per projekt</li>
              </ul>
            </div>
          </div>
        </SectionCard>

        {/* Column 2: Data Sources */}
        <SectionCard title="2. Datové zdroje (per projekt)">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
              <BookOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-white">Knowledge Base</p>
                <p className="text-[10px] text-slate-500">Fakta o projektu</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
              <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-white">Prompty</p>
                <p className="text-[10px] text-slate-500">Šablony per kategorie</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
              <TrendingUp className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-white">Nedávné posty</p>
                <p className="text-[10px] text-slate-500">Dedup + statistiky</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
              <Rss className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-white">RSS novinky</p>
                <p className="text-[10px] text-slate-500">AI shrnutí + relevance</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
              <Brain className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-white">Agent Memory</p>
                <p className="text-[10px] text-slate-500">Naučené poznatky</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
              <Image className="w-4 h-4 text-pink-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-white">Media Library</p>
                <p className="text-[10px] text-slate-500">AI tagy + embedding</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
              <MessageCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-white">Feedback</p>
                <p className="text-[10px] text-slate-500">Lidské úpravy</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
              <Database className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-medium text-white">Config</p>
                <p className="text-[10px] text-slate-500">orchestrator_config</p>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-[10px] text-blue-300 text-center">Vše z Supabase DB per projekt, nic hardcoded</p>
          </div>
        </SectionCard>

        {/* Column 3: Task Types */}
        <SectionCard title="3. Typy úkolů">
          <div className="space-y-2">
            {[
              { icon: Sparkles, label: 'Generovat post', desc: 'Text + skóre + editor review + vizuál', color: 'text-violet-400' },
              { icon: Lightbulb, label: 'Navrhnout témata', desc: '→ vytvoří generate_content tasky', color: 'text-amber-400' },
              { icon: Calendar, label: 'Plán na týden', desc: '→ naplánuje tasky na 5 dní', color: 'text-cyan-400' },
              { icon: BookOpen, label: 'Analýza KB', desc: '→ uloží mezery do memory', color: 'text-blue-400' },
              { icon: BookOpen, label: 'Obohatit KB', desc: '→ AI navrhne nové KB záznamy', color: 'text-blue-400' },
              { icon: BarChart3, label: 'Analýza mixu', desc: '→ korekce do memory', color: 'text-emerald-400' },
              { icon: TrendingUp, label: 'Report výkonu', desc: '→ insights do memory', color: 'text-green-400' },
              { icon: TrendingUp, label: 'Engagement learning', desc: '→ učí se z reálných dat', color: 'text-green-400' },
              { icon: Clock, label: 'Optimalizace časů', desc: '→ doporučení do memory', color: 'text-orange-400' },
              { icon: Shield, label: 'Sentiment check', desc: '→ bezpečnost do memory', color: 'text-red-400' },
              { icon: Shield, label: 'Audit promptů', desc: '→ efektivita prompt šablon', color: 'text-red-400' },
              { icon: Shield, label: 'Cross-project dedup', desc: '→ duplicity napříč projekty', color: 'text-red-400' },
              { icon: Sparkles, label: 'A/B varianty', desc: '→ alternativní verze postu', color: 'text-violet-400' },
              { icon: Eye, label: 'Vizuální audit', desc: '→ konzistence vizuálů', color: 'text-indigo-400' },
              { icon: Shield, label: 'Analýza konkurence', desc: '→ diferenciátory, příležitosti', color: 'text-red-400' },
            ].map((task) => (
              <div key={task.label} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/50">
                <task.icon className={`w-4 h-4 ${task.color} flex-shrink-0`} />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-white">{task.label}</p>
                  <p className="text-[10px] text-slate-500 truncate">{task.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Processing Pipeline */}
      <SectionCard title="4. Pipeline generování postu">
        <div className="flex flex-wrap items-center gap-2 justify-center">
          {[
            { icon: BarChart3, label: '4-1-1 Rule', color: 'bg-cyan-600' },
            { icon: Database, label: 'Load Context', color: 'bg-blue-600' },
            { icon: FileText, label: 'Build Prompt', color: 'bg-violet-600' },
            { icon: Sparkles, label: 'Gemini AI', color: 'bg-purple-600' },
            { icon: Shield, label: 'Score Check', color: 'bg-amber-600' },
            { icon: Eye, label: 'Editor Review', color: 'bg-indigo-600' },
            { icon: Image, label: 'Image Review', color: 'bg-rose-600' },
            { icon: Image, label: 'Match Media', color: 'bg-pink-600' },
            { icon: CheckCircle, label: 'Content Queue', color: 'bg-emerald-600' },
            { icon: Send, label: 'Publish', color: 'bg-green-600' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <DiagramNode icon={step.icon} label={step.label} color={step.color} />
              {i < 9 && <ArrowRight className="w-3.5 h-3.5 text-slate-700 hidden sm:block" />}
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-[11px] font-medium text-amber-300 mb-1">Score &lt; 7</p>
            <p className="text-[10px] text-slate-400">Retry (max 3x, vyšší temperature)</p>
          </div>
          <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <p className="text-[11px] font-medium text-violet-300 mb-1">Editor Review</p>
            <p className="text-[10px] text-slate-400">Hugo sám opraví slabiny (2nd pass)</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[11px] font-medium text-emerald-300 mb-1">Media Match</p>
            <p className="text-[10px] text-slate-400">Library → Imagen → template fallback</p>
          </div>
        </div>
      </SectionCard>

      {/* Feedback Loop */}
      <SectionCard title="5. Autonomní cyklus (self-learning)">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: Bot, label: 'Hugo generuje', color: 'bg-violet-600' },
            { icon: Eye, label: 'Člověk reviewuje', color: 'bg-amber-600' },
            { icon: MessageCircle, label: 'Feedback + úpravy', color: 'bg-blue-600' },
            { icon: Brain, label: 'Agent Memory', color: 'bg-purple-600' },
            { icon: Sparkles, label: 'Lepší prompty', color: 'bg-emerald-600' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <DiagramNode icon={step.icon} label={step.label} color={step.color} pulse={i === 0} />
              {i < 4 && <ArrowRight className="w-3.5 h-3.5 text-slate-700 hidden sm:block" />}
            </div>
          ))}
          <div className="w-full flex justify-center mt-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
              <RefreshCw className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] text-slate-400">Cyklus se opakuje, Hugo se učí z každé iterace</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* RSS Flow */}
      <SectionCard title="6. RSS Contextual Pulse">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { icon: Rss, label: 'RSS Feeds', color: 'bg-orange-600' },
            { icon: FileText, label: 'Scrape článek', color: 'bg-slate-600' },
            { icon: Sparkles, label: 'AI shrnutí', color: 'bg-violet-600' },
            { icon: Database, label: 'Embedding', color: 'bg-blue-600' },
            { icon: TrendingUp, label: 'Relevance vs KB', color: 'bg-cyan-600' },
            { icon: CheckCircle, label: 'Do promptu', color: 'bg-emerald-600' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <DiagramNode icon={step.icon} label={step.label} color={step.color} />
              {i < 5 && <ArrowRight className="w-3.5 h-3.5 text-slate-700 hidden sm:block" />}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 text-center mt-3">
          Novinky s relevance &gt; 0.3 se automaticky zakomponují do generovaného obsahu
        </p>
      </SectionCard>
    </div>
  );
}
