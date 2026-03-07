#!/usr/bin/env node

/**
 * MCP Server for Hugo Orchestrator
 * Provides tools for content generation, feedback, KB management, and project settings
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_BASE = process.env.ORCHESTRATOR_API_URL || 'http://localhost:3000';

const server = new Server(
  {
    name: 'hugo-orchestrator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Content Generation
      {
        name: 'generate_content',
        description: 'Generate new content for a project. Returns queue item with AI-generated text and visuals.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
            content_type: { 
              type: 'string', 
              description: 'Content type (educational, soft_sell, hard_sell, story, data_insight, etc.)',
              enum: ['educational', 'soft_sell', 'hard_sell', 'story', 'data_insight', 'how_to', 'case_study', 'opinion', 'behind_scenes', 'local_news', 'quick_tip', 'poll', 'quote', 'milestone', 'user_content', 'seasonal', 'trend', 'comparison', 'myth_buster', 'list']
            },
            platforms: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Target platforms (facebook, instagram, linkedin, x, etc.)'
            },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'get_queue',
        description: 'Get content queue items. Filter by status (review, approved, draft, sent, scheduled).',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'Filter by status', enum: ['review', 'approved', 'draft', 'sent', 'scheduled'] },
            project_id: { type: 'string', description: 'Filter by project UUID' },
          },
        },
      },
      {
        name: 'approve_post',
        description: 'Approve a post from review queue. Moves to approved status.',
        inputSchema: {
          type: 'object',
          properties: {
            post_id: { type: 'string', description: 'Queue item UUID' },
            platforms: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Selected platforms for publishing'
            },
          },
          required: ['post_id'],
        },
      },
      {
        name: 'reject_post',
        description: 'Reject/delete a post from queue.',
        inputSchema: {
          type: 'object',
          properties: {
            post_id: { type: 'string', description: 'Queue item UUID' },
          },
          required: ['post_id'],
        },
      },
      {
        name: 'edit_post',
        description: 'Edit post text content. Provides feedback to Hugo for learning.',
        inputSchema: {
          type: 'object',
          properties: {
            post_id: { type: 'string', description: 'Queue item UUID' },
            text_content: { type: 'string', description: 'New text content' },
            feedback_note: { type: 'string', description: 'Optional feedback for Hugo (e.g., "Zkrátit hook", "Víc dat")' },
          },
          required: ['post_id', 'text_content'],
        },
      },
      {
        name: 'publish_post',
        description: 'Publish approved post to social networks via getLate.dev.',
        inputSchema: {
          type: 'object',
          properties: {
            post_ids: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Array of queue item UUIDs to publish'
            },
            scheduled_for: { type: 'string', description: 'Optional ISO 8601 datetime for scheduling' },
          },
          required: ['post_ids'],
        },
      },

      // Feedback & Learning
      {
        name: 'send_feedback',
        description: 'Send feedback to Hugo for learning. Helps improve future content generation.',
        inputSchema: {
          type: 'object',
          properties: {
            post_id: { type: 'string', description: 'Queue item UUID' },
            feedback_type: { 
              type: 'string', 
              description: 'Type of feedback',
              enum: ['tone', 'length', 'hook', 'cta', 'data', 'creativity', 'platform_fit', 'other']
            },
            feedback_text: { type: 'string', description: 'Detailed feedback' },
            original_text: { type: 'string', description: 'Original AI-generated text' },
            edited_text: { type: 'string', description: 'Your edited version' },
          },
          required: ['post_id', 'feedback_type', 'feedback_text'],
        },
      },

      // Knowledge Base Management
      {
        name: 'get_project_kb',
        description: 'Get all knowledge base entries for a project.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'add_kb_entry',
        description: 'Add a new knowledge base entry to a project.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
            category: { 
              type: 'string', 
              description: 'Entry category',
              enum: ['product', 'audience', 'usp', 'faq', 'process', 'pricing', 'team', 'case_study', 'testimonial', 'competitor', 'industry', 'other']
            },
            title: { type: 'string', description: 'Entry title' },
            content: { type: 'string', description: 'Entry content (markdown supported)' },
            is_active: { type: 'boolean', description: 'Is entry active (default: true)' },
          },
          required: ['project_id', 'category', 'title', 'content'],
        },
      },
      {
        name: 'update_kb_entry',
        description: 'Update an existing knowledge base entry.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
            entry_id: { type: 'string', description: 'KB entry UUID' },
            category: { type: 'string', description: 'Entry category' },
            title: { type: 'string', description: 'Entry title' },
            content: { type: 'string', description: 'Entry content' },
            is_active: { type: 'boolean', description: 'Is entry active' },
          },
          required: ['project_id', 'entry_id'],
        },
      },
      {
        name: 'delete_kb_entry',
        description: 'Delete a knowledge base entry.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
            entry_id: { type: 'string', description: 'KB entry UUID to delete' },
          },
          required: ['project_id', 'entry_id'],
        },
      },

      // Prompt Management
      {
        name: 'get_project_prompts',
        description: 'Get project custom prompts and tone of voice settings.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'update_project_prompts',
        description: 'Update project custom prompts, tone of voice, and guardrails.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
            tone_of_voice: { type: 'string', description: 'Tone of voice description' },
            custom_system_prompt: { type: 'string', description: 'Custom system prompt override' },
            guardrails: { type: 'array', items: { type: 'string' }, description: 'Content guardrails' },
          },
          required: ['project_id'],
        },
      },

      // Project Settings
      {
        name: 'get_project',
        description: 'Get project details including settings, platforms, and orchestrator config.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID or slug' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'update_project_settings',
        description: 'Update project settings (platforms, posting schedule, content mix, semantic anchors, constraints, mood settings, style rules, agent_settings incl. rss_feeds).',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
            platforms: { type: 'array', items: { type: 'string' }, description: 'Enabled platforms' },
            semantic_anchors: { type: 'array', items: { type: 'string' }, description: 'Semantic anchors (keywords for content)' },
            constraints: { 
              type: 'object', 
              description: 'Content constraints (forbidden_topics, mandatory_terms, max_hashtags)'
            },
            mood_settings: { 
              type: 'object', 
              description: 'Mood settings (tone, energy, style)'
            },
            content_mix: {
              type: 'object',
              description: 'Content mix ratios (educational, soft_sell, hard_sell) - values 0-1'
            },
            style_rules: {
              type: 'object',
              description: 'Style rules (start_with_question, max_bullets, no_hashtags_in_text, max_length)'
            },
            orchestrator_config: { 
              type: 'object', 
              description: 'Orchestrator configuration (posting_times, visual_quality, etc.)'
            },
            agent_settings: {
              type: 'object',
              description: 'Agent settings including rss_feeds array. Example: { rss_feeds: [{ url: "https://...", label: "Blog" }], contextual_pulse: true }'
            },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'create_project',
        description: 'Create a new project with initial configuration, starter prompts, and knowledge base.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Project name' },
            slug: { type: 'string', description: 'URL-friendly slug (lowercase, no spaces)' },
            description: { type: 'string', description: 'Project description' },
            platforms: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Enabled platforms (facebook, instagram, linkedin, x, etc.)'
            },
            semantic_anchors: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Semantic anchors (keywords for content)'
            },
            mood_settings: { 
              type: 'object', 
              description: 'Mood settings (tone, energy, style)'
            },
            constraints: { 
              type: 'object', 
              description: 'Content constraints (forbidden_topics, mandatory_terms, max_hashtags)'
            },
          },
          required: ['name', 'slug'],
        },
      },
      {
        name: 'list_projects',
        description: 'List all projects with basic info.',
        inputSchema: {
          type: 'object',
          properties: {
            active_only: { type: 'boolean', description: 'Filter only active projects' },
          },
        },
      },

      // Media Library
      {
        name: 'get_project_media',
        description: 'Get media assets for a project from storage.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
            file_type: { type: 'string', description: 'Filter by type', enum: ['image', 'video', 'document', 'graphic'] },
          },
          required: ['project_id'],
        },
      },

      // Agent Tasks
      {
        name: 'create_agent_task',
        description: 'Create a task for the agent orchestrator (generate, ab_variants, publish, etc.).',
        inputSchema: {
          type: 'object',
          properties: {
            task_type: { 
              type: 'string', 
              description: 'Task type',
              enum: ['generate_content', 'ab_variants', 'publish', 'retry', 'imagen_generate']
            },
            project_id: { type: 'string', description: 'Project UUID' },
            payload: { type: 'object', description: 'Task-specific payload' },
            priority: { type: 'number', description: 'Priority (1-10, default 5)' },
          },
          required: ['task_type', 'project_id'],
        },
      },
      {
        name: 'get_agent_log',
        description: 'Get recent agent activity logs for debugging.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Filter by project UUID' },
            limit: { type: 'number', description: 'Number of logs to return (default 50)' },
          },
        },
      },

      // AIO (AI Optimization) Management
      {
        name: 'get_aio_status',
        description: 'Get AIO status for a project (sites, entity profiles, scores, recent injections).',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'trigger_aio_injection',
        description: 'Trigger AIO schema injection to GitHub repository (llms.txt, ai-data.json, schema.org).',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID to inject (or omit for all projects)' },
          },
        },
      },
      {
        name: 'trigger_aio_audit',
        description: 'Trigger AIO visibility audit task (checks search engine visibility, schema validation).',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
            audit_type: { 
              type: 'string', 
              description: 'Audit type',
              enum: ['visibility', 'entity']
            },
          },
          required: ['project_id'],
        },
      },

      // AIO Visibility Prompts Management
      {
        name: 'get_aio_prompts',
        description: 'Get AI Visibility test prompts for a project.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'add_aio_prompt',
        description: 'Add new AI Visibility test prompt for a project.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
            prompt: { type: 'string', description: 'Test prompt text (e.g., "Best real estate agent in Prague")' },
            category: { 
              type: 'string', 
              description: 'Prompt category',
              enum: ['how_to', 'pricing', 'recommendation', 'comparison', 'purchase_intent']
            },
          },
          required: ['project_id', 'prompt'],
        },
      },
      {
        name: 'update_aio_prompt',
        description: 'Update AI Visibility test prompt (activate/deactivate or change text).',
        inputSchema: {
          type: 'object',
          properties: {
            prompt_id: { type: 'string', description: 'Prompt UUID' },
            is_active: { type: 'boolean', description: 'Activate or deactivate prompt' },
            prompt: { type: 'string', description: 'New prompt text (optional)' },
          },
          required: ['prompt_id'],
        },
      },
      {
        name: 'delete_aio_prompt',
        description: 'Delete AI Visibility test prompt.',
        inputSchema: {
          type: 'object',
          properties: {
            prompt_id: { type: 'string', description: 'Prompt UUID' },
          },
          required: ['prompt_id'],
        },
      },

      // Entity Profiles (AIO Identity)
      {
        name: 'list_entity_profiles',
        description: 'List AIO entity profiles (all or for a specific project).',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Filter by project UUID (optional)' },
          },
        },
      },
      {
        name: 'create_entity_profile',
        description: 'Create an AIO entity profile for a project (official name, description, keywords, sameAs links).',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
            official_name: { type: 'string', description: 'Official entity name (e.g., "David Choc")' },
            short_description: { type: 'string', description: 'Short description (1-2 sentences)' },
            long_description: { type: 'string', description: 'Detailed description' },
            category: { type: 'string', description: 'Entity category (e.g., Person, Organization, Service, Product, LocalBusiness)' },
            keywords: { type: 'array', items: { type: 'string' }, description: 'Keywords for AI identity' },
            same_as: { type: 'array', items: { type: 'string' }, description: 'sameAs URLs (LinkedIn, Facebook, Wikidata, Firmy.cz, etc.)' },
          },
          required: ['project_id', 'official_name'],
        },
      },
      {
        name: 'update_entity_profile',
        description: 'Update an existing AIO entity profile.',
        inputSchema: {
          type: 'object',
          properties: {
            profile_id: { type: 'string', description: 'Entity profile UUID' },
            official_name: { type: 'string', description: 'Official entity name (optional)' },
            short_description: { type: 'string', description: 'Short description (optional)' },
            long_description: { type: 'string', description: 'Detailed description (optional)' },
            category: { type: 'string', description: 'Entity category (optional)' },
            keywords: { type: 'array', items: { type: 'string' }, description: 'Keywords (optional)' },
            same_as: { type: 'array', items: { type: 'string' }, description: 'sameAs URLs (optional)' },
          },
          required: ['profile_id'],
        },
      },
      {
        name: 'delete_entity_profile',
        description: 'Delete an AIO entity profile.',
        inputSchema: {
          type: 'object',
          properties: {
            profile_id: { type: 'string', description: 'Entity profile UUID' },
          },
          required: ['profile_id'],
        },
      },

      // RSS Sources (Contextual Pulse)
      {
        name: 'list_rss_sources',
        description: 'List RSS sources for a project (Contextual Pulse).',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'add_rss_source',
        description: 'Add RSS source to a project for Contextual Pulse news monitoring.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
            name: { type: 'string', description: 'Source name (e.g., "HypoIndex")' },
            url: { type: 'string', description: 'RSS feed URL' },
            category: { 
              type: 'string', 
              description: 'Feed category',
              enum: ['general', 'demographics', 'economics', 'real_estate', 'finance', 'legislation', 'technology']
            },
            fetch_interval_hours: { type: 'number', description: 'Fetch interval in hours (default 6)' },
          },
          required: ['project_id', 'name', 'url'],
        },
      },
      {
        name: 'update_rss_source',
        description: 'Update an RSS source (change name, URL, category, or interval).',
        inputSchema: {
          type: 'object',
          properties: {
            source_id: { type: 'string', description: 'RSS source UUID' },
            name: { type: 'string', description: 'New source name (optional)' },
            url: { type: 'string', description: 'New RSS feed URL (optional)' },
            category: { type: 'string', description: 'New category (optional)' },
            is_active: { type: 'boolean', description: 'Activate/deactivate source (optional)' },
          },
          required: ['source_id'],
        },
      },
      {
        name: 'delete_rss_source',
        description: 'Delete an RSS source.',
        inputSchema: {
          type: 'object',
          properties: {
            source_id: { type: 'string', description: 'RSS source UUID' },
          },
          required: ['source_id'],
        },
      },
      {
        name: 'fetch_rss_source',
        description: 'Manually trigger RSS feed fetch for a source.',
        inputSchema: {
          type: 'object',
          properties: {
            source_id: { type: 'string', description: 'RSS source UUID' },
          },
          required: ['source_id'],
        },
      },

      // Blog System
      {
        name: 'list_blog_posts',
        description: 'List blog posts from content queue (generated articles for review/publishing).',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Filter by project UUID (optional)' },
            status: { type: 'string', description: 'Filter by status: review, approved, sent (optional)' },
          },
        },
      },
      {
        name: 'generate_blog_post',
        description: 'Generate a new blog article using AI (Gemini). Uses project KB, entity profile, and RSS pulse for context. Saves to content_queue with status "review".',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
            topic: { type: 'string', description: 'Article topic (optional — AI picks from KB/RSS if not provided)' },
            category: { type: 'string', description: 'Category ID e.g., "tips", "market", "legal", "guide" (optional)' },
            post_format: { type: 'string', enum: ['html', 'markdown'], description: 'Output format (default: from project blog_config or "html")' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'publish_blog_to_github',
        description: 'Publish an approved blog post to the project GitHub repo. Pushes post file + updates posts.json + optional cover image.',
        inputSchema: {
          type: 'object',
          properties: {
            queue_id: { type: 'string', description: 'Content queue item UUID (must be a blog post)' },
          },
          required: ['queue_id'],
        },
      },

      // Publishing Management
      {
        name: 'bulk_approve_posts',
        description: 'Bulk approve posts in review queue (by project, score threshold, or all).',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Filter by project UUID (optional)' },
            min_score: { type: 'number', description: 'Minimum AI score to approve (optional, default 7.0)' },
            limit: { type: 'number', description: 'Max posts to approve (optional, default 50)' },
          },
        },
      },
      {
        name: 'publish_posts_now',
        description: 'Immediately publish approved posts without waiting for cron (bypasses hourly schedule).',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Filter by project UUID (optional - publishes all if omitted)' },
            post_ids: { type: 'array', items: { type: 'string' }, description: 'Specific post IDs to publish (optional)' },
          },
        },
      },
    ],
  };
});

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let response;
    
    switch (name) {
      case 'generate_content': {
        response = await fetch(`${API_BASE}/api/agent/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_type: 'generate_content',
            project_id: args.project_id,
            payload: {
              content_type: args.content_type,
              platforms: args.platforms,
            },
          }),
        });
        break;
      }

      case 'get_queue': {
        const params = new URLSearchParams();
        if (args.status) params.append('status', args.status);
        if (args.project_id) params.append('projectId', args.project_id);
        response = await fetch(`${API_BASE}/api/queue?${params}`);
        break;
      }

      case 'approve_post': {
        response = await fetch(`${API_BASE}/api/queue/${args.post_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'approved',
            platforms: args.platforms,
          }),
        });
        break;
      }

      case 'reject_post': {
        response = await fetch(`${API_BASE}/api/queue`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [args.post_id] }),
        });
        break;
      }

      case 'edit_post': {
        // First update the post
        response = await fetch(`${API_BASE}/api/queue/${args.post_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text_content: args.text_content }),
        });
        
        // Then send feedback if provided
        if (args.feedback_note) {
          await fetch(`${API_BASE}/api/agent/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              post_id: args.post_id,
              feedback_note: args.feedback_note,
              edited_text: args.text_content,
            }),
          });
        }
        break;
      }

      case 'publish_post': {
        response = await fetch(`${API_BASE}/api/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids: args.post_ids,
            scheduledFor: args.scheduled_for,
          }),
        });
        break;
      }

      case 'send_feedback': {
        response = await fetch(`${API_BASE}/api/agent/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args),
        });
        break;
      }

      case 'get_project_kb': {
        response = await fetch(`${API_BASE}/api/projects/${args.project_id}/kb`);
        break;
      }

      case 'add_kb_entry': {
        response = await fetch(`${API_BASE}/api/projects/${args.project_id}/kb`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: args.category,
            title: args.title,
            content: args.content,
            is_active: args.is_active !== undefined ? args.is_active : true,
          }),
        });
        break;
      }

      case 'update_kb_entry': {
        const updateData = {};
        if (args.category) updateData.category = args.category;
        if (args.title) updateData.title = args.title;
        if (args.content) updateData.content = args.content;
        if (args.is_active !== undefined) updateData.is_active = args.is_active;
        
        response = await fetch(`${API_BASE}/api/projects/${args.project_id}/kb`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kbId: args.entry_id,
            ...updateData,
          }),
        });
        break;
      }

      case 'delete_kb_entry': {
        response = await fetch(`${API_BASE}/api/projects/${args.project_id}/kb`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kbId: args.entry_id,
          }),
        });
        break;
      }

      case 'get_project_prompts': {
        response = await fetch(`${API_BASE}/api/projects/${args.project_id}/prompts`);
        break;
      }

      case 'update_project_prompts': {
        response = await fetch(`${API_BASE}/api/projects/${args.project_id}/prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args),
        });
        break;
      }

      case 'get_project': {
        response = await fetch(`${API_BASE}/api/projects/${args.project_id}`);
        break;
      }

      case 'update_project_settings': {
        const updateData = {};
        if (args.platforms) updateData.platforms = args.platforms;
        if (args.semantic_anchors) updateData.semantic_anchors = args.semantic_anchors;
        if (args.constraints) updateData.constraints = args.constraints;
        if (args.mood_settings) updateData.mood_settings = args.mood_settings;
        if (args.content_mix) updateData.content_mix = args.content_mix;
        if (args.style_rules) updateData.style_rules = args.style_rules;
        if (args.orchestrator_config) updateData.orchestrator_config = args.orchestrator_config;

        // Merge agent_settings with existing to avoid overwriting other fields
        if (args.agent_settings) {
          const currentRes = await fetch(`${API_BASE}/api/projects/${args.project_id}`);
          if (currentRes.ok) {
            const current = await currentRes.json();
            updateData.agent_settings = { ...(current.agent_settings || {}), ...args.agent_settings };
          } else {
            updateData.agent_settings = args.agent_settings;
          }
        }
        
        response = await fetch(`${API_BASE}/api/projects/${args.project_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });
        break;
      }

      case 'create_project': {
        response = await fetch(`${API_BASE}/api/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: args.name,
            slug: args.slug,
            description: args.description,
            platforms: args.platforms || ['linkedin'],
            semantic_anchors: args.semantic_anchors || [],
            mood_settings: args.mood_settings || { tone: 'professional', energy: 'medium', style: 'informative' },
            constraints: args.constraints || { forbidden_topics: [], mandatory_terms: [], max_hashtags: 5 },
          }),
        });
        break;
      }

      case 'list_projects': {
        const params = new URLSearchParams();
        if (args.active_only) params.append('active', 'true');
        response = await fetch(`${API_BASE}/api/projects?${params}`);
        break;
      }

      case 'get_project_media': {
        const params = new URLSearchParams();
        if (args.file_type) params.append('type', args.file_type);
        response = await fetch(`${API_BASE}/api/media/project/${args.project_id}?${params}`);
        break;
      }

      case 'create_agent_task': {
        response = await fetch(`${API_BASE}/api/agent/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_type: args.task_type,
            project_id: args.project_id,
            payload: args.payload,
            priority: args.priority || 5,
          }),
        });
        break;
      }

      case 'get_agent_log': {
        const params = new URLSearchParams();
        if (args.project_id) params.append('project_id', args.project_id);
        if (args.limit) params.append('limit', String(args.limit));
        response = await fetch(`${API_BASE}/api/agent/log?${params}`);
        break;
      }

      case 'get_aio_status': {
        const params = new URLSearchParams();
        params.append('projectId', args.project_id);
        response = await fetch(`${API_BASE}/api/agent/aio?${params}`);
        break;
      }

      case 'trigger_aio_injection': {
        const body = {};
        if (args.project_id) body.projectId = args.project_id;
        response = await fetch(`${API_BASE}/api/agent/aio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        break;
      }

      case 'trigger_aio_audit': {
        const auditAction = args.audit_type === 'entity' ? 'entity_audit' : 'audit';
        response = await fetch(`${API_BASE}/api/agent/aio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: auditAction,
            projectId: args.project_id,
          }),
        });
        break;
      }

      case 'get_aio_prompts': {
        const params = new URLSearchParams();
        params.append('projectId', args.project_id);
        response = await fetch(`${API_BASE}/api/agent/aio/prompts?${params}`);
        break;
      }

      case 'add_aio_prompt': {
        response = await fetch(`${API_BASE}/api/agent/aio/prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: args.project_id,
            prompt: args.prompt,
            category: args.category || 'purchase_intent',
          }),
        });
        break;
      }

      case 'update_aio_prompt': {
        const updateFields = { id: args.prompt_id };
        if (args.is_active !== undefined) updateFields.is_active = args.is_active;
        if (args.prompt) updateFields.prompt = args.prompt;
        response = await fetch(`${API_BASE}/api/agent/aio/prompts`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateFields),
        });
        break;
      }

      case 'delete_aio_prompt': {
        const params = new URLSearchParams();
        params.append('id', args.prompt_id);
        response = await fetch(`${API_BASE}/api/agent/aio/prompts?${params}`, {
          method: 'DELETE',
        });
        break;
      }

      case 'list_entity_profiles': {
        const params = new URLSearchParams();
        if (args.project_id) params.append('project_id', args.project_id);
        response = await fetch(`${API_BASE}/api/agent/aio/entity?${params}`);
        break;
      }

      case 'create_entity_profile': {
        const body = {
          project_id: args.project_id,
          official_name: args.official_name,
        };
        if (args.short_description) body.short_description = args.short_description;
        if (args.long_description) body.long_description = args.long_description;
        if (args.category) body.category = args.category;
        if (args.keywords) body.keywords = args.keywords;
        if (args.same_as) body.same_as = args.same_as;
        response = await fetch(`${API_BASE}/api/agent/aio/entity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        break;
      }

      case 'update_entity_profile': {
        const updateFields = { id: args.profile_id };
        if (args.official_name) updateFields.official_name = args.official_name;
        if (args.short_description) updateFields.short_description = args.short_description;
        if (args.long_description) updateFields.long_description = args.long_description;
        if (args.category) updateFields.category = args.category;
        if (args.keywords) updateFields.keywords = args.keywords;
        if (args.same_as) updateFields.same_as = args.same_as;
        response = await fetch(`${API_BASE}/api/agent/aio/entity`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateFields),
        });
        break;
      }

      case 'delete_entity_profile': {
        const params = new URLSearchParams();
        params.append('id', args.profile_id);
        response = await fetch(`${API_BASE}/api/agent/aio/entity?${params}`, {
          method: 'DELETE',
        });
        break;
      }

      case 'list_rss_sources': {
        const params = new URLSearchParams();
        params.append('project_id', args.project_id);
        response = await fetch(`${API_BASE}/api/rss?${params}`);
        break;
      }

      case 'add_rss_source': {
        response = await fetch(`${API_BASE}/api/rss`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: args.project_id,
            name: args.name,
            url: args.url,
            category: args.category || 'general',
            fetch_interval_hours: args.fetch_interval_hours || 6,
          }),
        });
        break;
      }

      case 'update_rss_source': {
        const updateFields = {};
        if (args.name) updateFields.name = args.name;
        if (args.url) updateFields.url = args.url;
        if (args.category) updateFields.category = args.category;
        if (args.is_active !== undefined) updateFields.is_active = args.is_active;
        response = await fetch(`${API_BASE}/api/rss/${args.source_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateFields),
        });
        break;
      }

      case 'delete_rss_source': {
        response = await fetch(`${API_BASE}/api/rss/${args.source_id}`, {
          method: 'DELETE',
        });
        break;
      }

      case 'fetch_rss_source': {
        response = await fetch(`${API_BASE}/api/rss/${args.source_id}`, {
          method: 'POST',
        });
        break;
      }

      case 'list_blog_posts': {
        const params = new URLSearchParams();
        if (args.project_id) params.append('project_id', args.project_id);
        if (args.status) params.append('status', args.status);
        response = await fetch(`${API_BASE}/api/blog?${params}`);
        break;
      }

      case 'generate_blog_post': {
        const body = { project_id: args.project_id };
        if (args.topic) body.topic = args.topic;
        if (args.category) body.category = args.category;
        if (args.post_format) body.post_format = args.post_format;
        response = await fetch(`${API_BASE}/api/blog/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        break;
      }

      case 'publish_blog_to_github': {
        response = await fetch(`${API_BASE}/api/blog/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queue_id: args.queue_id }),
        });
        break;
      }

      case 'bulk_approve_posts': {
        const params = new URLSearchParams();
        if (args.project_id) params.append('projectId', args.project_id);
        if (args.min_score) params.append('minScore', args.min_score.toString());
        if (args.limit) params.append('limit', args.limit.toString());
        response = await fetch(`${API_BASE}/api/queue/bulk-approve?${params}`, {
          method: 'POST',
        });
        break;
      }

      case 'publish_posts_now': {
        const body = {};
        if (args.project_id) body.project_id = args.project_id;
        if (args.post_ids) body.ids = args.post_ids;
        response = await fetch(`${API_BASE}/api/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(data, null, 2),
      }],
    };

  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Hugo Orchestrator MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
