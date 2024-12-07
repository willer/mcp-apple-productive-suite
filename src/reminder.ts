import '@jxa/global-type';
import { run } from '@jxa/run';

export type Reminder = {
  id: string;
  name: string;
  body: string;
  completed: boolean;
  completedDate: Date;
  dueDate: Date;
  alldayDueDate: Date;
  remindMeDate: Date;
  priority: number;
  flagged: boolean;
};

export const createReminder = async (name: string, body: string): Promise<Reminder> => {
  // This callback function is run as JXA
  return run(
    (name, body) => {
      const app = Application('Reminders');
      app.activate();

      const newReminder = app.make({
        new: 'reminder',
        withProperties: {
          name,
          body,
          completed: false,
        },
      });

      return newReminder;
    },
    name,
    body,
  );
};
