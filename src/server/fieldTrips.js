const APP_TIMEZONE = 'America/New_York';
const SPREADSHEET_ID = '1DCUsuG_uV1u15rLWXlJ0-Tn3yk7JnsZfdMaBM3XjB8g';

export const getAppData = () => {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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

  return {
    schools,
    contacts,
    workshops,
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
  maybeCreateCalendarEvent_(payload, reservationId, schoolName, workshopTitle, endTime);
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
  const body = [
    'Thank you for requesting an NYC FIRST STEM field trip.',
    '',
    'Reservation ID: ' + reservationId,
    'School: ' + schoolName,
    'Activity: ' + workshopTitle,
    'Date: ' + payload.date,
    'Time: ' + payload.time + (endTime ? ' – ' + endTime : ''),
    'Expected students: ' + (payload.expectedStudents || ''),
    '',
    'Your request is pending staff review. We will send a final confirmation after review.',
    '',
    'NYC FIRST · Washington Heights STEM Center'
  ].join('\n');
  MailApp.sendEmail(payload.contactEmail, subject, body);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const staff = getObjects_(ss, 'Staff Access')
    .filter((r) => String(r['Active']).toUpperCase() === 'TRUE' &&
      String(r['Receive New Booking Alerts']).toUpperCase() === 'TRUE' &&
      r['Staff Email'])
    .map((r) => r['Staff Email']);
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
