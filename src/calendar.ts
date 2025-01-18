import '@jxa/global-type';
import { run } from '@jxa/run';
import { BaseFilter, BaseObject, JXAContainer, JXAObject, SingletonService } from './shared.js';

export interface Calendar extends BaseObject {
  description: string;
  writable: boolean;
}

export interface CalendarEvent extends BaseObject {
  description: string;
  startDate: Date;
  endDate: Date;
  alldayEvent: boolean;
  recurrence: string;
  sequence: number;
  stampDate: Date;
  excludedDates: Date[];
  status: 'cancelled' | 'confirmed' | 'none' | 'tentative';
  summary: string;
  location: string;
  uid: string;
  url: string;
  calendar: {
    id: string;
    name: string;
  };
}

export interface CalendarEventFilter extends BaseFilter {
  startAfter?: Date;
  startBefore?: Date;
  endAfter?: Date;
  endBefore?: Date;
  calendarId?: string;
  calendarName?: string;
  status?: 'cancelled' | 'confirmed' | 'none' | 'tentative';
  location?: string;
  hasConflicts?: boolean;
}

interface JXACalendarEvent extends JXAObject {
  // Additional getters
  getDescription(): string;
  getStartDate(): Date;
  getEndDate(): Date;
  getAllDayEvent(): boolean;
  getRecurrence(): string;
  getSequence(): number;
  getStampDate(): Date;
  getExcludedDates(): Date[];
  getStatus(): 'cancelled' | 'confirmed' | 'none' | 'tentative';
  getSummary(): string;
  getLocation(): string;
  getUid(): string;
  getUrl(): string;
  calendar(): JXACalendar;

  // Setters
  set description(value: string);
  set startDate(value: Date);
  set endDate(value: Date);
  set alldayEvent(value: boolean);
  set recurrence(value: string);
  set status(value: 'cancelled' | 'confirmed' | 'none' | 'tentative');
  set summary(value: string);
  set location(value: string);
  set url(value: string);
}

interface JXACalendar extends JXAContainer<JXACalendarEvent> {
  description(): string;
  writable(): boolean;
  events: {
    push(event: JXACalendarEvent): void;
    (): JXACalendarEvent[];
  };
}

export class CalendarService extends SingletonService<CalendarEvent> {
  protected convertFromJXA(jxaObject: JXACalendarEvent): CalendarEvent {
    const calendar = jxaObject.calendar();
    return {
      id: jxaObject.getId(),
      name: jxaObject.getName(),
      body: jxaObject.getBody(),
      description: jxaObject.getDescription(),
      startDate: jxaObject.getStartDate(),
      endDate: jxaObject.getEndDate(),
      alldayEvent: jxaObject.getAllDayEvent(),
      recurrence: jxaObject.getRecurrence(),
      sequence: jxaObject.getSequence(),
      stampDate: jxaObject.getStampDate(),
      excludedDates: jxaObject.getExcludedDates(),
      status: jxaObject.getStatus(),
      summary: jxaObject.getSummary(),
      location: jxaObject.getLocation(),
      uid: jxaObject.getUid(),
      url: jxaObject.getUrl(),
      calendar: {
        id: calendar.id(),
        name: calendar.name(),
      },
    };
  }

  async createEvent(
    calendarName: string,
    summary: string,
    startDate: Date,
    endDate: Date,
    alldayEvent: boolean,
    options: Partial<Pick<CalendarEvent, 'description' | 'location' | 'url' | 'recurrence'>> = {},
  ): Promise<CalendarEvent> {
    return run(
      (calendarName, summary, startDate, endDate, alldayEvent, optionsStr) => {
        const options = JSON.parse(optionsStr);
        const app = Application('Calendar');
        app.includeStandardAdditions = true;

        const calendar = app.calendars.whose({ name: calendarName })[0] as JXACalendar;
        if (!calendar) {
          throw new Error(`Calendar "${calendarName}" not found`);
        }

        const newEvent = app.Event({
          summary,
          startDate,
          endDate,
          alldayEvent,
          description: options.description,
          location: options.location,
          url: options.url,
          recurrence: options.recurrence,
        }) as JXACalendarEvent;

        calendar.events.push(newEvent);

        return {
          id: newEvent.getId(),
          name: newEvent.getName(),
          body: newEvent.getBody(),
          description: newEvent.getDescription(),
          startDate: newEvent.getStartDate(),
          endDate: newEvent.getEndDate(),
          alldayEvent: newEvent.getAllDayEvent(),
          recurrence: newEvent.getRecurrence(),
          sequence: newEvent.getSequence(),
          stampDate: newEvent.getStampDate(),
          excludedDates: newEvent.getExcludedDates(),
          status: newEvent.getStatus(),
          summary: newEvent.getSummary(),
          location: newEvent.getLocation(),
          uid: newEvent.getUid(),
          url: newEvent.getUrl(),
          calendar: {
            id: calendar.id(),
            name: calendar.name(),
          },
        };
      },
      calendarName,
      summary,
      startDate,
      endDate,
      alldayEvent,
      JSON.stringify(options),
    );
  }

  async listEvents(filter?: CalendarEventFilter): Promise<CalendarEvent[]> {
    return run((filterStr) => {
      const filter = filterStr ? JSON.parse(filterStr) : {};
      const app = Application('Calendar');
      app.includeStandardAdditions = true;

      let calendars: JXACalendar[];
      if (filter.calendarId || filter.calendarName) {
        calendars = app.calendars().filter((c: JXACalendar) => {
          if (filter.calendarId && c.id() !== filter.calendarId) {
            return false;
          }
          if (filter.calendarName && c.name() !== filter.calendarName) {
            return false;
          }
          return true;
        });
      } else {
        calendars = app.calendars();
      }

      const allEvents = calendars.map((calendar) => calendar.events()).flat();
      
      return allEvents
        .filter((event: JXACalendarEvent) => {
          if (filter.name && !event.getName().toLowerCase().includes(filter.name.toLowerCase())) {
            return false;
          }
          if (filter.body && !event.getBody().toLowerCase().includes(filter.body.toLowerCase())) {
            return false;
          }
          if (filter.startAfter && event.getStartDate() < new Date(filter.startAfter)) {
            return false;
          }
          if (filter.startBefore && event.getStartDate() > new Date(filter.startBefore)) {
            return false;
          }
          if (filter.endAfter && event.getEndDate() < new Date(filter.endAfter)) {
            return false;
          }
          if (filter.endBefore && event.getEndDate() > new Date(filter.endBefore)) {
            return false;
          }
          if (filter.status && event.getStatus() !== filter.status) {
            return false;
          }
          if (filter.location && !event.getLocation().toLowerCase().includes(filter.location.toLowerCase())) {
            return false;
          }
          return true;
        })
        .map((event: JXACalendarEvent) => ({
          id: event.getId(),
          name: event.getName(),
          body: event.getBody(),
          description: event.getDescription(),
          startDate: event.getStartDate(),
          endDate: event.getEndDate(),
          alldayEvent: event.getAllDayEvent(),
          recurrence: event.getRecurrence(),
          sequence: event.getSequence(),
          stampDate: event.getStampDate(),
          excludedDates: event.getExcludedDates(),
          status: event.getStatus(),
          summary: event.getSummary(),
          location: event.getLocation(),
          uid: event.getUid(),
          url: event.getUrl(),
          calendar: {
            id: event.calendar().id(),
            name: event.calendar().name(),
          },
        }));
    }, filter ? JSON.stringify(filter) : undefined);
  }

  async updateEvent(
    id: string,
    updates: Partial<Omit<CalendarEvent, 'id' | 'sequence' | 'stampDate' | 'uid' | 'calendar'>>,
  ): Promise<CalendarEvent> {
    return run(
      (id, updatesStr) => {
        const updates = JSON.parse(updatesStr);
        const app = Application('Calendar');
        app.includeStandardAdditions = true;

        const event = app
          .calendars()
          .map((c: JXACalendar) => c.events())
          .flat()
          .find((e: JXACalendarEvent) => e.getId() === id);

        if (!event) {
          throw new Error(`Event with id ${id} not found`);
        }

        // Apply updates
        if (updates.name !== undefined) event.name = updates.name;
        if (updates.body !== undefined) event.body = updates.body;
        if (updates.description !== undefined) event.description = updates.description;
        if (updates.startDate !== undefined) event.startDate = new Date(updates.startDate);
        if (updates.endDate !== undefined) event.endDate = new Date(updates.endDate);
        if (updates.alldayEvent !== undefined) event.alldayEvent = updates.alldayEvent;
        if (updates.recurrence !== undefined) event.recurrence = updates.recurrence;
        if (updates.status !== undefined) event.status = updates.status;
        if (updates.summary !== undefined) event.summary = updates.summary;
        if (updates.location !== undefined) event.location = updates.location;
        if (updates.url !== undefined) event.url = updates.url;

        return {
          id: event.getId(),
          name: event.getName(),
          body: event.getBody(),
          description: event.getDescription(),
          startDate: event.getStartDate(),
          endDate: event.getEndDate(),
          alldayEvent: event.getAllDayEvent(),
          recurrence: event.getRecurrence(),
          sequence: event.getSequence(),
          stampDate: event.getStampDate(),
          excludedDates: event.getExcludedDates(),
          status: event.getStatus(),
          summary: event.getSummary(),
          location: event.getLocation(),
          uid: event.getUid(),
          url: event.getUrl(),
          calendar: {
            id: event.calendar().id(),
            name: event.calendar().name(),
          },
        };
      },
      id,
      JSON.stringify(updates),
    );
  }

  async findConflicts(startDate: Date, endDate: Date, calendarNames?: string[]): Promise<CalendarEvent[]> {
    return run(
      (startDate, endDate, calendarNamesStr) => {
        const calendarNames = calendarNamesStr ? JSON.parse(calendarNamesStr) : undefined;
        const app = Application('Calendar');
        app.includeStandardAdditions = true;

        let calendars: JXACalendar[];
        if (calendarNames && calendarNames.length > 0) {
          calendars = app.calendars().filter((c: JXACalendar) => calendarNames.includes(c.name()));
        } else {
          calendars = app.calendars();
        }

        const allEvents = calendars
          .map((calendar) => calendar.events())
          .flat()
          .filter((event: JXACalendarEvent) => {
            const eventStart = event.getStartDate();
            const eventEnd = event.getEndDate();
            return (
              event.getStatus() !== 'cancelled' &&
              ((eventStart >= startDate && eventStart < endDate) || // Event starts during the period
                (eventEnd > startDate && eventEnd <= endDate) || // Event ends during the period
                (eventStart <= startDate && eventEnd >= endDate)) // Event spans the entire period
            );
          });

        return allEvents.map((event: JXACalendarEvent) => ({
          id: event.getId(),
          name: event.getName(),
          body: event.getBody(),
          description: event.getDescription(),
          startDate: event.getStartDate(),
          endDate: event.getEndDate(),
          alldayEvent: event.getAllDayEvent(),
          recurrence: event.getRecurrence(),
          sequence: event.getSequence(),
          stampDate: event.getStampDate(),
          excludedDates: event.getExcludedDates(),
          status: event.getStatus(),
          summary: event.getSummary(),
          location: event.getLocation(),
          uid: event.getUid(),
          url: event.getUrl(),
          calendar: {
            id: event.calendar().id(),
            name: event.calendar().name(),
          },
        }));
      },
      startDate,
      endDate,
      calendarNames ? JSON.stringify(calendarNames) : undefined,
    );
  }

  async listCalendars(): Promise<Calendar[]> {
    return run(() => {
      const app = Application('Calendar');
      app.includeStandardAdditions = true;

      return app.calendars().map((calendar: JXACalendar) => ({
        id: calendar.id(),
        name: calendar.name(),
        body: calendar.description(),
        description: calendar.description(),
        writable: calendar.writable(),
      }));
    });
  }
}
