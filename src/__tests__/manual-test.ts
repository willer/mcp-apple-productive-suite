#!/usr/bin/env node

import { run } from '@jxa/run';
import { RemindersService } from '../reminder.js';
import { NotesService } from '../notes.js';
import { CalendarService } from '../calendar.js';

async function testReminders() {
  console.log('\n=== Testing Reminders ===');
  
  // First try a basic JXA test
  console.log('\nTesting basic JXA access...');
  try {
    await run(() => {
      const app = Application('Reminders');
      app.activate();
      const lists = app.lists();
      console.log(`Direct JXA test: Found ${lists.length} lists`);
      return true;
    });
    console.log('Basic JXA test successful');
  } catch (e) {
    console.error('Basic JXA test failed:', e);
  }

  const service = RemindersService.getInstance();

  console.log('\nListing all reminders...');
  const allReminders = await service.listReminders();
  console.log(`Found ${allReminders.length} reminders:`);
  allReminders.forEach((r) => {
    console.log(`- ${r.name} (${r.completed ? 'completed' : 'pending'}${r.flagged ? ', flagged' : ''}${
      r.priority > 0 ? `, priority ${r.priority}` : ''
    })`);
  });

  console.log('\nCreating a test reminder...');
  const reminder = await service.createReminder('Test Reminder', 'This is a test reminder created by the test script');
  console.log(`Created reminder: ${reminder.name}`);

  console.log('\nUpdating the reminder...');
  const updated = await service.updateReminder(reminder.id, { priority: 1, flagged: true });
  console.log(`Updated reminder: ${updated.name} (priority: ${updated.priority}, flagged: ${updated.flagged})`);

  console.log('\nMarking the reminder as completed...');
  const completed = await service.completeReminder(reminder.id);
  console.log(`Completed reminder: ${completed.name}`);
}

async function testNotes() {
  console.log('\n=== Testing Notes ===');
  const service = NotesService.getInstance();

  console.log('\nListing all folders...');
  const folders = await service.listFolders();
  console.log(`Found ${folders.length} folders:`);
  folders.forEach((f) => console.log(`- ${f.name}`));

  console.log('\nListing all notes...');
  const allNotes = await service.listNotes();
  console.log(`Found ${allNotes.length} notes:`);
  allNotes.forEach((n) => {
    console.log(`- ${n.name} (in ${n.container.name})`);
  });

  console.log('\nCreating a test note...');
  const note = await service.createNote('Test Note', 'This is a test note created by the test script');
  console.log(`Created note: ${note.name} in ${note.container.name}`);

  console.log('\nUpdating the note...');
  const updated = await service.updateNote(note.id, { name: 'Updated Test Note', body: 'This note has been updated' });
  console.log(`Updated note: ${updated.name}`);
}

async function testCalendar() {
  console.log('\n=== Testing Calendar ===');
  const service = CalendarService.getInstance();

  console.log('\nListing all calendars...');
  const calendars = await service.listCalendars();
  console.log(`Found ${calendars.length} calendars:`);
  calendars.forEach((c) => console.log(`- ${c.name}${c.description ? ` (${c.description})` : ''}${c.writable ? '' : ' (read-only)'}`));

  if (calendars.length === 0) {
    console.log('No calendars found, skipping event tests');
    return;
  }

  const testCalendar = calendars.find((c) => c.writable);
  if (!testCalendar) {
    console.log('No writable calendars found, skipping event tests');
    return;
  }

  console.log('\nListing upcoming events...');
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const events = await service.listEvents({
    startAfter: now,
    endBefore: nextWeek,
  });
  console.log(`Found ${events.length} events in the next week:`);
  events.forEach((e) => {
    console.log(`- ${e.summary} (${e.startDate.toLocaleString()} - ${e.endDate.toLocaleString()})`);
  });

  console.log('\nCreating a test event...');
  const eventStart = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000); // 1 hour duration
  const event = await service.createEvent(testCalendar.name, 'Test Event', eventStart, eventEnd, false, {
    description: 'This is a test event created by the test script',
    location: 'Test Location',
  });
  console.log(`Created event: ${event.summary} (${event.startDate.toLocaleString()} - ${event.endDate.toLocaleString()})`);

  console.log('\nChecking for conflicts...');
  const conflicts = await service.findConflicts(eventStart, eventEnd);
  console.log(`Found ${conflicts.length} conflicting events:`);
  conflicts.forEach((e) => {
    console.log(`- ${e.summary} (${e.startDate.toLocaleString()} - ${e.endDate.toLocaleString()})`);
  });

  console.log('\nUpdating the event...');
  const updated = await service.updateEvent(event.id, {
    summary: 'Updated Test Event',
    description: 'This event has been updated',
  });
  console.log(`Updated event: ${updated.summary}`);
}

async function main() {
  try {
    const testType = process.argv[2]?.toLowerCase();

    if (!testType || testType === 'reminders') {
      await testReminders();
    }

    if (!testType || testType === 'notes') {
      await testNotes();
    }

    if (!testType || testType === 'calendar') {
      await testCalendar();
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

main(); 