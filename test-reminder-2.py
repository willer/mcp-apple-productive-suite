#!/usr/bin/env python3

import objc
from Foundation import NSRunLoop, NSDate, NSPredicate
from PyObjCTools import AppHelper

# Dynamically load EventKit
objc.loadBundle('EventKit', bundle_path='/System/Library/Frameworks/EventKit.framework', module_globals=globals())

def request_reminder_access():
    eventStore = EKEventStore.alloc().init()
    grantedRef = [False]

    def completion(granted, error):
        grantedRef[0] = granted
        AppHelper.stopEventLoop()

    completion = objc.block(completion, signature=b'v@?Z@')

    eventStore.requestAccessToEntityType_completion_(1, completion)  # 1 is EKEntityTypeReminder
    AppHelper.runConsoleEventLoop(installInterrupt=True)

    if grantedRef[0]:
        return eventStore
    else:
        print("Reminders access not granted")
        return None

def create_reminder(title):
    eventStore = request_reminder_access()
    if not eventStore:
        return

    reminder = EKReminder.reminderWithEventStore_(eventStore)
    reminder.setTitle_(title)
    reminder.setCalendar_(eventStore.defaultCalendarForNewReminders())

    errorRef = objc.nil
    success = eventStore.saveReminder_commit_error_(reminder, True, errorRef)
    if success:
        print(f"Successfully created reminder: {title}")
    else:
        print("Error saving reminder")

def list_reminders():
    eventStore = request_reminder_access()
    if not eventStore:
        return

    allCals = eventStore.calendarsForEntityType_(1)  # 1 is EKEntityTypeReminder
    predicate = eventStore.predicateForIncompleteRemindersWithDueDateStarting_ending_calendars_(
        None, None, allCals
    )

    def completion(reminders):
        if reminders:
            for r in reminders:
                print(f"Reminder: {r.title()}")
        AppHelper.stopEventLoop()

    eventStore.fetchRemindersMatchingPredicate_completion_(predicate, completion)
    AppHelper.runConsoleEventLoop(installInterrupt=True)

if __name__ == "__main__":
    print("Requesting reminder access")
    request_reminder_access()
    print("Creating reminder")
    create_reminder("Test Reminder")
    print("Listing reminders")
    list_reminders()
