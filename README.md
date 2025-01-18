# MCP Apple Productive Suite

Expose Apple Notes, Reminders, and Calendar as MCP resources and tools. This allows AI agents to interact with your Apple productivity apps through a clean, typed interface.

## Features

### Reminders
- List reminders with filtering by completion, flag status, priority, and due dates
- Create new reminders
- Update existing reminders
- Mark reminders as completed
- Set reminder priorities and flags

### Notes
- List notes with filtering by content, creation date, and modification date
- Create new notes in specific folders
- Update existing notes
- List note folders

### Calendar
- List events with filtering by date range, calendar, status, and location
- Create new events with support for recurring events
- Update existing events
- Find scheduling conflicts
- List available calendars

See [INTERFACE.md](INTERFACE.md) for detailed API documentation.

## Development

### Installation

Install dependencies:
```bash
npm install
```

### Building

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

### Testing

The project includes both unit tests and manual integration tests:

#### Unit Tests
```bash
npm test                # Run all unit tests once
npm run test:watch     # Run unit tests in watch mode
```

#### Manual Integration Tests
```bash
npm run test:manual            # Test all services
npm run test:manual:reminders  # Test only Reminders
npm run test:manual:notes      # Test only Notes
npm run test:manual:calendar   # Test only Calendar
```

#### Development Mode
```bash
npm run dev           # Run TypeScript compiler and unit tests in watch mode
```

### Code Quality

```bash
npm run lint         # Check code style
npm run lint:fix     # Fix code style issues
npm run format       # Format code with Prettier
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

## Security Note

This tool requires access to your Apple Notes, Reminders, and Calendar. It uses Apple's JavaScript for Automation (JXA) to interact with these apps. Please review the code and understand what it does before using it.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
