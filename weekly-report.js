// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: business-time;
// FILE: weekly_report_silent.js
// This script can be run via Shortcuts every week to produce a summary.

// File paths
const fm = FileManager.iCloud();
const basePath = fm.documentsDirectory();
const logPath = fm.joinPath(basePath, 'work_log.txt');
const summaryPath = fm.joinPath(basePath, 'weekly_summary.txt');

// Helper functions
function formatDate(date) {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function parseWorkLogLine(line) {
  // Example line:
  // "lundi 14/12/24, Début: 09:00, Fin: 17:00, Total travaillé: 7h 30m"
  let parts = line.split(',');
  if (parts.length < 4) return null;

  let datePart = parts[0].trim(); // e.g. "lundi 14/12/24"
  let dateTokens = datePart.split(' ');
  // dateTokens[1]: dd/mm/yy
  let dateStr = dateTokens[1];
  let [dayStr, monthStr, yearStr] = dateStr.split('/');
  let day = parseInt(dayStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  let year = parseInt(yearStr, 10);
  year = year < 50 ? 2000 + year : 1900 + year;
  let entryDate = new Date(year, month, day);
  if (isNaN(entryDate.getTime())) return null;

  let totalWorkedPart = parts[3].trim();
  let match = totalWorkedPart.match(/Total travaillé:\s*(\d+)h\s+(\d+)m/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  let minutes = parseInt(match[2], 10);
  let totalMinutes = hours * 60 + minutes;

  return { date: entryDate, totalMinutes };
}

// Get last week's Monday and Sunday
function getLastWeekRange() {
  let now = new Date();
  let dayOfWeek = now.getDay();
  // Sunday=0, Monday=1,... Saturday=6
  // Find this week's Monday:
  let currentMonday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  let diffToMonday = (dayOfWeek + 6) % 7;
  currentMonday.setDate(currentMonday.getDate() - diffToMonday);

  // Last Monday = currentMonday - 7 days
  let lastMonday = new Date(currentMonday.getTime());
  lastMonday.setDate(lastMonday.getDate() - 7);
  // Last Sunday = lastMonday + 6 days
  let lastSunday = new Date(lastMonday.getTime());
  lastSunday.setDate(lastSunday.getDate() + 6);

  return { lastMonday, lastSunday };
}

async function main() {
  if (!fm.fileExists(logPath)) {
    // No log file, write a note and send a notification
    let noLogMsg =
      "Aucun journal trouvé. Assurez-vous que 'work_log.txt' existe.";
    fm.writeString(summaryPath, noLogMsg);

    let noLogNotif = new Notification();
    noLogNotif.title = 'Rapport hebdomadaire';
    noLogNotif.body = noLogMsg;
    await noLogNotif.schedule();
    return;
  }

  // Ensure log is downloaded
  if (!fm.isFileDownloaded(logPath)) {
    await fm.downloadFileFromiCloud(logPath);
  }

  let { lastMonday, lastSunday } = getLastWeekRange();
  let logContent = fm.readString(logPath);
  let lines = logContent
    .split('\n')
    .filter((l) => l.trim().length > 0 && !l.startsWith('Jour Date'));

  let totalMinutes = 0;
  for (let line of lines) {
    let entry = parseWorkLogLine(line);
    if (!entry) continue;
    let d = entry.date;
    if (d >= lastMonday && d <= lastSunday) {
      totalMinutes += entry.totalMinutes;
    }
  }

  let hours = Math.floor(totalMinutes / 60);
  let minutes = totalMinutes % 60;

  let weekStartStr = formatDate(lastMonday);
  let weekEndStr = formatDate(lastSunday);

  let message = '';
  if (totalMinutes > 0) {
    message = `Rapport du ${weekStartStr} au ${weekEndStr}:\nTotal travaillé: ${hours}h ${minutes}m`;
  } else {
    message = `Aucune heure enregistrée pour la semaine du ${weekStartStr} au ${weekEndStr}.`;
  }

  // Write summary to file
  fm.writeString(summaryPath, message);

  // Send a notification
  let notif = new Notification();
  notif.title = 'Rapport hebdomadaire';
  notif.body = message;
  await notif.schedule();
}

await main();
