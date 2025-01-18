#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { NotesService, NoteFilter } from './notes.js';
import { RemindersService, ReminderFilter, Reminder } from './reminder.js';
import { CalendarService, CalendarEventFilter } from './calendar.js';

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
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_reminders',
        description: 'List reminders with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            completed: {
              type: 'boolean',
              description: 'Filter by completion status',
            },
            flagged: {
              type: 'boolean',
              description: 'Filter by flag status',
            },
            priority: {
              type: 'number',
              description: 'Filter by priority level',
            },
            dueAfter: {
              type: 'string',
              description: 'ISO date string to filter reminders due after this date',
            },
            dueBefore: {
              type: 'string',
              description: 'ISO date string to filter reminders due before this date',
            },
          },
        },
      },
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
        name: 'update_reminder',
        description: 'Update an existing reminder',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of the reminder to update',
            },
            name: {
              type: 'string',
              description: 'New title for the reminder',
            },
            body: {
              type: 'string',
              description: 'New content for the reminder',
            },
            completed: {
              type: 'boolean',
              description: 'New completion status',
            },
            priority: {
              type: 'number',
              description: 'New priority level',
            },
            flagged: {
              type: 'boolean',
              description: 'New flag status',
            },
            dueDate: {
              type: 'string',
              description: 'New due date (ISO date string)',
            },
            remindMeDate: {
              type: 'string',
              description: 'New reminder date (ISO date string)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'complete_reminder',
        description: 'Mark a reminder as completed',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of the reminder to complete',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'flag_reminder',
        description: 'Set the flag status of a reminder',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of the reminder',
            },
            flagged: {
              type: 'boolean',
              description: 'New flag status',
            },
          },
          required: ['id', 'flagged'],
        },
      },
      {
        name: 'set_reminder_priority',
        description: 'Set the priority of a reminder',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of the reminder',
            },
            priority: {
              type: 'number',
              description: 'New priority level (0-5)',
            },
          },
          required: ['id', 'priority'],
        },
      },
      {
        name: 'list_notes',
        description: 'Search and list notes with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Filter by note title (case-insensitive)',
            },
            body: {
              type: 'string',
              description: 'Filter by note content (case-insensitive)',
            },
            createdAfter: {
              type: 'string',
              description: 'ISO date string to filter notes created after this date',
            },
            createdBefore: {
              type: 'string',
              description: 'ISO date string to filter notes created before this date',
            },
            modifiedAfter: {
              type: 'string',
              description: 'ISO date string to filter notes modified after this date',
            },
            modifiedBefore: {
              type: 'string',
              description: 'ISO date string to filter notes modified before this date',
            },
            containerId: {
              type: 'string',
              description: 'Filter by folder ID',
            },
            containerName: {
              type: 'string',
              description: 'Filter by folder name',
            },
          },
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
            containerName: {
              type: 'string',
              description: 'Name of the folder to create the note in',
            },
          },
          required: ['title', 'content'],
        },
      },
      {
        name: 'update_note',
        description: 'Update an existing note',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of the note to update',
            },
            title: {
              type: 'string',
              description: 'New title for the note',
            },
            content: {
              type: 'string',
              description: 'New content for the note',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'list_note_folders',
        description: 'List all note folders',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_events',
        description: 'Search and list calendar events with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Filter by event title (case-insensitive)',
            },
            body: {
              type: 'string',
              description: 'Filter by event content (case-insensitive)',
            },
            startAfter: {
              type: 'string',
              description: 'ISO date string to filter events starting after this date',
            },
            startBefore: {
              type: 'string',
              description: 'ISO date string to filter events starting before this date',
            },
            endAfter: {
              type: 'string',
              description: 'ISO date string to filter events ending after this date',
            },
            endBefore: {
              type: 'string',
              description: 'ISO date string to filter events ending before this date',
            },
            calendarId: {
              type: 'string',
              description: 'Filter by calendar ID',
            },
            calendarName: {
              type: 'string',
              description: 'Filter by calendar name',
            },
            status: {
              type: 'string',
              enum: ['cancelled', 'confirmed', 'none', 'tentative'],
              description: 'Filter by event status',
            },
            location: {
              type: 'string',
              description: 'Filter by event location (case-insensitive)',
            },
          },
        },
      },
      {
        name: 'create_event',
        description: 'Create a new calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            calendarName: {
              type: 'string',
              description: 'Name of the calendar',
            },
            summary: {
              type: 'string',
              description: 'Summary of the event',
            },
            startDate: {
              type: 'string',
              description: 'ISO date string for the event start',
            },
            endDate: {
              type: 'string',
              description: 'ISO date string for the event end',
            },
            alldayEvent: {
              type: 'boolean',
              description: 'Whether the event is all day',
            },
            description: {
              type: 'string',
              description: 'Detailed description of the event',
            },
            location: {
              type: 'string',
              description: 'Location of the event',
            },
            url: {
              type: 'string',
              description: 'URL associated with the event',
            },
            recurrence: {
              type: 'string',
              description: 'Recurrence rule for the event',
            },
          },
          required: ['calendarName', 'summary', 'startDate', 'endDate'],
        },
      },
      {
        name: 'update_event',
        description: 'Update an existing calendar event',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of the event to update',
            },
            summary: {
              type: 'string',
              description: 'New summary for the event',
            },
            startDate: {
              type: 'string',
              description: 'New ISO date string for the event start',
            },
            endDate: {
              type: 'string',
              description: 'New ISO date string for the event end',
            },
            alldayEvent: {
              type: 'boolean',
              description: 'Whether the event is all day',
            },
            description: {
              type: 'string',
              description: 'New detailed description of the event',
            },
            location: {
              type: 'string',
              description: 'New location of the event',
            },
            url: {
              type: 'string',
              description: 'New URL associated with the event',
            },
            recurrence: {
              type: 'string',
              description: 'New recurrence rule for the event',
            },
            status: {
              type: 'string',
              enum: ['cancelled', 'confirmed', 'none', 'tentative'],
              description: 'New status for the event',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'find_conflicts',
        description: 'Find calendar events that conflict with a given time period',
        inputSchema: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: 'ISO date string for the period start',
            },
            endDate: {
              type: 'string',
              description: 'ISO date string for the period end',
            },
            calendarNames: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Optional list of calendar names to check',
            },
          },
          required: ['startDate', 'endDate'],
        },
      },
      {
        name: 'list_calendars',
        description: 'List all available calendars',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

/**
 * Handler for tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const remindersService = RemindersService.getInstance();
  const notesService = NotesService.getInstance();
  const calendarService = CalendarService.getInstance();

  switch (request.params.name) {
    case 'list_reminders': {
      const filter: ReminderFilter = {
        completed: request.params.arguments?.completed as boolean | undefined,
        flagged: request.params.arguments?.flagged as boolean | undefined,
        priority: request.params.arguments?.priority as number | undefined,
        dueAfter: request.params.arguments?.dueAfter ? new Date(request.params.arguments.dueAfter as string) : undefined,
        dueBefore: request.params.arguments?.dueBefore ? new Date(request.params.arguments.dueBefore as string) : undefined,
      };

      const reminders = await remindersService.listReminders(filter);
      return {
        content: [
          {
            type: 'text',
            text: `Found ${reminders.length} reminders:\n${reminders
              .map(
                (r) =>
                  `- ${r.name} (${r.completed ? 'completed' : 'pending'}${r.flagged ? ', flagged' : ''}${
                    r.priority > 0 ? `, priority ${r.priority}` : ''
                  })`,
              )
              .join('\n')}`,
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

      const reminder = await remindersService.createReminder(title, content);
      return {
        content: [
          {
            type: 'text',
            text: `Created reminder ${reminder.id}: ${reminder.name}`,
          },
        ],
      };
    }

    case 'update_reminder': {
      const id = String(request.params.arguments?.id);
      if (!id) {
        throw new Error('Reminder ID is required');
      }

      const updates: Partial<Omit<Reminder, 'id'>> = {
        name: request.params.arguments?.name as string | undefined,
        body: request.params.arguments?.body as string | undefined,
        completed: request.params.arguments?.completed as boolean | undefined,
        priority: request.params.arguments?.priority as number | undefined,
        flagged: request.params.arguments?.flagged as boolean | undefined,
        dueDate: request.params.arguments?.dueDate ? new Date(request.params.arguments.dueDate as string) : undefined,
        remindMeDate: request.params.arguments?.remindMeDate ? new Date(request.params.arguments.remindMeDate as string) : undefined,
      };

      const reminder = await remindersService.updateReminder(id, updates);
      return {
        content: [
          {
            type: 'text',
            text: `Updated reminder ${reminder.id}: ${reminder.name}`,
          },
        ],
      };
    }

    case 'complete_reminder': {
      const id = String(request.params.arguments?.id);
      if (!id) {
        throw new Error('Reminder ID is required');
      }

      const reminder = await remindersService.completeReminder(id);
      return {
        content: [
          {
            type: 'text',
            text: `Marked reminder ${reminder.id}: ${reminder.name} as completed`,
          },
        ],
      };
    }

    case 'flag_reminder': {
      const id = String(request.params.arguments?.id);
      const flagged = Boolean(request.params.arguments?.flagged);
      if (!id) {
        throw new Error('Reminder ID is required');
      }

      const reminder = await remindersService.flagReminder(id, flagged);
      return {
        content: [
          {
            type: 'text',
            text: `${flagged ? 'Flagged' : 'Unflagged'} reminder ${reminder.id}: ${reminder.name}`,
          },
        ],
      };
    }

    case 'set_reminder_priority': {
      const id = String(request.params.arguments?.id);
      const priority = Number(request.params.arguments?.priority);
      if (!id) {
        throw new Error('Reminder ID is required');
      }

      const reminder = await remindersService.setPriority(id, priority);
      return {
        content: [
          {
            type: 'text',
            text: `Set priority of reminder ${reminder.id}: ${reminder.name} to ${priority}`,
          },
        ],
      };
    }

    case 'list_notes': {
      const filter: NoteFilter = {
        name: request.params.arguments?.name as string | undefined,
        body: request.params.arguments?.body as string | undefined,
        createdAfter: request.params.arguments?.createdAfter ? new Date(request.params.arguments.createdAfter as string) : undefined,
        createdBefore: request.params.arguments?.createdBefore ? new Date(request.params.arguments.createdBefore as string) : undefined,
        modifiedAfter: request.params.arguments?.modifiedAfter ? new Date(request.params.arguments.modifiedAfter as string) : undefined,
        modifiedBefore: request.params.arguments?.modifiedBefore ? new Date(request.params.arguments.modifiedBefore as string) : undefined,
        containerId: request.params.arguments?.containerId as string | undefined,
        containerName: request.params.arguments?.containerName as string | undefined,
      };

      const notes = await notesService.listNotes(filter);
      return {
        content: [
          {
            type: 'text',
            text: `Found ${notes.length} notes:\n${notes
              .map(
                (n) =>
                  `- ${n.name} (in ${n.container.name}, created ${n.creationDate.toLocaleDateString()}, modified ${n.modificationDate.toLocaleDateString()})`,
              )
              .join('\n')}`,
          },
        ],
      };
    }

    case 'create_note': {
      const title = String(request.params.arguments?.title);
      const content = String(request.params.arguments?.content);
      const containerName = request.params.arguments?.containerName as string | undefined;

      if (!title || !content) {
        throw new Error('Title and content are required');
      }

      const note = await notesService.createNote(title, content, containerName);
      return {
        content: [
          {
            type: 'text',
            text: `Created note "${note.name}" in ${note.container.name}`,
          },
        ],
      };
    }

    case 'update_note': {
      const id = String(request.params.arguments?.id);
      if (!id) {
        throw new Error('Note ID is required');
      }

      const updates = {
        name: request.params.arguments?.title as string | undefined,
        body: request.params.arguments?.content as string | undefined,
      };

      const note = await notesService.updateNote(id, updates);
      return {
        content: [
          {
            type: 'text',
            text: `Updated note "${note.name}" in ${note.container.name}`,
          },
        ],
      };
    }

    case 'list_note_folders': {
      const folders = await notesService.listFolders();
      return {
        content: [
          {
            type: 'text',
            text: `Found ${folders.length} folders:\n${folders.map((f) => `- ${f.name}`).join('\n')}`,
          },
        ],
      };
    }

    case 'list_events': {
      const filter: CalendarEventFilter = {
        name: request.params.arguments?.name as string | undefined,
        body: request.params.arguments?.body as string | undefined,
        startAfter: request.params.arguments?.startAfter ? new Date(request.params.arguments.startAfter as string) : undefined,
        startBefore: request.params.arguments?.startBefore ? new Date(request.params.arguments.startBefore as string) : undefined,
        endAfter: request.params.arguments?.endAfter ? new Date(request.params.arguments.endAfter as string) : undefined,
        endBefore: request.params.arguments?.endBefore ? new Date(request.params.arguments.endBefore as string) : undefined,
        calendarId: request.params.arguments?.calendarId as string | undefined,
        calendarName: request.params.arguments?.calendarName as string | undefined,
        status: request.params.arguments?.status as 'cancelled' | 'confirmed' | 'none' | 'tentative' | undefined,
        location: request.params.arguments?.location as string | undefined,
      };

      const events = await calendarService.listEvents(filter);
      return {
        content: [
          {
            type: 'text',
            text: `Found ${events.length} events:\n${events
              .map(
                (e) =>
                  `- ${e.summary} (in ${e.calendar.name}, ${e.startDate.toLocaleString()} - ${e.endDate.toLocaleString()})${
                    e.location ? ` at ${e.location}` : ''
                  }`,
              )
              .join('\n')}`,
          },
        ],
      };
    }

    case 'create_event': {
      const calendarName = String(request.params.arguments?.calendarName);
      const summary = String(request.params.arguments?.summary);
      const startDate = new Date(String(request.params.arguments?.startDate));
      const endDate = new Date(String(request.params.arguments?.endDate));
      const alldayEvent = Boolean(request.params.arguments?.alldayEvent);

      if (!calendarName || !summary || !startDate || !endDate) {
        throw new Error('Calendar name, summary, start date, and end date are required');
      }

      const options = {
        description: request.params.arguments?.description as string | undefined,
        location: request.params.arguments?.location as string | undefined,
        url: request.params.arguments?.url as string | undefined,
        recurrence: request.params.arguments?.recurrence as string | undefined,
      };

      const event = await calendarService.createEvent(calendarName, summary, startDate, endDate, alldayEvent, options);
      return {
        content: [
          {
            type: 'text',
            text: `Created event "${event.summary}" in ${event.calendar.name} (${event.startDate.toLocaleString()} - ${event.endDate.toLocaleString()})`,
          },
        ],
      };
    }

    case 'update_event': {
      const id = String(request.params.arguments?.id);
      if (!id) {
        throw new Error('Event ID is required');
      }

      const updates = {
        summary: request.params.arguments?.summary as string | undefined,
        startDate: request.params.arguments?.startDate ? new Date(request.params.arguments.startDate as string) : undefined,
        endDate: request.params.arguments?.endDate ? new Date(request.params.arguments.endDate as string) : undefined,
        alldayEvent: request.params.arguments?.alldayEvent as boolean | undefined,
        description: request.params.arguments?.description as string | undefined,
        location: request.params.arguments?.location as string | undefined,
        url: request.params.arguments?.url as string | undefined,
        recurrence: request.params.arguments?.recurrence as string | undefined,
        status: request.params.arguments?.status as 'cancelled' | 'confirmed' | 'none' | 'tentative' | undefined,
      };

      const event = await calendarService.updateEvent(id, updates);
      return {
        content: [
          {
            type: 'text',
            text: `Updated event "${event.summary}" in ${event.calendar.name} (${event.startDate.toLocaleString()} - ${event.endDate.toLocaleString()})`,
          },
        ],
      };
    }

    case 'find_conflicts': {
      const startDate = new Date(String(request.params.arguments?.startDate));
      const endDate = new Date(String(request.params.arguments?.endDate));
      const calendarNames = request.params.arguments?.calendarNames as string[] | undefined;

      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }

      const events = await calendarService.findConflicts(startDate, endDate, calendarNames);
      return {
        content: [
          {
            type: 'text',
            text: `Found ${events.length} conflicting events:\n${events
              .map(
                (e) =>
                  `- ${e.summary} (in ${e.calendar.name}, ${e.startDate.toLocaleString()} - ${e.endDate.toLocaleString()})${
                    e.location ? ` at ${e.location}` : ''
                  }`,
              )
              .join('\n')}`,
          },
        ],
      };
    }

    case 'list_calendars': {
      const calendars = await calendarService.listCalendars();
      return {
        content: [
          {
            type: 'text',
            text: `Found ${calendars.length} calendars:\n${calendars
              .map((c) => `- ${c.name}${c.description ? ` (${c.description})` : ''}${c.writable ? '' : ' (read-only)'}`)
              .join('\n')}`,
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
