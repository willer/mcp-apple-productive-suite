import '@jxa/global-type';
import { run } from '@jxa/run';
import { SingletonService, Logger, JXAObject } from './shared.js';

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

export class RemindersService extends SingletonService<Reminder> {
  private logger: Logger;

  constructor() {
    super();
    this.logger = Logger.getInstance();
  }

  protected convertFromJXA(jxaObject: JXAObject): Reminder {
    const reminder = jxaObject as unknown as JXAReminder;
    const props = reminder.properties();
    return {
      id: props.id,
      name: props.name,
      body: props.body,
      completed: props.completed,
      completedDate: props.completionDate,
      dueDate: props.dueDate,
      alldayDueDate: props.alldayDueDate,
      remindMeDate: props.remindMeDate,
      priority: props.priority,
      flagged: props.flagged,
    };
  }

  async createReminder(name: string, body: string): Promise<Reminder> {
    try {
      this.logger.log('Creating reminder', { name, body });
      const result = await run(
        (name, body) => {
          const app = Application('Reminders');
          
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
            completedDate: props.completionDate,
            dueDate: props.dueDate,
            alldayDueDate: props.alldayDueDate,
            remindMeDate: props.remindMeDate,
            priority: props.priority,
            flagged: props.flagged,
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
      
      // First test basic JXA access
      const hasAccess = await run(() => {
        try {
          const app = Application('Reminders');
          return true;
        } catch (e) {
          return false;
        }
      });

      if (!hasAccess) {
        throw new Error('Cannot access Reminders app. Please check permissions.');
      }

      const result = await run((filterStr) => {
        try {
          const filter = filterStr ? JSON.parse(filterStr) : {};
          const app = Application('Reminders');

          // Get all reminders first
          const allReminders = [];
          const lists = app.lists();
          console.log(`Found ${lists.length} lists`);
          
          for (const list of lists) {
            const reminders = list.reminders();
            console.log(`Processing list "${list.name()}" with ${reminders.length} reminders`);
            
            for (const reminder of reminders) {
              // Get all properties at once
              const props = reminder.properties();
              const plainReminder = {
                id: props.id,
                name: props.name,
                body: props.body,
                completed: props.completed,
                completedDate: props.completionDate,
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
          const filtered = allReminders.filter((reminder) => {
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

          console.log(`Found ${filtered.length} reminders after filtering (from ${allReminders.length} total)`);
          return filtered;
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
    return run(
      (id, updatesStr) => {
        const updates = JSON.parse(updatesStr);
        const app = Application('Reminders');

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
