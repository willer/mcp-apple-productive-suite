# MCP Apple Productive Suite

Expose apple notes, reminders and calendar as MCP resources and tools

## Features

### Tools
- `create_note` - Create new text notes
  - Takes title and content as required parameters
- `create_reminder` - Create new reminders
  - Takes reminder name as required parameter
- `create_calendar_event` - Create new calendar events
  - Takes calender name, summary, start date, end date, and allday event as required parameters
- `list_calendars` - List all calendars
  - Returns a list of calendar names

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-apple-productive-suite": {
      "command": "/path/to/mcp-apple-productive-suite/build/index.js"
    }
  }
}
```
