import Foundation
import EventKit
import Dispatch  // For semaphores

// Quick usage help
// Compile: swiftc reminders.swift -o reminders
// Run: ./reminders list
//      ./reminders create "Buy groceries"

/// Ensure we have permission to access Reminders.
/// Returns true if granted, false otherwise.
func requestRemindersAccess(store: EKEventStore) -> Bool {
    let semaphore = DispatchSemaphore(value: 0)
    var granted = false

    store.requestAccess(to: .reminder) { (didGrant, error) in
        if let error = error {
            print("Error requesting reminders access: \(error)")
        }
        granted = didGrant
        semaphore.signal()
    }

    _ = semaphore.wait(timeout: .distantFuture)
    return granted
}

/// Create a new reminder with the given title.
func createReminder(title: String) {
    let store = EKEventStore()

    // Ask for permission if needed
    guard requestRemindersAccess(store: store) else {
        print("Access to Reminders was not granted.")
        return
    }

    // Make sure we have a default calendar for new reminders
    guard let calendar = store.defaultCalendarForNewReminders() else {
        print("No default Reminders calendar found!")
        return
    }

    let reminder = EKReminder(eventStore: store)
    reminder.title = title
    reminder.calendar = calendar

    do {
        try store.save(reminder, commit: true)
        print("Reminder created: \(title)")
    } catch {
        print("Error saving reminder: \(error)")
    }
}

/// List all incomplete reminders
func listReminders() {
    let store = EKEventStore()

    // Ask for permission if needed
    guard requestRemindersAccess(store: store) else {
        print("Access to Reminders was not granted.")
        return
    }

    let calendars = store.calendars(for: .reminder)
    let predicate = store.predicateForIncompleteReminders(
        withDueDateStarting: nil,
        ending: nil,
        calendars: calendars
    )

    let semaphore = DispatchSemaphore(value: 0)
    store.fetchReminders(matching: predicate) { reminders in
        guard let reminders = reminders else {
            print("No reminders found or error fetching reminders.")
            semaphore.signal()
            return
        }
        for reminder in reminders {
            print("Reminder: \(reminder.title)")
        }
        semaphore.signal()
    }

    _ = semaphore.wait(timeout: .distantFuture)
}

// MARK: - Main

let args = CommandLine.arguments
guard args.count >= 2 else {
    print("Usage: reminders (list|create) [title...]")
    exit(0)
}

let command = args[1].lowercased()

switch command {
case "list":
    listReminders()

case "create":
    // e.g. reminders create "Buy milk"
    if args.count < 3 {
        print("Usage: reminders create \"Some reminder title\"")
        exit(1)
    }
    // Join everything after "create" into one string
    let title = args.dropFirst(2).joined(separator: " ")
    createReminder(title: title)

default:
    print("Unknown command: \(command)")
}
