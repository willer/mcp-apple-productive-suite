# MCP Interface Documentation

This document describes the Model Context Protocol (MCP) interface exposed by the Apple Productive Suite. Each tool is documented with its purpose, parameters, and example usage.

## Reminders Tools

### `list_reminders`
List reminders with optional filters.

**Parameters:**
- `completed` (boolean, optional) - Filter by completion status
- `flagged` (boolean, optional) - Filter by flag status
- `priority` (number, optional) - Filter by priority level
- `dueAfter` (string, optional) - ISO date string to filter reminders due after this date
- `dueBefore` (string, optional) - ISO date string to filter reminders due before this date

**Example:**
```json
{
  "completed": false,
  "flagged": true,
  "priority": 1,
  "dueAfter": "2024-03-01T00:00:00Z"
}
```

### `create_reminder`
Create a new reminder.

**Parameters:**
- `title` (string, required) - Title of the reminder
- `content` (string, required) - Text content of the reminder

**Example:**
```json
{
  "title": "Buy groceries",
  "content": "Milk, bread, eggs"
}
```

### `update_reminder`
Update an existing reminder.

**Parameters:**
- `id` (string, required) - ID of the reminder to update
- `name` (string, optional) - New title for the reminder
- `body` (string, optional) - New content for the reminder
- `completed` (boolean, optional) - New completion status
- `priority` (number, optional) - New priority level
- `flagged` (boolean, optional) - New flag status
- `dueDate` (string, optional) - New due date (ISO date string)
- `remindMeDate` (string, optional) - New reminder date (ISO date string)

**Example:**
```json
{
  "id": "reminder123",
  "name": "Buy groceries today",
  "priority": 2,
  "flagged": true
}
```

### `complete_reminder`
Mark a reminder as completed.

**Parameters:**
- `id` (string, required) - ID of the reminder to complete

**Example:**
```json
{
  "id": "reminder123"
}
```

### `flag_reminder`
Set the flag status of a reminder.

**Parameters:**
- `id` (string, required) - ID of the reminder
- `flagged` (boolean, required) - New flag status

**Example:**
```json
{
  "id": "reminder123",
  "flagged": true
}
```

### `set_reminder_priority`
Set the priority of a reminder.

**Parameters:**
- `id` (string, required) - ID of the reminder
- `priority` (number, required) - New priority level (0-5)

**Example:**
```json
{
  "id": "reminder123",
  "priority": 1
}
```

## Notes Tools

### `list_notes`
Search and list notes with optional filters.

**Parameters:**
- `name` (string, optional) - Filter by note title (case-insensitive)
- `body` (string, optional) - Filter by note content (case-insensitive)
- `createdAfter` (string, optional) - ISO date string to filter notes created after this date
- `createdBefore` (string, optional) - ISO date string to filter notes created before this date
- `modifiedAfter` (string, optional) - ISO date string to filter notes modified after this date
- `modifiedBefore` (string, optional) - ISO date string to filter notes modified before this date
- `containerId` (string, optional) - Filter by folder ID
- `containerName` (string, optional) - Filter by folder name

**Example:**
```json
{
  "body": "meeting notes",
  "modifiedAfter": "2024-03-01T00:00:00Z",
  "containerName": "Work"
}
```

### `create_note`
Create a new note.

**Parameters:**
- `title` (string, required) - Title of the note
- `content` (string, required) - Text content of the note
- `containerName` (string, optional) - Name of the folder to create the note in

**Example:**
```json
{
  "title": "Meeting Notes",
  "content": "Discussion points:\n1. Project timeline\n2. Resource allocation",
  "containerName": "Work"
}
```

### `update_note`
Update an existing note.

**Parameters:**
- `id` (string, required) - ID of the note to update
- `title` (string, optional) - New title for the note
- `content` (string, optional) - New content for the note

**Example:**
```json
{
  "id": "note123",
  "title": "Updated Meeting Notes",
  "content": "Updated discussion points..."
}
```

### `list_note_folders`
List all note folders.

**Parameters:** None

## Calendar Tools

### `list_events`
Search and list calendar events with optional filters.

**Parameters:**
- `name` (string, optional) - Filter by event title (case-insensitive)
- `body` (string, optional) - Filter by event content (case-insensitive)
- `startAfter` (string, optional) - ISO date string to filter events starting after this date
- `startBefore` (string, optional) - ISO date string to filter events starting before this date
- `endAfter` (string, optional) - ISO date string to filter events ending after this date
- `endBefore` (string, optional) - ISO date string to filter events ending before this date
- `calendarId` (string, optional) - Filter by calendar ID
- `calendarName` (string, optional) - Filter by calendar name
- `status` (string, optional) - Filter by event status ('cancelled', 'confirmed', 'none', 'tentative')
- `location` (string, optional) - Filter by event location (case-insensitive)

**Example:**
```json
{
  "startAfter": "2024-03-01T00:00:00Z",
  "endBefore": "2024-03-31T23:59:59Z",
  "calendarName": "Work",
  "status": "confirmed"
}
```

### `create_event`
Create a new calendar event.

**Parameters:**
- `calendarName` (string, required) - Name of the calendar
- `summary` (string, required) - Summary of the event
- `startDate` (string, required) - ISO date string for the event start
- `endDate` (string, required) - ISO date string for the event end
- `alldayEvent` (boolean, optional) - Whether the event is all day
- `description` (string, optional) - Detailed description of the event
- `location` (string, optional) - Location of the event
- `url` (string, optional) - URL associated with the event
- `recurrence` (string, optional) - Recurrence rule for the event

**Example:**
```json
{
  "calendarName": "Work",
  "summary": "Team Meeting",
  "startDate": "2024-03-15T10:00:00Z",
  "endDate": "2024-03-15T11:00:00Z",
  "description": "Weekly team sync",
  "location": "Conference Room A"
}
```

### `update_event`
Update an existing calendar event.

**Parameters:**
- `id` (string, required) - ID of the event to update
- `summary` (string, optional) - New summary for the event
- `startDate` (string, optional) - New ISO date string for the event start
- `endDate` (string, optional) - New ISO date string for the event end
- `alldayEvent` (boolean, optional) - Whether the event is all day
- `description` (string, optional) - New detailed description of the event
- `location` (string, optional) - New location of the event
- `url` (string, optional) - New URL associated with the event
- `recurrence` (string, optional) - New recurrence rule for the event
- `status` (string, optional) - New status for the event ('cancelled', 'confirmed', 'none', 'tentative')

**Example:**
```json
{
  "id": "event123",
  "summary": "Updated Team Meeting",
  "location": "Conference Room B",
  "status": "confirmed"
}
```

### `find_conflicts`
Find calendar events that conflict with a given time period.

**Parameters:**
- `startDate` (string, required) - ISO date string for the period start
- `endDate` (string, required) - ISO date string for the period end
- `calendarNames` (string[], optional) - Optional list of calendar names to check

**Example:**
```json
{
  "startDate": "2024-03-15T10:00:00Z",
  "endDate": "2024-03-15T11:00:00Z",
  "calendarNames": ["Work", "Personal"]
}
```

### `list_calendars`
List all available calendars.

**Parameters:** None 