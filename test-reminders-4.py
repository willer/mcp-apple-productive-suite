import objc
import time
from Foundation import NSObject, NSRunLoop, NSDate, NSPredicate
from PyObjCTools import AppHelper

# Load the EventKit framework
objc.loadBundle('EventKit', bundle_path='/System/Library/Frameworks/EventKit.framework', module_globals=globals())

def request_reminder_access():
    eventStore = EKEventStore.alloc().init()
    granted_ref = [False]
    finished = [False]

    def completion(granted, error):
        granted_ref[0] = granted
        finished[0] = True

    eventStore.requestAccessToEntityType_completion_(EKEntityTypeReminder, completion)

    # Spin until the callback sets `finished[0] = True`
    # (Hacky, but simpler than messing with run loops for an example)
    while not finished[0]:
        time.sleep(0.05)

    return granted_ref[0], eventStore

def create_reminder(title):
    granted, store = request_reminder_access()
    if not granted:
        print("Reminders access not granted.")
        return
    
    reminder = EKReminder.reminderWithEventStore_(store)
    reminder.setTitle_(title)

    default_cal = store.defaultCalendarForNewReminders()
    if default_cal is None:
        print("No default calendar found.")
        return
    
    reminder.setCalendar_(default_cal)

    error = None
    success = store.saveReminder_commit_error_(reminder, True, None)
    if success:
        print(f"Created reminder: {title}")
    else:
        print("Error creating reminder")

def list_reminders():
    granted, store = request_reminder_access()
    if not granted:
        print("Reminders access not granted.")
        return
    
    calendars = store.calendarsForEntityType_(EKEntityTypeReminder)
    predicate = store.predicateForIncompleteRemindersWithDueDateStarting_ending_calendars_(None, None, calendars)

    # fetchReminders is async
    done = [False]

    def completion(reminders):
        if reminders is None:
            print("No reminders or error fetching them.")
        else:
            for r in reminders:
                print("Reminder:", r.title())
        done[0] = True

    store.fetchRemindersMatchingPredicate_completion_(predicate, completion)

    # Wait for the fetch to complete
    while not done[0]:
        time.sleep(0.05)

if __name__ == "__main__":
    create_reminder("Test from Python/PyObjC")
    list_reminders()
