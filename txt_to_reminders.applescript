--taken from http://benguild.com/2012/04/11/how-to-import-tasks-to-do-items-into-ios-reminders/#comment-1346894559
--set theFileContents to (read file "Users:n8henrie:Desktop:Reminders.txt") -- Change this to the path to your downloaded text file with your tasks in it! (Note the : instead of a / between folders) Or, just name them Reminders.txt and put them in your downloads folder
--set theLines to paragraphs of theFileContents

set theLines to {"task name 1", "task name 2"}
repeat with eachLine in theLines
	tell application "Reminders"
		set mylist to list "Inbox"
		tell mylist
			make new reminder at end with properties {name:eachLine, due date:date "7/10/2014 3:00 PM"}
		end tell
	end tell
end repeat

(*
-- Properties that can be set for each task
name (text) : the name of the reminder
id (text, r/o) : the unique identifier of the reminder
body (text) : the notes attached to the reminder
completed (boolean) : Is the reminder completed?
completion date (date) : the completion date of the reminder
container (list, r/o) : the container of the reminder
creation date (date, r/o) : the creation date of the reminder
due date (date) : the due date of the reminder
modification date (date, r/o) : the modification date of the reminder
remind me date (date) : the remind date of the reminder
priority (integer) : the priority of the reminder
*)
