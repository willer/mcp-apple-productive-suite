#!/usr/bin/env swift

import Foundation
import EventKit

// A small helper function to request access and return an EKEventStore
func getEventStore() -> EKEventStore? {
    let eventStore = EKEventStore()
    let semaphore = DispatchSemaphore(value: 0)
    var storeGranted: Bool = false
    
    eventStore.requestAccess(to: .reminder) { (granted, error) in
        if let error = error {
            print("Error requesting access to reminders: \(error.localizedDescription)")
        }
        storeGranted = granted
        semaphore.signal()
    }
    _ = semaphore.wait(timeout: .distantFuture)
    
    return storeGranted ? eventStore : nil
}

func createReminder(title: String) {
    guard let eventStore = getEventStore() else {
        print("Access to reminders not granted or error retrieving store.")
        return
    }
    
    let reminder = EKReminder(eventStore: eventStore)
    reminder.title = title
    // By default, let's add it to the default reminders calendar
    reminder.calendar = eventStore.defaultCalendarForNewReminders()
    
    do {
        try eventStore.save(reminder, commit: true)
        print("Successfully created reminder: \(title)")
    } catch {
        print("Error saving reminder: \(error.localizedDescription)")
    }
}

func listReminders() {
    guard let eventStore = getEventStore() else {
        print("Access to reminders not granted or error retrieving store.")
        return
    }
    
    // Typically, you’d filter reminders by a date range or other metadata.
    // For simplicity, this fetches "all reminders" (within a broad time range).
    let calendars = eventStore.calendars(for: .reminder)
    let predicate = eventStore.predicateForIncompleteReminders(withDueDateStarting: nil,
                                                               ending: nil,
                                                               calendars: calendars)
    eventStore.fetchReminders(matching: predicate) { reminders in
        guard let reminders = reminders else {
            print("No reminders found or error fetching.")
            return
        }
        for rem in reminders {
            print("Reminder: \(rem.title)")
        }
        exit(EXIT_SUCCESS)
    }
    
    // Because fetchReminders is async, keep the script alive
    RunLoop.current.run()
}

// Basic argument handling for a simple CLI:
let args = CommandLine.arguments
if args.count < 2 {
    print("Usage: reminders (create|list) [title]")
    exit(EXIT_FAILURE)
}

let command = args[1].lowercased()
switch command {
case "create":
    guard args.count > 2 else {
        print("Usage: reminders create \"My Reminder Title\"")
        exit(EXIT_FAILURE)
    }
    let title = args[2...].joined(separator: " ")
    createReminder(title: title)

case "list":
    listReminders()

default:
    print("Unknown command: \(command)")
}
