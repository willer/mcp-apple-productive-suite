/// <reference types="jest" />

import { describe, expect, it, beforeEach } from '@jest/globals';
import { RemindersService } from '../reminder.js';
import { NotesService } from '../notes.js';
import { CalendarService } from '../calendar.js';
import { run } from '@jxa/run';

const mockRun = run as jest.MockedFunction<typeof run>;

describe('RemindersService', () => {
  let service: RemindersService;

  beforeEach(() => {
    service = RemindersService.getInstance();
    mockRun.mockClear();
  });

  it('should be a singleton', () => {
    const instance1 = RemindersService.getInstance();
    const instance2 = RemindersService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should list reminders', async () => {
    mockRun.mockImplementation(async (jxaCodeFunction: unknown, filterStr?: unknown) => {
      const filter = filterStr ? JSON.parse(filterStr as string) : {};
      const mockReminders = [
        {
          id: () => '123',
          name: () => 'Test Reminder 1',
          body: () => 'Test Content 1',
          completed: () => false,
          completionDate: () => null,
          dueDate: () => null,
          alldayDueDate: () => null,
          remindMeDate: () => null,
          priority: () => 0,
          flagged: () => false,
        },
        {
          id: () => '124',
          name: () => 'Test Reminder 2',
          body: () => 'Test Content 2',
          completed: () => true,
          completionDate: () => new Date('2024-01-01'),
          dueDate: () => new Date('2024-01-01'),
          alldayDueDate: () => null,
          remindMeDate: () => null,
          priority: () => 1,
          flagged: () => true,
        },
      ];

      return mockReminders
        .filter((reminder) => {
          if (filter.completed !== undefined && reminder.completed() !== filter.completed) {
            return false;
          }
          return true;
        })
        .map((reminder) => ({
          id: reminder.id(),
          name: reminder.name(),
          body: reminder.body(),
          completed: reminder.completed(),
          completionDate: reminder.completionDate(),
          dueDate: reminder.dueDate(),
          alldayDueDate: reminder.alldayDueDate(),
          remindMeDate: reminder.remindMeDate(),
          priority: reminder.priority(),
          flagged: reminder.flagged(),
        }));
    });

    const reminders = await service.listReminders({ completed: false });

    expect(reminders).toEqual([{
      id: '123',
      name: 'Test Reminder 1',
      body: 'Test Content 1',
      completed: false,
      completionDate: null,
      dueDate: null,
      alldayDueDate: null,
      remindMeDate: null,
      priority: 0,
      flagged: false,
    }]);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('should create a reminder', async () => {
    mockRun.mockResolvedValueOnce({
      id: '123',
      name: 'Test Reminder',
      body: 'Test Content',
      completed: false,
      completionDate: null,
      dueDate: null,
      alldayDueDate: null,
      remindMeDate: null,
      priority: 0,
      flagged: false,
    });

    const reminder = await service.createReminder('Test Reminder', 'Test Content');

    expect(reminder).toEqual({
      id: '123',
      name: 'Test Reminder',
      body: 'Test Content',
      completed: false,
      completionDate: null,
      dueDate: null,
      alldayDueDate: null,
      remindMeDate: null,
      priority: 0,
      flagged: false,
    });
  });
});

describe('NotesService', () => {
  let service: NotesService;

  beforeEach(() => {
    service = NotesService.getInstance();
    mockRun.mockClear();
  });

  it('should be a singleton', () => {
    const instance1 = NotesService.getInstance();
    const instance2 = NotesService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should create a note', async () => {
    mockRun.mockResolvedValueOnce({
      id: '123',
      name: 'Test Note',
      body: 'Test Content',
      creationDate: new Date('2024-01-01'),
      modificationDate: new Date('2024-01-01'),
      plainText: 'Test Content',
      container: {
        id: 'folder123',
        name: 'Default Folder',
      },
    });

    const note = await service.createNote('Test Note', 'Test Content');

    expect(note).toEqual({
      id: '123',
      name: 'Test Note',
      body: 'Test Content',
      creationDate: new Date('2024-01-01'),
      modificationDate: new Date('2024-01-01'),
      plainText: 'Test Content',
      container: {
        id: 'folder123',
        name: 'Default Folder',
      },
    });
  });
});

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(() => {
    service = CalendarService.getInstance();
    mockRun.mockClear();
  });

  it('should be a singleton', () => {
    const instance1 = CalendarService.getInstance();
    const instance2 = CalendarService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should create an event', async () => {
    mockRun.mockResolvedValueOnce({
      id: '123',
      name: 'Test Event',
      body: 'Test Description',
      description: 'Test Description',
      startDate: new Date('2024-01-01T10:00:00'),
      endDate: new Date('2024-01-01T11:00:00'),
      alldayEvent: false,
      recurrence: '',
      sequence: 0,
      stampDate: new Date('2024-01-01'),
      excludedDates: [],
      status: 'confirmed' as const,
      summary: 'Test Event',
      location: '',
      uid: '123',
      url: '',
      calendar: {
        id: 'cal123',
        name: 'Test Calendar',
      },
    });

    const event = await service.createEvent(
      'Test Calendar',
      'Test Event',
      new Date('2024-01-01T10:00:00'),
      new Date('2024-01-01T11:00:00'),
      false,
    );

    expect(event).toEqual({
      id: '123',
      name: 'Test Event',
      body: 'Test Description',
      description: 'Test Description',
      startDate: new Date('2024-01-01T10:00:00'),
      endDate: new Date('2024-01-01T11:00:00'),
      alldayEvent: false,
      recurrence: '',
      sequence: 0,
      stampDate: new Date('2024-01-01'),
      excludedDates: [],
      status: 'confirmed',
      summary: 'Test Event',
      location: '',
      uid: '123',
      url: '',
      calendar: {
        id: 'cal123',
        name: 'Test Calendar',
      },
    });
  });
}); 