#!/usr/bin/env python3

from Foundation import NSObject
from ScriptingBridge import SBApplication
import json
import sys
import logging
from subprocess import Popen, DEVNULL, PIPE
import tempfile

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RemindersService:
    def __init__(self):
        self.app = SBApplication.applicationWithBundleIdentifier_("com.apple.reminders")
        if not self.app:
            raise RuntimeError("Could not connect to Reminders.app")

    def create_reminder(self, name: str, body: str) -> dict:
        logger.debug("Creating reminder: %s", name)
        try:
            default_list = self.app.defaultList()
            if not default_list:
                raise RuntimeError("No default list found")
            
            logger.debug("Getting default list: %s", default_list.name())
            reminders = default_list.reminders()
            
            # Create reminder directly through Scripting Bridge
            reminder = self.app.classForScriptingClass_("reminder").alloc().init()
            
            # Get the current count of reminders
            initial_count = len(reminders)
            
            # Add the reminder to the list first
            reminders.addObject_(reminder)
            
            # Then set its properties
            reminder.setValue_forKey_(name, "name")
            reminder.setValue_forKey_(body, "body")
            
            # Verify the reminder was added
            new_count = len(reminders)
            if new_count <= initial_count:
                raise RuntimeError("Failed to add reminder to list")
            
            # Verify we can read back the properties
            if reminder.valueForKey_("name") != name:
                raise RuntimeError("Failed to set reminder name")
            
            return {
                "id": reminder.valueForKey_("id"),
                "name": reminder.valueForKey_("name"),
                "body": reminder.valueForKey_("body"),
                "completed": reminder.valueForKey_("completed"),
                "completionDate": reminder.valueForKey_("completionDate"),
                "dueDate": reminder.valueForKey_("dueDate"),
                "alldayDueDate": reminder.valueForKey_("alldayDueDate"),
                "remindMeDate": reminder.valueForKey_("remindMeDate"),
                "priority": reminder.valueForKey_("priority"),
                "flagged": reminder.valueForKey_("flagged")
            }
        except Exception as e:
            logger.error("Failed to create reminder: %s", e)
            raise

    def list_reminders(self, filter_params: dict = None) -> list:
        logger.debug("Listing reminders with filter: %s", filter_params)
        try:
            all_reminders = []
            for lst in self.app.lists():
                for reminder in lst.reminders():
                    reminder_dict = {
                        "id": reminder.id(),
                        "name": reminder.name(),
                        "body": reminder.body(),
                        "completed": reminder.completed(),
                        "completionDate": reminder.completionDate(),
                        "dueDate": reminder.dueDate(),
                        "alldayDueDate": reminder.alldayDueDate(),
                        "remindMeDate": reminder.remindMeDate(),
                        "priority": reminder.priority(),
                        "flagged": reminder.flagged()
                    }
                    
                    # Apply filters
                    if filter_params:
                        if "completed" in filter_params and reminder_dict["completed"] != filter_params["completed"]:
                            continue
                        if "flagged" in filter_params and reminder_dict["flagged"] != filter_params["flagged"]:
                            continue
                        if "priority" in filter_params and reminder_dict["priority"] != filter_params["priority"]:
                            continue
                    
                    all_reminders.append(reminder_dict)
            
            return all_reminders
        except Exception as e:
            logger.error("Failed to list reminders: %s", e)
            raise

def main():
    """Simple CLI interface"""
    service = RemindersService()
    
    if len(sys.argv) < 2:
        print("Usage: reminder.py [list|create] [args...]")
        sys.exit(1)
    
    command = sys.argv[1]
    if command == "list":
        reminders = service.list_reminders()
        print(json.dumps(reminders, indent=2))
    elif command == "create":
        if len(sys.argv) < 4:
            print("Usage: reminder.py create <name> <body>")
            sys.exit(1)
        reminder = service.create_reminder(sys.argv[2], sys.argv[3])
        print(json.dumps(reminder, indent=2))

if __name__ == "__main__":
    main() 