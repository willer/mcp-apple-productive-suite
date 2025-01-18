import '@jxa/global-type';
import { run } from '@jxa/run';

export type Reminder = {
  id: string;
  name: string;
  body: string;
  completed: boolean;
  completedDate: Date | null;
  dueDate: Date | null;
  alldayDueDate: Date | null;
  remindMeDate: Date | null;
  priority: number;
  flagged: boolean;
};

export type ReminderFilter = {
  completed?: boolean;
  flagged?: boolean;
  priority?: number;
  dueAfter?: Date;
  dueBefore?: Date;
};

// Type for JXA Reminder object
interface JXAReminder {
  // Properties
  id: string;
  name: string;
  body: string;
  completed: boolean;
  completionDate: Date | null;
  dueDate: Date | null;
  alldayDueDate: Date | null;
  remindMeDate: Date | null;
  priority: number;
  flagged: boolean;

  // Methods
  properties(): {
    id: string;
    name: string;
    body: string;
    completed: boolean;
    completionDate: Date | null;
    dueDate: Date | null;
    alldayDueDate: Date | null;
    remindMeDate: Date | null;
    priority: number;
    flagged: boolean;
  };
}

interface JXAList {
  reminders(): JXAReminder[];
}

export class RemindersService {
  private static instance: RemindersService;

  private constructor() {}

  public static getInstance(): RemindersService {
    if (!RemindersService.instance) {
      RemindersService.instance = new RemindersService();
    }
    return RemindersService.instance;
  }

  async createReminder(name: string, body: string): Promise<Reminder> {
  return run(
    (name, body) => {
      const app = Application('Reminders');
      app.activate();

        // Get the default list
        const defaultList = app.defaultList();
        if (!defaultList) {
          throw new Error('No default list found');
        }

        // Create the reminder in the default list
        const newReminder = defaultList.make({
        new: 'reminder',
        withProperties: {
          name,
          body,
          completed: false,
        },
        }) as JXAReminder;

        // Get all properties at once
        const props = newReminder.properties();
        return {
          id: props.id,
          name: props.name,
          body: props.body,
          completed: props.completed,
          completionDate: props.completionDate,
          dueDate: props.dueDate,
          alldayDueDate: props.alldayDueDate,
          remindMeDate: props.remindMeDate,
          priority: props.priority,
          flagged: props.flagged,
        };
    },
    name,
    body,
  );
  }

  async listReminders(filter?: ReminderFilter): Promise<Reminder[]> {
    return run((filterStr) => {
      try {
        const filter = filterStr ? JSON.parse(filterStr) : {};
        const app = Application('Reminders');
        app.activate();

        // Get all reminders first
        const allReminders = [];
        const lists = app.lists();
        
        for (const list of lists) {
          const reminders = list.reminders();
          for (const reminder of reminders) {
            // Get all properties at once
            const props = reminder.properties();
            const plainReminder = {
              id: props.id,
              name: props.name,
              body: props.body,
              completed: props.completed,
              completionDate: props.completionDate,
              dueDate: props.dueDate,
              alldayDueDate: props.alldayDueDate,
              remindMeDate: props.remindMeDate,
              priority: props.priority,
              flagged: props.flagged,
            };
            allReminders.push(plainReminder);
          }
        }

        // Filter the plain objects
        return allReminders.filter((reminder) => {
          if (filter.completed !== undefined && reminder.completed !== filter.completed) {
            return false;
          }
          if (filter.flagged !== undefined && reminder.flagged !== filter.flagged) {
            return false;
          }
          if (filter.priority !== undefined && reminder.priority !== filter.priority) {
            return false;
          }
          if (filter.dueAfter && reminder.dueDate) {
            if (new Date(reminder.dueDate) < new Date(filter.dueAfter)) {
              return false;
            }
          }
          if (filter.dueBefore && reminder.dueDate) {
            if (new Date(reminder.dueDate) > new Date(filter.dueBefore)) {
              return false;
            }
          }
          return true;
        });
      } catch (e) {
        const error = e as { message?: string };
        throw new Error(`Failed to list reminders: ${error.message}`);
      }
    }, filter ? JSON.stringify(filter) : undefined);
  }

  async updateReminder(id: string, updates: Partial<Omit<Reminder, 'id'>>): Promise<Reminder> {
    return run(
      (id, updatesStr) => {
        const updates = JSON.parse(updatesStr);
        const app = Application('Reminders');
        app.activate();

        const lists = app.lists() as unknown as JXAList[];
        const reminder = lists
          .map((list) => list.reminders())
          .flat()
          .find((r) => r.id === id);

        if (!reminder) {
          throw new Error(`Reminder with id ${id} not found`);
        }

        // Apply updates
        if (updates.name !== undefined) reminder.name = updates.name;
        if (updates.body !== undefined) reminder.body = updates.body;
        if (updates.completed !== undefined) reminder.completed = updates.completed;
        if (updates.priority !== undefined) reminder.priority = updates.priority;
        if (updates.flagged !== undefined) reminder.flagged = updates.flagged;
        if (updates.dueDate !== undefined) reminder.dueDate = updates.dueDate;
        if (updates.remindMeDate !== undefined) reminder.remindMeDate = updates.remindMeDate;

        return {
          id: reminder.id,
          name: reminder.name,
          body: reminder.body,
          completed: reminder.completed,
          completionDate: reminder.completionDate,
          dueDate: reminder.dueDate,
          alldayDueDate: reminder.alldayDueDate,
          remindMeDate: reminder.remindMeDate,
          priority: reminder.priority,
          flagged: reminder.flagged,
        };
      },
      id,
      JSON.stringify(updates),
    );
  }

  async completeReminder(id: string): Promise<Reminder> {
    return this.updateReminder(id, { completed: true });
  }

  async flagReminder(id: string, flagged: boolean): Promise<Reminder> {
    return this.updateReminder(id, { flagged });
  }

  async setPriority(id: string, priority: number): Promise<Reminder> {
    return this.updateReminder(id, { priority });
  }
}
