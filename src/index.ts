#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createNote } from './notes.js';
import { createReminder } from './reminder.js';
import { createEvent, listCalendars } from './calendar.js';

/**
 * Create an MCP server with capabilities for resources (to list/read notes),
 * tools (to create new notes), and prompts (to summarize notes).
 */
const server = new Server(
  {
    name: 'mcp-apple-productive-suite',
    version: '0.1.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  },
);

/**
 * Handler that lists available tools.
 * Exposes a single "create_note" tool that lets clients create new notes.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_reminder',
        description: 'Create a new reminder',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the reminder',
            },
            content: {
              type: 'string',
              description: 'Text content of the reminder',
            },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'create_note',
        description: 'Create a new note',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the note',
            },
            content: {
              type: 'string',
              description: 'Text content of the note',
            },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'create_calendar_event',
        description: 'Create a new calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            calenderName: {
              type: 'string',
              description: 'Name of the calender',
            },
            summary: {
              type: 'string',
              description: 'Summary of the event',
            },
            startDate: {
              type: 'number',
              description: 'Start date of the event',
            },
            endDate: {
              type: 'number',
              description: 'End date of the event',
            },
            alldayEvent: {
              type: 'boolean',
              description: 'Whether the event is all day',
            },
          },
          required: ['calenderName', 'summary', 'startDate', 'endDate'],
        },
      },
    ],
  };
});

/**
 * Handler for the create_note tool.
 * Creates a new note with the provided title and content, and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'create_note': {
      const title = String(request.params.arguments?.title);
      const content = String(request.params.arguments?.content);
      if (!title || !content) {
        throw new Error('Title and content are required');
      }

      const note = await createNote(title, content);

      return {
        content: [
          {
            type: 'text',
            text: `Created note ${note.id}: ${note.name}`,
          },
        ],
      };
    }
    case 'create_reminder': {
      const title = String(request.params.arguments?.title);
      const content = String(request.params.arguments?.content);
      if (!title || !content) {
        throw new Error('Title and content are required');
      }

      const reminder = await createReminder(title, content);

      return {
        content: [
          {
            type: 'text',
            text: `Created reminder ${reminder.id}: ${reminder.name}`,
          },
        ],
      };
    }
    case 'list_calendars': {
      const calendars = await listCalendars();
      return {
        content: [
          {
            type: 'text',
            text: `Calendars: ${calendars.map((calendar) => calendar.name).join(', ')}`,
          },
        ],
      };
    }
    case 'create_calendar_event': {
      const calenderName = String(request.params.arguments?.calenderName);
      const summary = String(request.params.arguments?.summary);
      const startDate = Number(request.params.arguments?.startDate);
      const endDate = Number(request.params.arguments?.endDate);
      const alldayEvent = Boolean(request.params.arguments?.alldayEvent);
      if (!calenderName || !summary || !startDate || !endDate) {
        throw new Error('Calender name, summary, startDate, and endDate are required');
      }

      const event = await createEvent(calenderName, summary, startDate, endDate, alldayEvent);

      return {
        content: [
          {
            type: 'text',
            text: `Created event ${event.uid}: ${event.summary}`,
          },
        ],
      };
    }

    default:
      throw new Error('Unknown tool');
  }
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
