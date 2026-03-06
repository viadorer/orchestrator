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
        description: 'Get project knowledge base content.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
          },
          required: ['project_id'],
        },
      },
      {
        name: 'update_project_kb',
        description: 'Update project knowledge base. Add facts, update description, modify safe/ban lists.',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
            kb_facts: { type: 'string', description: 'Knowledge base facts (markdown)' },
            safe_list: { type: 'array', items: { type: 'string' }, description: 'Safe topics/keywords' },
            ban_list: { type: 'array', items: { type: 'string' }, description: 'Banned topics/keywords' },
          },
          required: ['project_id'],
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
        description: 'Update project settings (platforms, posting schedule, content mix, etc.).',
        inputSchema: {
          type: 'object',
          properties: {
            project_id: { type: 'string', description: 'Project UUID' },
            platforms: { type: 'array', items: { type: 'string' }, description: 'Enabled platforms' },
            orchestrator_config: { 
              type: 'object', 
              description: 'Orchestrator configuration (posting_times, content_mix, visual_quality, etc.)'
            },
          },
          required: ['project_id'],
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
        response = await fetch(`${API_BASE}/api/projects/${args.project_id}`);
        const project = await response.json();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              kb_facts: project.kb_facts,
              safe_list: project.safe_list,
              ban_list: project.ban_list,
            }, null, 2),
          }],
        };
      }

      case 'update_project_kb': {
        response = await fetch(`${API_BASE}/api/projects/${args.project_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kb_facts: args.kb_facts,
            safe_list: args.safe_list,
            ban_list: args.ban_list,
          }),
        });
        break;
      }

      case 'get_project_prompts': {
        response = await fetch(`${API_BASE}/api/projects/${args.project_id}`);
        const project = await response.json();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              tone_of_voice: project.tone_of_voice,
              custom_system_prompt: project.custom_system_prompt,
              guardrails: project.guardrails,
            }, null, 2),
          }],
        };
      }

      case 'update_project_prompts': {
        response = await fetch(`${API_BASE}/api/projects/${args.project_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tone_of_voice: args.tone_of_voice,
            custom_system_prompt: args.custom_system_prompt,
            guardrails: args.guardrails,
          }),
        });
        break;
      }

      case 'get_project': {
        response = await fetch(`${API_BASE}/api/projects/${args.project_id}`);
        break;
      }

      case 'update_project_settings': {
        response = await fetch(`${API_BASE}/api/projects/${args.project_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platforms: args.platforms,
            orchestrator_config: args.orchestrator_config,
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
        if (args.project_id) params.append('projectId', args.project_id);
        params.append('limit', String(args.limit || 50));
        response = await fetch(`${API_BASE}/api/agent/log?${params}`);
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
