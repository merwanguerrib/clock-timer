# Work Time Tracker for Scriptable

A set of iOS Scriptable scripts to track your work hours with automatic notifications and weekly reports.

## Features

- 🕒 Clock in and out of work
- ⏸️ Track breaks during work
- 📊 Generate weekly reports
- ⏰ Get notifications after long work sessions
- 📝 Manual time entry for forgotten entries
- 🔄 iCloud sync support

## Prerequisites

1. iOS device
2. [Scriptable app](https://apps.apple.com/app/scriptable/id1405459188) installed
3. iCloud enabled for Scriptable

## Installation

1. Download the following files:

   - `clock-timer.js`
   - `weekly-report.js`

2. In the Scriptable app:
   - Tap the + button to create a new script
   - Copy and paste the contents of each file into separate scripts
   - Save each script with their respective names

## Usage

### Clock Timer (`clock-timer.js`)

This is your main script for daily time tracking.

#### Features:

- Start/stop work sessions
- Track breaks
- Manual time entry for forgotten sessions
- Automatic notification after 10 hours of work

#### How to Use:

1. **Start Working:**

   - Run the script
   - Select "Commencer le travail"
   - The timer will start

2. **Take a Break:**

   - Run the script while working
   - Select "Commencer une pause"
   - Run again to end the break

3. **End Work Day:**

   - Run the script
   - Select "Arrêter le travail"
   - Your hours will be logged automatically

4. **Manual Entry:**
   - Run the script
   - Select "Saisie manuelle"
   - Follow the prompts to enter:
     - Work date
     - Start time
     - End time
     - Number and duration of breaks

### Weekly Report (`weekly-report.js`)

Generates a summary of your work hours for the previous week.

#### Features:

- Calculates total hours worked
- Creates a summary file
- Sends a notification with the report

#### How to Use:

1. Run the script at the end of your work week
2. The script will:
   - Calculate hours from Monday to Sunday of the previous week
   - Generate a summary in `weekly_summary.txt`
   - Send a notification with the total hours

#### Automation Tip:

Set up an iOS Shortcut to run this script automatically every week.

## File Structure

The scripts use the following files in your iCloud Scriptable folder:

- `work_log.txt`: Daily work records
- `work_state.json`: Current work session state
- `weekly_summary.txt`: Generated weekly reports

## Language

The scripts are currently set up in French. Time formats use 24-hour notation.

## iOS Shortcuts Integration

You can integrate these scripts with the iOS Shortcuts app for enhanced automation:

### Clock Timer Shortcuts

1. **Quick Clock In/Out**
   - Create a new Shortcut
   - Add "Run Script" action
   - Select `clock-timer.js`
   - Add to Home Screen or use as a widget for one-tap access

2. **Break Timer Widget**
   - Create a Shortcut for break management
   - Add "Run Script" action with `clock-timer.js`
   - Add to Home Screen or widget for quick break tracking

### Weekly Report Automation

1. **Automatic Weekly Reports**
   - Create a new Shortcut
   - Add "Run Script" action
   - Select `weekly-report.js`
   - Under Automation tab:
     - Choose "Weekly"
     - Select your preferred day/time
     - Enable "Run Automatically"

### Example Shortcuts Setup

1. **Morning Work Start**
   ```
   When: Weekdays at 9:00 AM
   Do: Run Script (clock-timer.js)
   ```

2. **Evening Work End**
   ```
   When: Weekdays at 6:00 PM
   Do: Run Script (clock-timer.js)
   ```

3. **Weekly Report**
   ```
   When: Friday at 5:00 PM
   Do: Run Script (weekly-report.js)
   ```

### Tips for Shortcuts

- Add these scripts to Siri for voice control
- Create a Shortcuts widget with all work-related scripts
- Use Focus modes to show/hide relevant shortcuts
- Combine with other Shortcuts actions for custom workflows (e.g., Do Not Disturb, Calendar events)
