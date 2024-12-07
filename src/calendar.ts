import '@jxa/global-type';
import { run } from '@jxa/run';

export type CalendarEvent = {
  description: string;
  startDate: Date;
  endDate: Date;
  alldayEvent: boolean;
  recurrence: string;
  readonly sequence: number;
  stampDate: Date;
  excludedDates: Date[];
  status: 'cancelled' | 'confirmed' | 'none' | 'tentative';
  summary: string;
  location: string;
  readonly uid: string;
  url: string;
};

export type Calendar = {
  name: string;
  description: string;
  readonly writable: boolean;
};

export const createEvent = async (
  calenderName: string,
  summary: string,
  startDate: number,
  endDate: number,
  alldayEvent: boolean,
): Promise<CalendarEvent> => {
  return run(
    (calenderName, summary, startedInput, endedInput, alldayEvent) => {
      const Calendar = Application('Calendar');
      Calendar.includeStandardAdditions = true;
      const cal = Calendar.calendars.whose({ name: calenderName });
      const started = new Date(startedInput);
      const ended = new Date(endedInput);
      const newEvent = Calendar.Event({
        summary,
        startDate: started,
        endDate: ended,
        alldayEvent,
      });
      cal[0].events.push(newEvent);
      return newEvent;
    },
    calenderName,
    summary,
    startDate,
    endDate,
    alldayEvent,
  );
};

export const listCalendars = async (): Promise<Calendar[]> => {
  return run(() => {
    const calendarApp = Application('Calendar');
    calendarApp.includeStandardAdditions = true;
    // calendarApp.activate();
    return calendarApp.calendars().map((calendar: any) => ({
      name: calendar.name(),
      description: calendar.description(),
      writable: calendar.writable(),
    }));
  });
};

// (async () => {
//   const calendars = await listCalendars();
//   console.log(calendars);
//   const started = new Date(Date.now());
//   const ended = new Date(started.getTime());
//   ended.setHours(started.getHours() + 1);
//   console.log(await createEvent('Inbox', 'Test Event', started.getTime(), ended.getTime(), false));
// })();
