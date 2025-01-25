#!/usr/bin/env python3

from pyicloud import PyiCloudService
from pyicloud.exceptions import PyiCloud2SARequiredException
import sys
import argparse
import logging
import getpass
import json
import os
import time
from datetime import datetime, timedelta
from pyicloud.services.reminders import RemindersService

def get_credentials():
    parser = argparse.ArgumentParser(description='Test iCloud services')
    parser.add_argument("username", help="iCloud username", type=str)
    parser.add_argument("password", help="iCloud password", type=str)
    parser.add_argument("--test", choices=["reminders", "all"], 
                       default="reminders", help="Test specific functionality")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    parser.add_argument("--verification-code", help="2FA verification code", type=str)
    
    if len(sys.argv) < 3:
        parser.print_help()
        sys.exit(1)
        
    args = parser.parse_args()
    return args.username, args.password, args.test, args.debug, args.verification_code

def handle_2fa(api):
    print("\nTwo-factor authentication required.")
    code = input("Enter the code you received on one of your approved devices: ")
    
    print("\nAttempting to validate code...")
    result = api.validate_2fa_code(code)
    print(f"Code validation result: {result}")

    if not result:
        print("Failed to verify security code")
        return False

    if not api.is_trusted_session:
        print("\nSession is not trusted. Requesting trust...")
        result = api.trust_session()
        print(f"Session trust result: {result}")

        if not result:
            print("Failed to request trust. You will likely be prompted for the code again in the coming weeks")
    
    return True

def test_contacts(api):
    print("TESTING CONTACTS")
    for contact in api.contacts.all():
        print(contact.get('firstName', 'None'), contact.get('lastName', 'None'), contact.get('phones', []))
    return True

def test_reminders(api):
    print("\nTESTING REMINDERS\n")
    try:
        print("Authenticating with reminders service...")
        api.authenticate(force_refresh=True, service="reminders")

        print("\nGetting reminders service URL...")
        service_root = api._get_webservice_url("reminders")

        print("\nInitializing reminders service...")
        reminders_service = RemindersService(service_root, api.session, api.params)
        reminders_service._init_client()
        print("\nGetting current reminders...")
        reminders_service.refresh()

        print("\nCreating test reminder...")
        title = f"Test reminder created at {datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%d %H:%M:%SZ')}"
        reminder = reminders_service.post(title)
        print(f"Created reminder: {reminder}")

        return True
    except Exception as e:
        print(f"Error in reminders test: {str(e)}")
        import traceback
        print(f"Stack trace:\n{traceback.format_exc()}")
        return False

def test_calendar(api):
    print("\nTESTING CALENDAR EVENTS")
    try:
        # Force authentication for calendar service
        api.authenticate(force_refresh=True, service="calendar")
        
        for event in api.calendar.events():
            print(event.get('title', 'Untitled'), event.get('startDate', 'No date'))
    except Exception as e:
        print(f"Error accessing calendar: {str(e)}")
    return True

def main():
    username, password, test_type, debug, verification_code = get_credentials()
    
    if debug:
        logging.basicConfig(level=logging.DEBUG)
    
    # Initialize API with cookie directory to persist sessions
    api = PyiCloudService(
        username, 
        password,
        cookie_directory="~/.pyicloud",
        with_family=True
    )
    
    success = True
    
    # Handle 2FA if needed
    try:
        if api.requires_2sa:
            print("\nTwo-factor authentication required.")
            if not handle_2fa(api):
                print("Failed to complete two-factor authentication")
                sys.exit(1)
            # Wait a bit for the session to be fully established
            time.sleep(2)
    except Exception as e:
        print(f"Error during 2FA setup: {str(e)}")
        sys.exit(1)
    
    if test_type == "all":
        # Test contacts
        try:
            if not test_contacts(api):
                success = False
        except Exception as e:
            print(f"Error in contacts test: {str(e)}")
            success = False
        
        # Test reminders
        try:
            if not test_reminders(api):
                success = False
        except Exception as e:
            print(f"Error in reminders test: {str(e)}")
            success = False
            
        # Test calendar
        try:
            if not test_calendar(api):
                success = False
        except Exception as e:
            print(f"Error in calendar test: {str(e)}")
            success = False
            
    elif test_type == "reminders":
        try:
            if not test_reminders(api):
                success = False
        except Exception as e:
            print(f"Error in reminders test: {str(e)}")
            success = False
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()


