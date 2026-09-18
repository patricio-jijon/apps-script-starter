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
  })).filter((r) => r.id && r.title && !['Draft','Archived'].includes(r.status));
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
      stemCenterPage: 'https://www.nycfirst.org/stem-center-locations/wh',
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

  holdAvailabilitySlot_(availability, payload.date, payload.time, reservationId);
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

function serializeRows_(rows) {
  return rows.map((row) => serializeObject_(row));
}

function serializeObject_(obj) {
  const out = {};
  Object.keys(obj || {}).forEach((key) => {
    const value = obj[key];
    out[key] = value instanceof Date
      ? Utilities.formatDate(value, APP_TIMEZONE, 'yyyy-MM-dd')
      : value;
  });
  return out;
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

function holdAvailabilitySlot_(sheet, date, time, reservationId) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i += 1) {
    if (normalizeDate_(values[i][0]) === date &&
        String(values[i][1]) === time &&
        String(values[i][3]).toUpperCase() === 'OPEN') {
      sheet.getRange(i + 1, 4).setValue('HOLD');
      const existingNote = String(values[i][7] || '').trim();
      sheet.getRange(i + 1, 8).setValue(
        (existingNote ? existingNote + ' | ' : '') + 'Reservation hold: ' + reservationId
      );
      return true;
    }
  }
  return false;
}

function confirmAvailabilitySlot_(sheet, date, time, calendarEventId) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i += 1) {
    if (normalizeDate_(values[i][0]) === date &&
        String(values[i][1]) === time &&
        ['HOLD','OPEN'].includes(String(values[i][3]).toUpperCase())) {
      sheet.getRange(i + 1, 4).setValue('BOOKED');
      if (calendarEventId) sheet.getRange(i + 1, 7).setValue(calendarEventId);
      return true;
    }
  }
  return false;
}

function reopenAvailabilitySlot_(sheet, date, time) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i += 1) {
    if (normalizeDate_(values[i][0]) === date && String(values[i][1]) === time) {
      sheet.getRange(i + 1, 4).setValue('OPEN');
      sheet.getRange(i + 1, 7).clearContent();
      const note = String(values[i][7] || '').replace(/\s*\|?\s*Reservation hold: [^|]+/g, '').trim();
      sheet.getRange(i + 1, 8).setValue(note);
      return true;
    }
  }
  return false;
}

function maybeCreateCalendarEvent_(payload, reservationId, schoolName, workshopTitle, endTime) {
  const settings = getSettings_();
  if (String(settings['Enable Calendar Automations']).toUpperCase() !== 'TRUE') return '';
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
    reservations: serializeRows_(getObjects_(ss, 'Reservations')),
    schools: serializeRows_(getObjects_(ss, 'D3 Schools')),
    workshops: serializeRows_(getObjects_(ss, 'Workshops')),
    equipment: serializeRows_(getObjects_(ss, 'Equipment')),
    availability: serializeRows_(getObjects_(ss, 'Availability')),
    contacts: serializeRows_(getObjects_(ss, 'Outreach Contacts')),
    campaigns: serializeRows_(getObjects_(ss, 'Email Campaigns')),
    templates: serializeRows_(getObjects_(ss, 'Email Templates')),
    media: serializeRows_(getObjects_(ss, 'Media Library')),
    riskForms: serializeRows_(getObjects_(ss, 'Risk Forms')),
    attendance: serializeRows_(getObjects_(ss, 'Attendance')),
    communicationLog: serializeRows_(getObjects_(ss, 'Communication Log')).reverse().slice(0, 500),
    analytics: buildStaffAnalytics_(ss),
    settings: serializeObject_(getSettings_()),
    staffEmail: Session.getActiveUser().getEmail(),
  };
};

export const recordAttendance = (reservationId, payload) => {
  verifyStaff_();
  if (!reservationId) throw new Error('Reservation ID is required.');
  payload = payload || {};

  const actualStudents = Number(payload.actualStudents);
  if (!Number.isFinite(actualStudents) || actualStudents < 0) {
    throw new Error('Actual students must be a number of 0 or greater.');
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const reservations = ss.getSheetByName('Reservations');
  const data = reservations.getDataRange().getValues();
  const headers = data[0].map((h) => String(h || '').trim());
  const idIndex = headers.indexOf('Reservation ID');
  if (idIndex < 0) throw new Error('Reservation ID column is missing.');

  let rowIndex = -1;
  let row = null;
  for (let i = 1; i < data.length; i += 1) {
    if (String(data[i][idIndex]) === String(reservationId)) {
      rowIndex = i;
      row = data[i].slice();
      break;
    }
  }
  if (!row) throw new Error('Reservation not found: ' + reservationId);
  if (String(row[headers.indexOf('Status')] || '').toUpperCase() === 'CANCELLED') {
    throw new Error('Attendance cannot be entered for a cancelled reservation.');
  }

  const setReservation = (header, value) => {
    const index = headers.indexOf(header);
    if (index >= 0) row[index] = value;
  };

  setReservation('Actual Students', actualStudents);
  if (payload.adults !== '' && payload.adults !== undefined && payload.adults !== null) {
    const adults = Number(payload.adults);
    if (!Number.isFinite(adults) || adults < 0) throw new Error('Adults / chaperones must be 0 or greater.');
    setReservation('Adults / Chaperones', adults);
  }
  setReservation('Attendance Entered', 'YES');
  setReservation('Status', 'COMPLETED');
  reservations.getRange(rowIndex + 1, 1, 1, headers.length).setValues([row]);

  const get = (header) => row[headers.indexOf(header)];
  const attendanceSheet = ss.getSheetByName('Attendance');
  const attendanceData = attendanceSheet.getDataRange().getValues();
  const attendanceHeaders = attendanceData[0].map((h) => String(h || '').trim());
  const attendanceIdIndex = attendanceHeaders.indexOf('Reservation ID');
  let attendanceRowNumber = -1;
  for (let i = 1; i < attendanceData.length; i += 1) {
    if (String(attendanceData[i][attendanceIdIndex]) === String(reservationId)) {
      attendanceRowNumber = i + 1;
      break;
    }
  }

  const completedBy = String(Session.getActiveUser().getEmail() || '');
  const checkInTime = String(payload.checkInTime || '').trim() ||
    Utilities.formatDate(new Date(), APP_TIMEZONE, 'h:mm a');
  const attendanceValues = {
    'Reservation ID': reservationId,
    'School': String(get('School Name') || ''),
    'Workshop': String(get('Workshop Title') || ''),
    'Date': normalizeDate_(get('Date')),
    'Expected Students': Number(get('Expected Students')) || 0,
    'Actual Students': actualStudents,
    'Adults / Chaperones': Number(get('Adults / Chaperones')) || 0,
    'Check-in Time': checkInTime,
    'Completed By': completedBy,
    'Notes': String(payload.notes || ''),
  };
  const attendanceRow = attendanceHeaders.map((header) =>
    Object.prototype.hasOwnProperty.call(attendanceValues, header) ? attendanceValues[header] : ''
  );

  if (attendanceRowNumber > 0) {
    attendanceSheet.getRange(attendanceRowNumber, 1, 1, attendanceHeaders.length).setValues([attendanceRow]);
  } else {
    attendanceSheet.appendRow(attendanceRow);
  }

  return {
    ok: true,
    reservationId,
    status: 'COMPLETED',
    actualStudents,
    adults: Number(get('Adults / Chaperones')) || 0,
  };
};

export const markSchoolContacted = (contactEmail, notes) => {
  verifyStaff_();
  const email = String(contactEmail || '').trim().toLowerCase();
  if (!email) throw new Error('A contact email is required.');

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Outreach Contacts');
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map((h) => String(h || '').trim());
  const emailIndex = headers.indexOf('Email');
  const contactedIndex = headers.indexOf('Last Contacted');
  if (emailIndex < 0 || contactedIndex < 0) throw new Error('Outreach contact columns are missing.');

  for (let i = 1; i < data.length; i += 1) {
    if (String(data[i][emailIndex] || '').trim().toLowerCase() === email) {
      const today = Utilities.formatDate(new Date(), APP_TIMEZONE, 'yyyy-MM-dd');
      sheet.getRange(i + 1, contactedIndex + 1).setValue(today);
      const row = {};
      headers.forEach((header, index) => { if (header) row[header] = data[i][index]; });
      logCommunication_(ss, {
        schoolId: String(row['School ID / DBN'] || ''),
        school: String(row['School'] || ''),
        contactName: String(row['Contact Name'] || ''),
        contactEmail: String(row['Email'] || contactEmail),
        type: 'FOLLOW-UP',
        subject: 'Manual school follow-up',
        notes: String(notes || 'Marked contacted from Staff Admin.'),
      });
      return {ok: true, email: contactEmail, lastContacted: today};
    }
  }
  throw new Error('Contact not found: ' + contactEmail);
};

export const updateRiskFormStatus = (reservationId, payload) => {
  verifyStaff_();
  payload = payload || {};
  const allowedStatuses = ['NOT SENT','SENT','SIGNED','MISSING','VERIFIED'];
  const status = String(payload.status || '').toUpperCase();
  if (!allowedStatuses.includes(status)) throw new Error('Invalid risk-form status.');

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const reservations = getObjects_(ss, 'Reservations');
  const reservation = reservations.find((r) => String(r['Reservation ID']) === String(reservationId));
  if (!reservation) throw new Error('Reservation not found: ' + reservationId);

  const riskSheet = ss.getSheetByName('Risk Forms');
  const data = riskSheet.getDataRange().getValues();
  const headers = data[0].map((h) => String(h || '').trim());
  const idIndex = headers.indexOf('Reservation ID');
  let rowNumber = -1;
  let existing = {};
  for (let i = 1; i < data.length; i += 1) {
    if (String(data[i][idIndex]) === String(reservationId)) {
      rowNumber = i + 1;
      headers.forEach((h, j) => { if (h) existing[h] = data[i][j]; });
      break;
    }
  }

  const values = {
    'Reservation ID': reservationId,
    'School': String(reservation['School Name'] || ''),
    'Field Trip Date': normalizeDate_(reservation['Date']),
    'Participant / Form Reference': String(existing['Participant / Form Reference'] || 'School group'),
    'Guardian / Signer': String(payload.signerName || existing['Guardian / Signer'] || reservation['Contact Name'] || ''),
    'Email': String(payload.email || existing['Email'] || reservation['Contact Email'] || ''),
    'Sent Date': String(payload.sentDate || existing['Sent Date'] || ''),
    'Signed Date': String(payload.signedDate || existing['Signed Date'] || ''),
    'Status': status,
    'Drive File / Folder': String(payload.fileUrl || existing['Drive File / Folder'] || reservation['Risk Form Folder / Link'] || ''),
    'Staff Verified': status === 'VERIFIED' ? 'YES' : String(payload.staffVerified || existing['Staff Verified'] || 'NO'),
    'Notes': String(payload.notes || existing['Notes'] || ''),
  };
  const row = headers.map((header) =>
    Object.prototype.hasOwnProperty.call(values, header) ? values[header] : ''
  );
  if (rowNumber > 0) riskSheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
  else riskSheet.appendRow(row);

  const reservationSheet = ss.getSheetByName('Reservations');
  const resData = reservationSheet.getDataRange().getValues();
  const resHeaders = resData[0].map((h) => String(h || '').trim());
  const resIdIndex = resHeaders.indexOf('Reservation ID');
  const riskStatusIndex = resHeaders.indexOf('Risk Form Status');
  const riskLinkIndex = resHeaders.indexOf('Risk Form Folder / Link');
  const statusIndex = resHeaders.indexOf('Status');
  for (let i = 1; i < resData.length; i += 1) {
    if (String(resData[i][resIdIndex]) !== String(reservationId)) continue;
    if (riskStatusIndex >= 0) reservationSheet.getRange(i + 1, riskStatusIndex + 1).setValue(status);
    if (riskLinkIndex >= 0 && values['Drive File / Folder']) reservationSheet.getRange(i + 1, riskLinkIndex + 1).setValue(values['Drive File / Folder']);
    if (statusIndex >= 0 && status === 'SENT') reservationSheet.getRange(i + 1, statusIndex + 1).setValue('RISK FORMS SENT');
    if (statusIndex >= 0 && ['SIGNED','VERIFIED'].includes(status)) reservationSheet.getRange(i + 1, statusIndex + 1).setValue('RISK FORMS COMPLETE');
    break;
  }
  return {ok: true, reservationId, status};
};

export const sendRiskFormLink = (reservationId) => {
  verifyStaff_();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const settings = getSettings_();
  if (String(settings['Enable Email Automations']).toUpperCase() !== 'TRUE') {
    throw new Error('Email automations are disabled in Settings.');
  }
  const riskUrl = String(settings['Risk Form URL'] || '').trim();
  if (!riskUrl || riskUrl === 'TBD') throw new Error('Add the official Risk Form URL in Settings first.');

  const reservation = getObjects_(ss, 'Reservations')
    .find((r) => String(r['Reservation ID']) === String(reservationId));
  if (!reservation) throw new Error('Reservation not found: ' + reservationId);

  const email = String(reservation['Contact Email'] || '').trim();
  if (!email) throw new Error('This reservation does not have a contact email.');
  const subject = 'NYC FIRST Assumption of Risk Form — ' + reservationId;
  const body = [
    'Please complete the Assumption of Risk form for your NYC FIRST school field trip.',
    '',
    'Reservation ID: ' + reservationId,
    'School: ' + String(reservation['School Name'] || ''),
    'Field trip date: ' + normalizeDate_(reservation['Date']),
    'Activity: ' + String(reservation['Workshop Title'] || ''),
    '',
    'Assumption of Risk form: ' + riskUrl,
    '',
    'NYC FIRST · Washington Heights STEM Center'
  ].join('\n');
  MailApp.sendEmail(email, subject, body);

  updateRiskFormStatus(reservationId, {
    status: 'SENT',
    sentDate: Utilities.formatDate(new Date(), APP_TIMEZONE, 'yyyy-MM-dd'),
    fileUrl: riskUrl,
    signerName: String(reservation['Contact Name'] || ''),
    email,
    notes: 'Risk form link sent manually from Staff Admin.',
  });

  logCommunication_(ss, {
    schoolId: String(reservation['School ID / DBN'] || ''),
    school: String(reservation['School Name'] || ''),
    contactName: String(reservation['Contact Name'] || ''),
    contactEmail: email,
    type: 'RISK FORM',
    subject,
    reservationId,
    notes: 'Risk form link sent.',
  });
  return {ok: true, reservationId, email};
};

export const geocodeD3Schools = () => {
  verifyStaff_();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('D3 Schools');
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return {ok: true, updated: 0, remaining: 0, failed: 0};

  const headers = data[0].map((h) => String(h || '').trim());
  const addressCol = headers.indexOf('Address');
  const latCol = headers.indexOf('Latitude');
  const lngCol = headers.indexOf('Longitude');
  if (addressCol < 0 || latCol < 0 || lngCol < 0) {
    throw new Error('D3 Schools needs Address, Latitude, and Longitude columns.');
  }

  const geocoder = Maps.newGeocoder().setRegion('us');
  let updated = 0;
  let failed = 0;
  const maxPerRun = 25;

  for (let i = 1; i < data.length && updated < maxPerRun; i += 1) {
    const address = String(data[i][addressCol] || '').trim();
    const hasLat = Number.isFinite(Number(data[i][latCol])) && String(data[i][latCol]).trim() !== '';
    const hasLng = Number.isFinite(Number(data[i][lngCol])) && String(data[i][lngCol]).trim() !== '';
    if (!address || (hasLat && hasLng)) continue;

    try {
      const result = geocoder.geocode(address);
      if (result && result.status === 'OK' && result.results && result.results.length) {
        const location = result.results[0].geometry.location;
        sheet.getRange(i + 1, latCol + 1).setValue(location.lat);
        sheet.getRange(i + 1, lngCol + 1).setValue(location.lng);
        updated += 1;
      } else {
        failed += 1;
      }
    } catch (error) {
      failed += 1;
    }
    Utilities.sleep(120);
  }

  const refreshed = sheet.getDataRange().getValues();
  let remaining = 0;
  for (let i = 1; i < refreshed.length; i += 1) {
    const address = String(refreshed[i][addressCol] || '').trim();
    const lat = String(refreshed[i][latCol] || '').trim();
    const lng = String(refreshed[i][lngCol] || '').trim();
    if (address && (!lat || !lng)) remaining += 1;
  }

  return {ok: true, updated, remaining, failed};
};

export const saveStaffRecord = (sheetName, keyHeader, keyValue, values) => {
  verifyStaff_();
  const allowed = {
    'D3 Schools': true,
    'Workshops': true,
    'Availability': true,
    'Outreach Contacts': true,
    'Email Campaigns': true,
    'Email Templates': true,
    'Media Library': true,
    'Risk Forms': true,
    'Attendance': true,
    'Equipment': true,
    'Communication Log': true,
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

  const calendarEventId = createConfirmedCalendarEvent_(payload, reservationId, schoolName, workshopTitle, endTime);
  confirmAvailabilitySlot_(ss.getSheetByName('Availability'), payload.date, payload.time, calendarEventId);
  const confirmationSent = sendConfirmedReservationEmail_(payload, reservationId, schoolName, workshopTitle, endTime);
  const riskSent = upsertRiskFormRecord_(ss, {
    reservationId,
    schoolName,
    fieldTripDate: payload.date,
    signerName: String(get('Contact Name') || ''),
    email: String(get('Contact Email') || ''),
  });

  const riskStatusCol = headers.indexOf('Risk Form Status') + 1;
  const riskLinkCol = headers.indexOf('Risk Form Folder / Link') + 1;
  if (riskStatusCol > 0 && riskSent.sent) sheet.getRange(rowNumber, riskStatusCol).setValue('SENT');
  if (riskLinkCol > 0 && riskSent.url) sheet.getRange(rowNumber, riskLinkCol).setValue(riskSent.url);
  if (confirmationCol > 0) sheet.getRange(rowNumber, confirmationCol).setValue(confirmationSent ? 'YES' : 'NO');
  return {ok: true, reservationId, status: 'CONFIRMED', confirmationSent, calendarEventId: calendarEventId || ''};
};

export const cancelReservation = (reservationId) => {
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
  sheet.getRange(rowNumber, statusCol).setValue('CANCELLED');
  if (approvalCol > 0) sheet.getRange(rowNumber, approvalCol).setValue('CANCELLED');

  reopenAvailabilitySlot_(
    ss.getSheetByName('Availability'),
    normalizeDate_(get('Date')),
    String(get('Start Time') || '')
  );

  return {ok: true, reservationId, status: 'CANCELLED'};
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

function upsertRiskFormRecord_(ss, details) {
  const settings = getSettings_();
  const riskUrl = String(settings['Risk Form URL'] || '').trim();
  if (!riskUrl || riskUrl === 'TBD') return {sent: false, url: ''};

  const sheet = ss.getSheetByName('Risk Forms');
  if (!sheet) return {sent: false, url: riskUrl};
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map((h) => String(h || '').trim());
  const idIndex = headers.indexOf('Reservation ID');
  const values = {
    'Reservation ID': details.reservationId,
    'School': details.schoolName,
    'Field Trip Date': details.fieldTripDate,
    'Participant / Form Reference': 'School group',
    'Guardian / Signer': details.signerName,
    'Email': details.email,
    'Sent Date': Utilities.formatDate(new Date(), APP_TIMEZONE, 'yyyy-MM-dd'),
    'Signed Date': '',
    'Status': 'SENT',
    'Drive File / Folder': riskUrl,
    'Staff Verified': 'NO',
    'Notes': 'Risk form link included with confirmed field-trip communication.',
  };
  const row = headers.map((header) =>
    Object.prototype.hasOwnProperty.call(values, header) ? values[header] : ''
  );

  let rowNumber = -1;
  for (let i = 1; i < data.length; i += 1) {
    if (idIndex >= 0 && String(data[i][idIndex]) === String(details.reservationId)) {
      rowNumber = i + 1;
      break;
    }
  }
  if (rowNumber > 0) sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
  else sheet.appendRow(row);
  return {sent: true, url: riskUrl};
}

function createConfirmedCalendarEvent_(payload, reservationId, schoolName, workshopTitle, endTime) {
  const settings = getSettings_();
  if (String(settings['Enable Calendar Automations']).toUpperCase() !== 'TRUE') return;
  const calendarId = String(settings['Calendar ID'] || '').trim();
  if (!calendarId || calendarId === 'TBD') return '';
  const calendar = CalendarApp.getCalendarById(calendarId);
  if (!calendar) return '';
  const start = parseDateTime_(payload.date, payload.time);
  const end = endTime ? parseDateTime_(payload.date, endTime) : new Date(start.getTime() + 90 * 60000);
  const event = calendar.createEvent(
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
  return event.getId();
}

function sendConfirmedReservationEmail_(payload, reservationId, schoolName, workshopTitle, endTime) {
  const settings = getSettings_();
  if (String(settings['Enable Email Automations']).toUpperCase() !== 'TRUE') return false;
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
  return true;
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

function logCommunication_(ss, details) {
  const sheet = ss.getSheetByName('Communication Log');
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  const headers = (data[0] || []).map((h) => String(h || '').trim());
  const values = {
    'Timestamp': Utilities.formatDate(new Date(), APP_TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
    'School ID / DBN': String(details.schoolId || ''),
    'School': String(details.school || ''),
    'Contact Name': String(details.contactName || ''),
    'Contact Email': String(details.contactEmail || ''),
    'Type': String(details.type || ''),
    'Subject / Purpose': String(details.subject || ''),
    'Reservation ID': String(details.reservationId || ''),
    'Campaign ID': String(details.campaignId || ''),
    'Staff Email': String(Session.getActiveUser().getEmail() || ''),
    'Notes': String(details.notes || ''),
  };
  sheet.appendRow(headers.map((header) =>
    Object.prototype.hasOwnProperty.call(values, header) ? values[header] : ''
  ));
}

function buildStaffAnalytics_(ss) {
  const schools = getObjects_(ss, 'D3 Schools');
  const contacts = getObjects_(ss, 'Outreach Contacts');
  const reservations = getObjects_(ss, 'Reservations');
  const attendanceRows = getObjects_(ss, 'Attendance');

  const attendanceByReservation = {};
  attendanceRows.forEach((row) => {
    const id = String(row['Reservation ID'] || '').trim();
    if (!id) return;
    attendanceByReservation[id] = row;
  });

  const contactBySchool = {};
  contacts.forEach((contact) => {
    const schoolId = String(contact['School ID / DBN'] || '').trim();
    if (!schoolId || schoolId === 'DISTRICT-3') return;
    const existing = contactBySchool[schoolId];
    const role = String(contact['Role'] || '');
    const priority = /STEM|SCIENCE|ROBOT|ENGINEER|TEACHER/i.test(role) ? 2 : 1;
    const existingPriority = existing && /STEM|SCIENCE|ROBOT|ENGINEER|TEACHER/i.test(String(existing['Role'] || '')) ? 2 : (existing ? 1 : 0);
    if (!existing || priority > existingPriority) contactBySchool[schoolId] = contact;
  });

  const statsBySchool = {};
  schools.forEach((school) => {
    const id = String(school['School ID / DBN'] || '').trim();
    if (!id) return;
    const contact = contactBySchool[id] || {};
    statsBySchool[id] = {
      schoolId: id,
      schoolName: String(school['School Name'] || ''),
      type: String(school['Type'] || ''),
      address: String(school['Address'] || ''),
      grades: String(school['Grades'] || ''),
      latitude: Number(school['Latitude']) || null,
      longitude: Number(school['Longitude']) || null,
      contactName: String(contact['Contact Name'] || ''),
      contactEmail: String(contact['Email'] || ''),
      contactRole: String(contact['Role'] || ''),
      contactPhone: String(contact['Phone'] || ''),
      outreachStatus: String(contact['Outreach Status'] || school['Outreach Contact Status'] || ''),
      lastContacted: normalizeDate_(contact['Last Contacted']),
      contactNotes: String(contact['Notes'] || ''),
      fieldTripContactName: '',
      fieldTripContactEmail: '',
      fieldTripContactPhone: '',
      fieldTripContactDate: '',
      reservations: 0,
      confirmed: 0,
      cancelled: 0,
      completedTrips: 0,
      expectedStudents: 0,
      actualStudents: 0,
      lastTrip: '',
    };
  });

  const monthly = {};
  const activities = {};
  let totalReservations = 0;
  let totalCancelled = 0;
  let totalCompletedTrips = 0;
  let totalExpected = 0;
  let totalActual = 0;
  let completedExpectedStudents = 0;

  reservations.forEach((reservation) => {
    const schoolId = String(reservation['School ID / DBN'] || '').trim();
    const stat = statsBySchool[schoolId];
    if (!stat) return;

    const status = String(reservation['Status'] || '').toUpperCase();
    const expected = Number(reservation['Expected Students']) || 0;
    const attendance = attendanceByReservation[String(reservation['Reservation ID'] || '').trim()] || {};
    const actual = Number(reservation['Actual Students']) || Number(attendance['Actual Students']) || 0;
    const date = normalizeDate_(reservation['Date']);
    const activity = String(reservation['Workshop Title'] || '').trim();

    if (status !== 'CANCELLED' && date && (!stat.fieldTripContactDate || date >= stat.fieldTripContactDate)) {
      stat.fieldTripContactDate = date;
      stat.fieldTripContactName = String(reservation['Contact Name'] || '');
      stat.fieldTripContactEmail = String(reservation['Contact Email'] || '');
      stat.fieldTripContactPhone = String(reservation['Contact Phone'] || '');
    }

    if (status === 'CANCELLED') {
      stat.cancelled += 1;
      totalCancelled += 1;
      return;
    }

    stat.reservations += 1;
    totalReservations += 1;
    stat.expectedStudents += expected;
    totalExpected += expected;

    if (['CONFIRMED','RISK FORMS SENT','RISK FORMS COMPLETE','REMINDER SENT','COMPLETED'].includes(status)) {
      stat.confirmed += 1;
    }

    if (activity) activities[activity] = (activities[activity] || 0) + 1;

    if (actual > 0 || status === 'COMPLETED') {
      stat.completedTrips += 1;
      stat.actualStudents += actual;
      totalCompletedTrips += 1;
      totalActual += actual;
      completedExpectedStudents += expected;
      if (date && (!stat.lastTrip || date > stat.lastTrip)) stat.lastTrip = date;
      if (date) {
        const month = date.slice(0, 7);
        if (!monthly[month]) monthly[month] = {month, attendance: 0, trips: 0};
        monthly[month].attendance += actual;
        monthly[month].trips += 1;
      }
    }
  });

  const schoolStats = Object.values(statsBySchool);
  const topSchools = schoolStats
    .filter((s) => s.actualStudents > 0 || s.completedTrips > 0)
    .sort((a, b) => b.actualStudents - a.actualStudents || b.completedTrips - a.completedTrips)
    .slice(0, 12);

  const activityStats = Object.keys(activities)
    .map((name) => ({name, bookings: activities[name]}))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 12);

  const followUp = schoolStats
    .map((s) => ({
      ...s,
      followUpName: s.fieldTripContactName || s.contactName,
      followUpEmail: s.fieldTripContactEmail || s.contactEmail,
      followUpPhone: s.fieldTripContactPhone || s.contactPhone,
      followUpRole: s.fieldTripContactEmail ? 'Field Trip Contact' : s.contactRole,
      followUpSource: s.fieldTripContactEmail ? 'Latest reservation' : (s.contactEmail ? 'Outreach database' : ''),
    }))
    .filter((s) => s.followUpEmail || s.followUpName || s.reservations > 0)
    .sort((a, b) => (b.lastTrip || b.fieldTripContactDate || '').localeCompare(a.lastTrip || a.fieldTripContactDate || '') || b.actualStudents - a.actualStudents);

  return {
    totals: {
      schools: schoolStats.length,
      schoolsWithTrips: schoolStats.filter((s) => s.completedTrips > 0).length,
      reservations: totalReservations,
      cancelled: totalCancelled,
      completedTrips: totalCompletedTrips,
      expectedStudents: totalExpected,
      completedExpectedStudents,
      actualStudents: totalActual,
      attendanceRate: completedExpectedStudents > 0 ? Math.round((totalActual / completedExpectedStudents) * 1000) / 10 : 0,
    },
    schoolStats,
    topSchools,
    monthly: Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)),
    activities: activityStats,
    followUp,
  };
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
