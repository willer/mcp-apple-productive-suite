#!/usr/bin/env python3

import objc
from Foundation import NSObject, NSRunLoop, NSDefaultRunLoopMode

# Load the EventKit framework
objc.loadBundle('EventKit', globals(), bundle_path='/System/Library/Frameworks/EventKit.framework')

# Define EventKit constants
EKEntityTypeEvent = 0
EKEntityTypeReminder = 1

def request_reminder_access():
    """Request access to Reminders and return both the access status and event store."""
    eventStore = objc.lookUpClass('EKEventStore').alloc().init()
    granted_ref = [False]
    
    def completion_handler(granted: bool, error: objc.objc_object) -> None:
        granted_ref[0] = granted
        NSRunLoop.currentRunLoop().stop()
    
    # Convert the Python function to an Objective-C block
    completion_block = objc.Block(completion_handler)
    
    # Request access
    eventStore.requestAccessToEntityType_completion_(EKEntityTypeReminder, completion_block)
    
    # Run the loop until callback completes
    NSRunLoop.currentRunLoop().runMode_beforeDate_(NSDefaultRunLoopMode, objc.lookUpClass('NSDate').distantFuture())
    
    return granted_ref[0], eventStore

def create_reminder(title: str):
    """Create a new reminder with the given title."""
    granted, store = request_reminder_access()
    
    if not granted:
        raise Exception("Access to Reminders was denied")
    
    # Create a new reminder
    reminder = objc.lookUpClass('EKReminder').reminderWithEventStore_(store)
    reminder.setTitle_(title)
    
    # Save the reminder
    error_ptr = objc.nil
    success = store.saveReminder_commit_error_(reminder, True, error_ptr)
    
    if not success:
        raise Exception(f"Failed to save reminder: {error_ptr}")
    
    return reminder

if __name__ == '__main__':
    try:
        reminder = create_reminder("Test from Python/PyObjC")
        print("Reminder created successfully!")
    except Exception as e:
        print(f"Error: {e}") 