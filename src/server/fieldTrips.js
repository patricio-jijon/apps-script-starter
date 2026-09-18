const APP_TIMEZONE = 'America/New_York';
const SPREADSHEET_ID = '1DCUsuG_uV1u15rLWXlJ0-Tn3yk7JnsZfdMaBM3XjB8g';

export const getAppData = () => {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const settings = getSettings_();
  const schools = getObjects_(ss, 'D3 Schools').map((r) => ({
    id: r['School ID / DBN'] || '',
    name: r['School Name'] || '',
    type: r['Type'] || '',
    address: r['Address'] || '',
    grades: r['Grades'] || '',
    contactStatus: r['Outreach Contact Status'] || '',
    active: String(r['Active']).toLowerCase() !== 'false',
  })).filter((r) => r.name && r.active);

  const contacts = getObjects_(ss, 'Outreach Contacts').map((r) => ({
    schoolId: r['School ID / DBN'] || '',
    school: r['School'] || '',
    name: r['Contact Name'] || '',
    role: r['Role'] || '',
    email: r['Email'] || '',
    phone: r['Phone'] || '',
    verified: r['Verified'] || '',
    outreachStatus: r['Outreach Status'] || '',
  })).filter((r) => r.school || r.name);

  const workshops = getObjects_(ss, 'Workshops').map((r) => ({
    id: r['Workshop ID'] || '',
    title: r['Public Title'] || r['Internal / Official Title'] || '',
    officialTitle: r['Internal / Official Title'] || '',
    category: r['Category'] || 'STEM',
    description: r['Description'] || 'Workshop description coming soon.',
    source: r['Source'] || '',
    icon: r['Icon'] || '🧠',
    status: r['Publication Status'] || 'Draft',
    ages: r['Age / Grade Band'] || 'Grades / ages TBD',
    duration: r['Duration'] || 'Duration TBD',
    capacity: r['Capacity'] || 'TBD',
    objectives: splitPipe_(r['Learning Objectives']),
    standards: splitPipe_(r['Academic Standards']),
    photo: r['Photo / Media'] || '',
    video: r['Video URL'] || '',
  })).filter((r) => r.id && r.title && r.status !== 'Archived');
  const equipment = getObjects_(ss, 'Equipment').map((r) => ({
    category: r['Category'] || '',
    name: r['Equipment / Software'] || '',
    type: r['Type / Use'] || '',
    description: r['Public Description'] || '',
    sourceUrl: r['Source URL'] || '',
    active: String(r['Active']).toLowerCase() !== 'false',
  })).filter((r) => r.name && r.active);


  return {
    schools,
    contacts,
    workshops,
    equipment,
    availability: getAvailability_(),
    district: {
      name: 'NYC Public Schools District 3',
      area: 'Upper West Side, Morningside Heights, and West Harlem',
      schoolCount: schools.length,
    },
    brand: {
      organization: 'NYC FIRST',
      program: 'D3 School Field Trips 2026-2027',
      stemCenter: 'Washington Heights STEM Center',
      tagline: 'What STEM education should be.',
    },
    publicContacts: {
      costName: String(settings['Cost Contact Name'] || 'Katiuska Hernandez'),
      costEmail: String(settings['Cost Contact Email'] || 'kat@nycfirst.org'),
    },
    publicLinks: {
      website: String(settings['NYC FIRST Website'] || 'https://www.nycfirst.org/'),
      memberCard: String(settings['Member Card Submission URL'] || 'https://dashboard.nycfirst.org/check-in/washington-heights'),
      riskForm: String(settings['Risk Form URL'] || ''),
    },
    demo: false,
    databaseReady: true,
  };
};

export const submitReservation = (payload) => {
  if (!payload || !payload.schoolId || !payload.workshopId || !payload.date || !payload.time) {
    throw new Error('Please select a school, activity, date, and time.');
  }
  if (!payload.contactName || !payload.contactEmail) {
    throw new Error('Please enter a contact name and email.');
  }
  if (!payload.riskAcknowledged || !payload.riskSigner) {
    throw new Error('Please complete the risk-form acknowledgement.');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const schools = getObjects_(ss, 'D3 Schools');
  const workshops = getObjects_(ss, 'Workshops');
  const school = schools.find((r) => String(r['School ID / DBN']) === String(payload.schoolId));
  const workshop = workshops.find((r) => String(r['Workshop ID']) === String(payload.workshopId));
  if (!school || !workshop) throw new Error('The selected school or activity could not be found.');

  const reservations = ss.getSheetByName('Reservations');
  const rows = reservations.getDataRange().getValues();
  const duplicate = rows.slice(1).some((row) => {
    const status = String(row[2] || '').toUpperCase();
    return String(row[14] || '') === payload.date &&
      String(row[15] || '') === payload.time &&
      !['CANCELLED'].includes(status);
  });
  if (duplicate) throw new Error('That date and time is already reserved. Please choose another open slot.');

  const availability = ss.getSheetByName('Availability');
  const openRows = getObjects_(ss, 'Availability');
  const selectedSlot = openRows.find((r) =>
    normalizeDate_(r['Date']) === payload.date &&
    String(r['Start Time']) === payload.time &&
    String(r['Status']).toUpperCase() === 'OPEN'
  );
  if (!selectedSlot) throw new Error('That time is no longer available. Please choose another open slot.');

  const reservationId = createReservationId_(payload.date);
  const now = Utilities.formatDate(new Date(), APP_TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  const endTime = selectedSlot['End Time'] || '';
  const workshopTitle = workshop['Public Title'] || workshop['Internal / Official Title'];
  const schoolName = school['School Name'];

  reservations.appendRow([
    now, reservationId, 'REQUESTED', school['School ID / DBN'], schoolName,
    payload.contactName, payload.contactEmail, payload.contactPhone || '',
    payload.grades || '', Number(payload.expectedStudents || 0), '',
    Number(payload.adults || 0), workshop['Workshop ID'], workshopTitle,
    payload.date, payload.time, endTime,
    payload.accessibility || '', payload.notes || '',
    'NOT SENT', '', 'PENDING', 'NO', 'NO', 'NO', 'NO'
  ]);

  markAvailabilityBooked_(availability, payload.date, payload.time, reservationId);
  maybeSendReservationEmails_(payload, reservationId, schoolName, workshopTitle, endTime);

  return {
    ok: true,
    reservationId,
    status: 'REQUESTED',
    school: schoolName,
    workshop: workshopTitle,
    date: payload.date,
    time: payload.time,
  };
};

export const getAvailability = () => getAvailability_();

export const getDatabaseInfo = () => {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return { name: ss.getName(), id: ss.getId(), url: ss.getUrl() };
};

function getAvailability_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rows = getObjects_(ss, 'Availability').filter((r) => String(r['Status']).toUpperCase() === 'OPEN');
  const grouped = {};
  rows.forEach((r) => {
    const date = normalizeDate_(r['Date']);
    if (!date) return;
    if (!grouped[date]) grouped[date] = [];
    const time = String(r['Start Time'] || '');
    if (time && !grouped[date].includes(time)) grouped[date].push(time);
  });
  return Object.keys(grouped).sort().map((date) => ({
    date,
    label: Utilities.formatDate(new Date(date + 'T12:00:00'), APP_TIMEZONE, 'EEE, MMM d'),
    times: grouped[date],
  }));
}

function getObjects_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values[0].map((h) => String(h || '').trim());
  return values.slice(1).filter((row) => row.some((v) => v !== '')).map((row) => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = row[i]; });
    return obj;
  });
}

function splitPipe_(value) {
  const text = String(value || '').trim();
  if (!text || text.toLowerCase().includes('tbd') || text.toLowerCase().includes('to be aligned')) return [];
  return text.split('|').map((s) => s.trim()).filter(Boolean);
}

function normalizeDate_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, APP_TIMEZONE, 'yyyy-MM-dd');
  const s = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s;
}

function markAvailabilityBooked_(sheet, date, time, reservationId) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i += 1) {
    if (normalizeDate_(values[i][0]) === date &&
        String(values[i][1]) === time &&
        String(values[i][3]).toUpperCase() === 'OPEN') {
      sheet.getRange(i + 1, 4).setValue('BOOKED');
      sheet.getRange(i + 1, 7).setValue(reservationId);
      return;
    }
  }
}

function maybeCreateCalendarEvent_(payload, reservationId, schoolName, workshopTitle, endTime) {
  const settings = getSettings_();
  if (String(settings['Enable Calendar Automations']).toUpperCase() !== 'TRUE') return;
  const calendarId = String(settings['Calendar ID'] || '').trim();
  if (!calendarId) return;
  const calendar = CalendarApp.getCalendarById(calendarId);
  if (!calendar) return;
  const start = parseDateTime_(payload.date, payload.time);
  const end = endTime ? parseDateTime_(payload.date, String(endTime)) : new Date(start.getTime() + 90 * 60000);
  calendar.createEvent(
    schoolName + ' — ' + workshopTitle,
    start,
    end,
    {description: 'Reservation ID: ' + reservationId + '\nContact: ' + payload.contactName + ' <' + payload.contactEmail + '>'}
  );
}

function maybeSendReservationEmails_(payload, reservationId, schoolName, workshopTitle, endTime) {
  const settings = getSettings_();
  if (String(settings['Enable Email Automations']).toUpperCase() !== 'TRUE') return;

  const subject = 'NYC FIRST D3 Field Trip Request — ' + reservationId;
  const riskFormUrl = String(settings['Risk Form URL'] || '').trim();
  const costContact = String(settings['Cost Contact Email'] || 'kat@nycfirst.org').trim();
  const lines = [
    'Thank you for requesting an NYC FIRST STEM field trip.',
    '',
    'Reservation ID: ' + reservationId,
    'School: ' + schoolName,
    'Activity: ' + workshopTitle,
    'Date: ' + payload.date,
    'Time: ' + payload.time + (endTime ? ' – ' + endTime : ''),
    'Expected students: ' + (payload.expectedStudents || ''),
    '',
    'Your request is pending staff review. We will send a final confirmation after review.'
  ];
  if (riskFormUrl && riskFormUrl !== 'TBD') {
    lines.push('', 'Assumption of Risk form: ' + riskFormUrl);
  }
  lines.push('', 'Questions about field-trip cost: Katiuska Hernandez — ' + costContact);
  lines.push('', 'NYC FIRST · Washington Heights STEM Center');
  const body = lines.join('\n');
  MailApp.sendEmail(payload.contactEmail, subject, body);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const explicitRecipients = String(settings['Internal Booking Alert Emails'] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const staffRecipients = getObjects_(ss, 'Staff Access')
    .filter((r) => String(r['Active']).toUpperCase() === 'TRUE' &&
      String(r['Receive New Booking Alerts']).toUpperCase() === 'TRUE' &&
      r['Staff Email'])
    .map((r) => String(r['Staff Email']).trim());
  const staff = [...new Set(explicitRecipients.concat(staffRecipients))];
  if (staff.length) {
    MailApp.sendEmail(staff.join(','), 'New D3 Field Trip Request — ' + reservationId, body);
  }
}

function getSettings_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rows = getObjects_(ss, 'Settings');
  const map = {};
  rows.forEach((r) => { map[String(r['Setting'] || '')] = r['Value']; });
  return map;
}

function parseDateTime_(dateString, timeString) {
  const parts = String(timeString).match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!parts) return new Date(dateString + 'T10:00:00');
  let hour = Number(parts[1]);
  const minute = Number(parts[2]);
  const ap = parts[3].toUpperCase();
  if (ap === 'PM' && hour !== 12) hour += 12;
  if (ap === 'AM' && hour === 12) hour = 0;
  return new Date(dateString + 'T' + String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0') + ':00');
}

function createReservationId_(dateString) {
  return 'D3-' + String(dateString).replace(/-/g, '') + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();
}


export const getStaffAdminData = () => {
  verifyStaff_();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return {
    reservations: getObjects_(ss, 'Reservations'),
    workshops: getObjects_(ss, 'Workshops'),
    equipment: getObjects_(ss, 'Equipment'),
    availability: getObjects_(ss, 'Availability'),
    contacts: getObjects_(ss, 'Outreach Contacts'),
    campaigns: getObjects_(ss, 'Email Campaigns'),
    templates: getObjects_(ss, 'Email Templates'),
    media: getObjects_(ss, 'Media Library'),
    riskForms: getObjects_(ss, 'Risk Forms'),
    attendance: getObjects_(ss, 'Attendance'),
    settings: getSettings_(),
    staffEmail: Session.getActiveUser().getEmail(),
  };
};

export const saveStaffRecord = (sheetName, keyHeader, keyValue, values) => {
  verifyStaff_();
  const allowed = {
    'Workshops': true,
    'Availability': true,
    'Outreach Contacts': true,
    'Email Campaigns': true,
    'Email Templates': true,
    'Media Library': true,
    'Risk Forms': true,
    'Attendance': true,
    'Equipment': true,
  };
  if (!allowed[sheetName]) throw new Error('This section cannot be edited from the staff interface.');
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map((h) => String(h || '').trim());
  const keyIndex = headers.indexOf(keyHeader);
  if (keyIndex < 0) throw new Error('Key column not found: ' + keyHeader);

  let rowNumber = -1;
  let existingRow = new Array(headers.length).fill('');
  for (let i = 1; i < data.length; i += 1) {
    if (String(data[i][keyIndex]) === String(keyValue)) {
      rowNumber = i + 1;
      existingRow = data[i].slice();
      break;
    }
  }

  const row = headers.map((header, i) =>
    Object.prototype.hasOwnProperty.call(values, header) ? values[header] : existingRow[i]
  );
  row[keyIndex] = keyValue;

  if (rowNumber > 0) {
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  return {ok: true, sheetName, keyValue};
};

export const saveSetting = (settingName, value, notes) => {
  verifyStaff_();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Settings');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i += 1) {
    if (String(data[i][0]) === String(settingName)) {
      sheet.getRange(i + 1, 2).setValue(value);
      if (notes !== undefined) sheet.getRange(i + 1, 3).setValue(notes || '');
      return {ok: true, setting: settingName, value};
    }
  }
  sheet.appendRow([settingName, value, notes || '']);
  return {ok: true, setting: settingName, value};
};

export const approveReservation = (reservationId) => {
  verifyStaff_();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Reservations');
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map((h) => String(h || '').trim());
  const idCol = headers.indexOf('Reservation ID');
  if (idCol < 0) throw new Error('Reservation ID column is missing.');

  let rowNumber = -1;
  let row = null;
  for (let i = 1; i < data.length; i += 1) {
    if (String(data[i][idCol]) === String(reservationId)) {
      rowNumber = i + 1;
      row = data[i];
      break;
    }
  }
  if (!row) throw new Error('Reservation not found: ' + reservationId);

  const get = (name) => row[headers.indexOf(name)];
  const statusCol = headers.indexOf('Status') + 1;
  const approvalCol = headers.indexOf('Staff Approval') + 1;
  const confirmationCol = headers.indexOf('Confirmation Sent') + 1;

  sheet.getRange(rowNumber, statusCol).setValue('CONFIRMED');
  if (approvalCol > 0) sheet.getRange(rowNumber, approvalCol).setValue('APPROVED');

  const payload = {
    contactName: get('Contact Name'),
    contactEmail: get('Contact Email'),
    contactPhone: get('Contact Phone'),
    expectedStudents: get('Expected Students'),
    date: normalizeDate_(get('Date')),
    time: String(get('Start Time') || ''),
  };
  const endTime = String(get('End Time') || '');
  const schoolName = String(get('School Name') || '');
  const workshopTitle = String(get('Workshop Title') || '');

  createConfirmedCalendarEvent_(payload, reservationId, schoolName, workshopTitle, endTime);
  sendConfirmedReservationEmail_(payload, reservationId, schoolName, workshopTitle, endTime);

  if (confirmationCol > 0) sheet.getRange(rowNumber, confirmationCol).setValue('YES');
  return {ok: true, reservationId, status: 'CONFIRMED'};
};

export const sendReservationReminder = (reservationId) => {
  verifyStaff_();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rows = getObjects_(ss, 'Reservations');
  const r = rows.find((item) => String(item['Reservation ID']) === String(reservationId));
  if (!r) throw new Error('Reservation not found: ' + reservationId);
  sendReminderEmail_(r);
  return {ok: true, reservationId};
};

export const installD3AutomationTriggers = () => {
  verifyStaff_();
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === 'runD3DailyAutomation')
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('runD3DailyAutomation')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
  return {ok: true, message: 'Daily automation installed for approximately 8 AM.'};
};

export const runD3DailyAutomation = () => {
  const settings = getSettings_();
  if (String(settings['Enable Email Automations']).toUpperCase() !== 'TRUE') return {ok: true, skipped: true};
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Reservations');
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map((h) => String(h || '').trim());
  const col = (name) => headers.indexOf(name);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let sent = 0;
  for (let i = 1; i < data.length; i += 1) {
    const status = String(data[i][col('Status')] || '').toUpperCase();
    if (status !== 'CONFIRMED') continue;
    const dateStr = normalizeDate_(data[i][col('Date')]);
    if (!dateStr) continue;
    const tripDate = new Date(dateStr + 'T12:00:00');
    const days = Math.round((tripDate - today) / 86400000);

    if (days === 7 && String(data[i][col('Reminder 1 Sent')] || '').toUpperCase() !== 'YES') {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = data[i][idx]; });
      sendReminderEmail_(obj);
      sheet.getRange(i + 1, col('Reminder 1 Sent') + 1).setValue('YES');
      sent += 1;
    }
    if (days === 2 && String(data[i][col('Reminder 2 Sent')] || '').toUpperCase() !== 'YES') {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = data[i][idx]; });
      sendReminderEmail_(obj);
      sheet.getRange(i + 1, col('Reminder 2 Sent') + 1).setValue('YES');
      sent += 1;
    }
  }
  return {ok: true, sent};
};

function createConfirmedCalendarEvent_(payload, reservationId, schoolName, workshopTitle, endTime) {
  const settings = getSettings_();
  if (String(settings['Enable Calendar Automations']).toUpperCase() !== 'TRUE') return;
  const calendarId = String(settings['Calendar ID'] || '').trim();
  if (!calendarId || calendarId === 'TBD') return;
  const calendar = CalendarApp.getCalendarById(calendarId);
  if (!calendar) return;
  const start = parseDateTime_(payload.date, payload.time);
  const end = endTime ? parseDateTime_(payload.date, endTime) : new Date(start.getTime() + 90 * 60000);
  calendar.createEvent(
    schoolName + ' — ' + workshopTitle,
    start,
    end,
    {
      description: [
        'NYC FIRST D3 School Field Trip',
        'Reservation ID: ' + reservationId,
        'School: ' + schoolName,
        'Contact: ' + payload.contactName + ' <' + payload.contactEmail + '>',
        'Expected students: ' + (payload.expectedStudents || '')
      ].join('\n')
    }
  );
}

function sendConfirmedReservationEmail_(payload, reservationId, schoolName, workshopTitle, endTime) {
  const settings = getSettings_();
  if (String(settings['Enable Email Automations']).toUpperCase() !== 'TRUE') return;
  const riskFormUrl = String(settings['Risk Form URL'] || '').trim();
  const costEmail = String(settings['Cost Contact Email'] || 'kat@nycfirst.org').trim();
  const lines = [
    'Your NYC FIRST D3 school field trip is confirmed.',
    '',
    'Reservation ID: ' + reservationId,
    'School: ' + schoolName,
    'Activity: ' + workshopTitle,
    'Date: ' + payload.date,
    'Time: ' + payload.time + (endTime ? ' – ' + endTime : ''),
    'Expected students: ' + (payload.expectedStudents || '')
  ];
  if (riskFormUrl && riskFormUrl !== 'TBD') {
    lines.push('', 'Assumption of Risk form: ' + riskFormUrl);
  } else {
    lines.push('', 'Assumption of Risk form: the official link will be sent by NYC FIRST staff.');
  }
  lines.push('', 'Questions about field-trip cost: Katiuska Hernandez — ' + costEmail);
  lines.push('', 'NYC FIRST · Washington Heights STEM Center');
  MailApp.sendEmail(payload.contactEmail, 'NYC FIRST Field Trip Confirmed — ' + reservationId, lines.join('\n'));
}

function sendReminderEmail_(reservation) {
  const settings = getSettings_();
  if (String(settings['Enable Email Automations']).toUpperCase() !== 'TRUE') return;
  const riskFormUrl = String(settings['Risk Form URL'] || '').trim();
  const lines = [
    'Reminder: your NYC FIRST D3 school field trip is coming up.',
    '',
    'Reservation ID: ' + reservation['Reservation ID'],
    'School: ' + reservation['School Name'],
    'Activity: ' + reservation['Workshop Title'],
    'Date: ' + normalizeDate_(reservation['Date']),
    'Time: ' + reservation['Start Time'] + (reservation['End Time'] ? ' – ' + reservation['End Time'] : '')
  ];
  if (riskFormUrl && riskFormUrl !== 'TBD') lines.push('', 'Assumption of Risk form: ' + riskFormUrl);
  lines.push('', 'NYC FIRST · Washington Heights STEM Center');
  MailApp.sendEmail(String(reservation['Contact Email']), 'Reminder: NYC FIRST Field Trip — ' + reservation['Reservation ID'], lines.join('\n'));
}

function verifyStaff_() {
  const email = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!email) throw new Error('Staff sign-in is required.');
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const allowed = getObjects_(ss, 'Staff Access').some((r) =>
    String(r['Staff Email'] || '').toLowerCase() === email &&
    String(r['Admin Access']).toUpperCase() === 'TRUE' &&
    String(r['Active']).toUpperCase() === 'TRUE'
  );
  if (!allowed) throw new Error('This Google account is not authorized for the NYC FIRST staff dashboard.');
}
