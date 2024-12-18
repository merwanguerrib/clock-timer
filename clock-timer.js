// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: business-time;
// FILE NAMES
const STATE_FILE = 'work_state.json';
const LOG_FILE = 'work_log.txt';

// Notification constants
// Set how many hours after starting work you want to remind the user.
const WORK_HOURS_BEFORE_REMINDER = 10; // 10 hours
const REMINDER_MS = WORK_HOURS_BEFORE_REMINDER * 60 * 60 * 1000;

// Use iCloud file manager
const fm = FileManager.iCloud();
const basePath = fm.documentsDirectory();
const statePath = fm.joinPath(basePath, STATE_FILE);
const logPath = fm.joinPath(basePath, LOG_FILE);

// Ensure state file is available
if (fm.fileExists(statePath)) {
  if (!fm.isFileDownloaded(statePath)) {
    await fm.downloadFileFromiCloud(statePath);
  }
}

// Load or initialize state
// State structure:
// {
//   working: bool,
//   onBreak: bool,
//   startTime: number (ms),
//   breaks: [{start: number, end: number}, ...],
//   notificationId: string (optional)
// }
let state = {};
if (fm.fileExists(statePath)) {
  const raw = fm.readString(statePath);
  state = JSON.parse(raw);
} else {
  state = {
    working: false,
    onBreak: false,
    startTime: null,
    breaks: [],
    notificationId: null,
  };
}

function saveState() {
  fm.writeString(statePath, JSON.stringify(state));
}

function formatDate(date) {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function formatTime(date) {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatWeekday(date) {
  return date.toLocaleDateString('fr-FR', { weekday: 'long' });
}

// Ensure log file is available
if (fm.fileExists(logPath)) {
  if (!fm.isFileDownloaded(logPath)) {
    await fm.downloadFileFromiCloud(logPath);
  }
} else {
  // Create with header
  fm.writeString(logPath, 'Jour Date, Début, Fin, Total travaillé\n');
}

// Functions for picking dates/times
async function pickWorkDate() {
  let dp = new DatePicker();
  dp.initialDate = new Date();
  let selectedDate = await dp.pickDate();
  return selectedDate;
}

async function pickTimeWithDefault(baseDate, hour, minute) {
  let dp = new DatePicker();
  let defaultTime = new Date(baseDate);
  defaultTime.setHours(hour, minute, 0, 0);
  dp.initialDate = defaultTime;
  let selectedTime = await dp.pickTime();

  let finalDate = new Date(baseDate);
  finalDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
  return finalDate;
}

// Schedule a reminder notification
async function scheduleReminderNotification(startTime) {
  // If a notification was previously set, remove it
  if (state.notificationId) {
    await Notification.removePending([state.notificationId]);
    state.notificationId = null;
  }

  let notif = new Notification();
  notif.title = 'Rappel de fin de journée';
  notif.body =
    'Vous travaillez depuis un long moment. Pensez à arrêter le travail.';

  let triggerDate = new Date(startTime + REMINDER_MS);
  notif.setTriggerDate(triggerDate);
  await notif.schedule();

  state.notificationId = notif.identifier;
  saveState();
}

// Cancel the reminder notification
async function cancelReminderNotification() {
  if (state.notificationId) {
    await Notification.removePending([state.notificationId]);
    state.notificationId = null;
    saveState();
  }
}

// Manual entry function with user-friendly instructions for breaks
async function manualEntry() {
  // Pick the work date
  let workDate = await pickWorkDate();

  // Pick start time (default 09:00)
  let startDate = await pickTimeWithDefault(workDate, 9, 0);

  // Pick end time (default 18:00)
  let endDate = await pickTimeWithDefault(workDate, 18, 0);

  if (endDate <= startDate) {
    let errAlert = new Alert();
    errAlert.title = 'Heure invalide';
    errAlert.message =
      "L'heure de fin doit être après l'heure de début. Veuillez réessayer.";
    errAlert.addAction('OK');
    await errAlert.present();
    return;
  }

  // Ask for number of breaks with a numeric keypad
  let breaksAlert = new Alert();
  breaksAlert.title = 'Pauses';
  breaksAlert.message = 'Combien de pauses avez-vous pris ce jour-là ?';
  let breaksTextField = breaksAlert.addTextField('0');
  breaksTextField.setNumberPadKeyboard(); // Numeric keypad
  breaksAlert.addAction('OK');
  breaksAlert.addCancelAction('Annuler');
  let response = await breaksAlert.present();
  if (response === -1) {
    console.log('Opération annulée.');
    return;
  }

  let breaksCountStr = breaksTextField.text;
  let nbBreaks = parseInt(breaksCountStr);
  if (isNaN(nbBreaks) || nbBreaks < 0) nbBreaks = 0;

  let breaks = [];
  if (nbBreaks > 0) {
    let instructionAlert = new Alert();
    instructionAlert.title = 'Sélection des pauses';
    instructionAlert.message =
      `Vous avez indiqué ${nbBreaks} pause(s).\n` +
      "Vous allez maintenant sélectionner l'heure de début et de fin de chaque pause.\n" +
      "Assurez-vous de choisir des heures cohérentes et à l'intérieur de votre plage de travail.\n" +
      'Appuyez sur OK pour commencer.';
    instructionAlert.addAction('OK');
    await instructionAlert.present();
  }

  for (let i = 1; i <= nbBreaks; i++) {
    let breakInfoAlert = new Alert();
    breakInfoAlert.title = `Pause n°${i}`;
    breakInfoAlert.message =
      "Veuillez sélectionner l'heure de début de cette pause.";
    breakInfoAlert.addAction('OK');
    await breakInfoAlert.present();

    let bStart = await pickTimeWithDefault(workDate, 12, 0);

    let breakEndAlert = new Alert();
    breakEndAlert.title = `Pause n°${i}`;
    breakEndAlert.message =
      "Veuillez sélectionner l'heure de fin de cette pause.";
    breakEndAlert.addAction('OK');
    await breakEndAlert.present();

    let bEnd = await pickTimeWithDefault(workDate, 12, 30);

    if (bEnd <= bStart) {
      let invalidAlert = new Alert();
      invalidAlert.title = 'Pause ignorée';
      invalidAlert.message =
        "L'heure de fin est avant l'heure de début. Cette pause sera ignorée.";
      invalidAlert.addAction('OK');
      await invalidAlert.present();
      continue;
    }

    if (bEnd <= startDate || bStart >= endDate) {
      let outsideAlert = new Alert();
      outsideAlert.title = 'Pause ignorée';
      outsideAlert.message =
        'La pause est en dehors de votre période de travail. Cette pause sera ignorée.';
      outsideAlert.addAction('OK');
      await outsideAlert.present();
      continue;
    }

    // Adjust if break extends beyond work times
    if (bStart < startDate) bStart = startDate;
    if (bEnd > endDate) bEnd = endDate;

    breaks.push({ start: bStart.getTime(), end: bEnd.getTime() });
  }

  let totalWorkMs = endDate.getTime() - startDate.getTime();
  let totalBreakMs = 0;
  for (let b of breaks) {
    totalBreakMs += b.end - b.start;
  }
  let netWorkMs = totalWorkMs - totalBreakMs;
  let hours = Math.floor(netWorkMs / (1000 * 60 * 60));
  let minutes = Math.floor((netWorkMs / (1000 * 60)) % 60);

  let dayOfWeek = formatWeekday(workDate);
  let dateStrFormatted = formatDate(workDate);
  let startStr = formatTime(startDate);
  let endStr = formatTime(endDate);

  let logLine = `${dayOfWeek} ${dateStrFormatted}, Début: ${startStr}, Fin: ${endStr}, Total travaillé: ${hours}h ${minutes}m\n`;

  let currentLog = fm.readString(logPath);
  fm.writeString(logPath, currentLog + logLine);

  let successAlert = new Alert();
  successAlert.title = 'Saisie enregistrée';
  successAlert.message =
    'Votre session de travail a été enregistrée avec succès dans le journal.';
  successAlert.addAction('OK');
  await successAlert.present();
}

// MAIN LOGIC
if (!state.working && !state.onBreak) {
  let mainAlert = new Alert();
  mainAlert.title = 'Sélectionnez une action';
  mainAlert.addAction('Commencer le travail');
  mainAlert.addAction('Saisie manuelle');
  mainAlert.addCancelAction('Annuler');

  let mainResponse = await mainAlert.present();

  if (mainResponse == 0) {
    // Start working
    state.working = true;
    state.onBreak = false;
    state.startTime = Date.now();
    state.breaks = [];
    saveState();

    // Schedule a reminder notification
    await scheduleReminderNotification(state.startTime);

    let start = new Date(state.startTime);
    console.log(
      `Travail commencé à ${formatTime(start)} (${formatWeekday(
        start
      )} ${formatDate(start)})`
    );
  } else if (mainResponse == 1) {
    // Manual entry
    await manualEntry();
  } else {
    // Cancel
    console.log('Aucune modification.');
  }
} else if (state.working && !state.onBreak) {
  // Currently working: ask if start break or stop working
  let alert = new Alert();
  alert.title = 'Que voulez-vous faire ?';
  alert.addAction('Commencer une pause');
  alert.addDestructiveAction('Arrêter le travail');
  alert.addCancelAction('Annuler');
  let response = await alert.present();

  if (response == 0) {
    // Start Break
    state.onBreak = true;
    state.breaks.push({ start: Date.now(), end: null });
    saveState();
    console.log('Pause commencée.');
  } else if (response == 1) {
    // Stop Working
    let endTime = Date.now();
    let totalWorkMs = endTime - state.startTime;

    let totalBreakMs = 0;
    for (let b of state.breaks) {
      if (b.end && b.start) {
        totalBreakMs += b.end - b.start;
      }
    }

    let netWorkMs = totalWorkMs - totalBreakMs;
    let hours = Math.floor(netWorkMs / (1000 * 60 * 60));
    let minutes = Math.floor((netWorkMs / (1000 * 60)) % 60);

    let startDate = new Date(state.startTime);
    let endDate = new Date(endTime);

    let dayOfWeek = formatWeekday(startDate);
    let dateStr = formatDate(startDate);
    let startStr = formatTime(startDate);
    let endStr = formatTime(endDate);

    let logLine = `${dayOfWeek} ${dateStr}, Début: ${startStr}, Fin: ${endStr}, Total travaillé: ${hours}h ${minutes}m\n`;

    let currentLog = fm.readString(logPath);
    fm.writeString(logPath, currentLog + logLine);

    // Cancel the reminder notification since we're stopping work
    await cancelReminderNotification();

    // Reset state
    state.working = false;
    state.onBreak = false;
    state.startTime = null;
    state.breaks = [];
    saveState();

    let stopAlert = new Alert();
    stopAlert.title = 'Session terminée';
    stopAlert.message =
      'Session de travail terminée et enregistrée avec succès.';
    stopAlert.addAction('OK');
    await stopAlert.present();
  } else {
    // Cancel
    console.log('Aucune modification.');
  }
} else if (state.working && state.onBreak) {
  // Currently on a break: ask to end break
  let alert = new Alert();
  alert.title = 'Terminer la pause ?';
  alert.addAction('Oui');
  alert.addCancelAction('Non');
  let response = await alert.present();

  if (response == 0) {
    // End break
    let currentBreak = state.breaks[state.breaks.length - 1];
    currentBreak.end = Date.now();
    state.onBreak = false;
    saveState();
    console.log('Pause terminée.');
  } else {
    console.log('Toujours en pause.');
  }
}
