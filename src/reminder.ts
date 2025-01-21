import '@jxa/global-type';
import { run } from '@jxa/run';
import { SingletonService, Logger, JXAObject } from './shared.js';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

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
  // Read methods
  id(): string;
  name(): string;
  body(): string;
  completed(): boolean;
  completionDate(): Date | null;
  dueDate(): Date | null;
  alldayDueDate(): Date | null;
  remindMeDate(): Date | null;
  priority(): number;
  flagged(): boolean;

  // Write properties
  setName(value: string): void;
  setBody(value: string): void;
  setCompleted(value: boolean): void;
  setPriority(value: number): void;
  setFlagged(value: boolean): void;
  setDueDate(value: Date | null): void;
  setRemindMeDate(value: Date | null): void;
}

interface JXAList {
  name(): string;
  reminders(): JXAReminder[];
}

export class RemindersService extends SingletonService<Reminder> {
  private logger: Logger;

  constructor() {
    super();
    this.logger = Logger.getInstance();
  }

  protected convertFromJXA(jxaObject: JXAObject): Reminder {
    const reminder = jxaObject as unknown as JXAReminder;
    return {
      id: reminder.id(),
      name: reminder.name(),
      body: reminder.body(),
      completed: reminder.completed(),
      completedDate: reminder.completionDate(),
      dueDate: reminder.dueDate(),
      alldayDueDate: reminder.alldayDueDate(),
      remindMeDate: reminder.remindMeDate(),
      priority: reminder.priority(),
      flagged: reminder.flagged(),
    };
  }

  // Direct osascript implementation
  async createReminderDirect(name: string, body: string): Promise<Reminder> {
    try {
      this.logger.log('Creating reminder (direct)', { name, body });
      
      const script = `
        const app = Application('Reminders');
        const defaultList = app.defaultList();
        if (!defaultList) {
          throw new Error('No default list found');
        }
        
        const newReminder = defaultList.make({
          new: 'reminder',
          withProperties: {
            name: ${JSON.stringify(name)},
            body: ${JSON.stringify(body)},
            completed: false,
            priority: 0,
            flagged: false
          }
        });
        
        JSON.stringify({
          id: newReminder.id(),
          name: newReminder.name(),
          body: newReminder.body(),
          completed: newReminder.completed(),
          completedDate: newReminder.completionDate(),
          dueDate: newReminder.dueDate(),
          alldayDueDate: newReminder.alldayDueDate(),
          remindMeDate: newReminder.remindMeDate(),
          priority: newReminder.priority(),
          flagged: newReminder.flagged()
        });
      `;

      // Use spawn to pipe the script via stdin
      const { spawn } = require('child_process');
      //const child = spawn('osascript', ['-l', 'JavaScript', '-']);
      // launch echo in a shell to test
      const child = spawn('echo', ['hello']);
      this.logger.log(' echo test completed');
      return null;
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
      
      // Wrap in a promise to handle async completion
      const result = await new Promise<Reminder>((resolve, reject) => {
        child.on('close', (code: number) => {
          if (code !== 0) {
            reject(new Error(`osascript failed with code ${code}: ${stderr}`));
          } else {
            try {
              resolve(JSON.parse(stdout) as Reminder);
            } catch (e) {
              reject(new Error(`Failed to parse osascript output: ${e}`));
            }
          }
        });
        
        // Write script to stdin and close it
        child.stdin.write(script);
        child.stdin.end();
      });
      
      this.logger.log('Created reminder (direct)', result);
      return result;
    } catch (error) {
      await this.logger.logError(error, 'Failed to create reminder (direct)');
      throw error;
    }
  }

  async createReminder(name: string, body: string): Promise<Reminder> {
    try {
      this.logger.log('Creating reminder', { name, body });
      const result = await run(
        (name, body) => {
          console.log('Getting default list');
          const app = Application('Reminders');
          const defaultList = app.defaultList();
          if (!defaultList) {
            throw new Error('No default list found');
          }

          // Create with all properties at once to minimize property access
          console.log('Calling defaultList.make');
          const newReminder = defaultList.make({
            new: 'reminder',
            withProperties: {
              name,
              body,
              completed: false,
              priority: 0,
              flagged: false
            },
          }) as JXAReminder;
          console.log('Finished calling defaultList.make');

          // Return properties directly
          return {
            id: newReminder.id(),
            name: newReminder.name(),
            body: newReminder.body(),
            completed: newReminder.completed(),
            completedDate: newReminder.completionDate(),
            dueDate: newReminder.dueDate(),
            alldayDueDate: newReminder.alldayDueDate(),
            remindMeDate: newReminder.remindMeDate(),
            priority: newReminder.priority(),
            flagged: newReminder.flagged(),
          };
        },
        name,
        body,
      ) as Reminder;
      
      this.logger.log('Created reminder', result);
      return result;
    } catch (error) {
      await this.logger.logError(error, 'Failed to create reminder');
      throw error;
    }
  }

  async listReminders(filter?: ReminderFilter): Promise<Reminder[]> {
    try {
      this.logger.log('Listing reminders', { filter });
      
      const result = await run((filterStr) => {
        try {
          const filter = filterStr ? JSON.parse(filterStr) : {};
          const app = Application('Reminders');
          const lists = app.lists();

          // Get all reminders and their properties in bulk
          const allReminders = lists.flatMap((list: JXAList) => {
            const reminders = list.reminders();
            return reminders.map((r: JXAReminder) => ({
              id: r.id(),
              name: r.name(),
              body: r.body(),
              completed: r.completed(),
              completedDate: r.completionDate(),
              dueDate: r.dueDate(),
              alldayDueDate: r.alldayDueDate(),
              remindMeDate: r.remindMeDate(),
              priority: r.priority(),
              flagged: r.flagged(),
            }));
          });

          // Filter the reminders (all properties already retrieved)
          return allReminders.filter((reminder: Reminder) => {
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
      }, filter ? JSON.stringify(filter) : undefined) as Reminder[];

      this.logger.log('Listed reminders', { count: result.length });
      return result;
    } catch (error) {
      await this.logger.logError(error, 'Failed to list reminders');
      throw error;
    }
  }

  async updateReminder(id: string, updates: Partial<Omit<Reminder, 'id'>>): Promise<Reminder> {
    const result = await run(
      (id, updatesStr) => {
        const updates = JSON.parse(updatesStr);
        const app = Application('Reminders');
        const lists = app.lists();
        
        // Find reminder
        const reminder = lists
          .flatMap((list: JXAList) => list.reminders())
          .find((r: JXAReminder) => r.id() === id);

        if (!reminder) {
          throw new Error(`Reminder with id ${id} not found`);
        }

        // Apply updates directly
        if (updates.name !== undefined) reminder.setName(updates.name);
        if (updates.body !== undefined) reminder.setBody(updates.body);
        if (updates.completed !== undefined) reminder.setCompleted(updates.completed);
        if (updates.priority !== undefined) reminder.setPriority(updates.priority);
        if (updates.flagged !== undefined) reminder.setFlagged(updates.flagged);
        if (updates.dueDate !== undefined) reminder.setDueDate(updates.dueDate);
        if (updates.remindMeDate !== undefined) reminder.setRemindMeDate(updates.remindMeDate);

        // Return current properties
        return {
          id: reminder.id(),
          name: reminder.name(),
          body: reminder.body(),
          completed: reminder.completed(),
          completedDate: reminder.completionDate(),
          dueDate: reminder.dueDate(),
          alldayDueDate: reminder.alldayDueDate(),
          remindMeDate: reminder.remindMeDate(),
          priority: reminder.priority(),
          flagged: reminder.flagged(),
        };
      },
      id,
      JSON.stringify(updates),
    ) as Reminder;

    return result;
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
