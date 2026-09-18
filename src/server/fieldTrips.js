const APP_TIMEZONE = 'America/New_York';
const DATABASE_PROPERTY = 'D3_FIELD_TRIPS_SHEET_ID';

const D3_SCHOOLS = [
  { id: '03M009', name: 'P.S. 009 Sarah Anderson', type: 'District - Zoned', address: '100 West 84 Street, Manhattan, NY 10024', grades: 'PK-5' },
  { id: '03M075', name: 'P.S. 075 Emily Dickinson', type: 'District - Zoned', address: '735 West End Avenue, Manhattan, NY 10025', grades: 'K-5' },
  { id: '03M084', name: 'P.S. 084 Lillian Weber', type: 'District - Zoned', address: '32 West 92 Street, Manhattan, NY 10025', grades: 'PK-5' },
  { id: '03M087', name: 'P.S. 087 William Sherman', type: 'District - Zoned', address: '160 West 78 Street, Manhattan, NY 10024', grades: 'PK-5' },
  { id: '03M145', name: 'P.S. 145, The Bloomingdale School', type: 'District - Zoned', address: '150 West 105 Street, Manhattan, NY 10025', grades: 'PK-5' },
  { id: '03M149', name: 'P.S. 149 Sojourner Truth', type: 'District - Zoned', address: '41 West 117 Street, Manhattan, NY 10026', grades: 'PK-8' },
  { id: '03M163', name: 'P.S. 163 Alfred E. Smith', type: 'District - Zoned', address: '163 West 97 Street, Manhattan, NY 10025', grades: 'PK-5' },
  { id: '03M165', name: 'P.S. 165 Robert E. Simon', type: 'District - Zoned', address: '234 West 109 Street, Manhattan, NY 10025', grades: 'PK-5' },
  { id: '03M166', name: 'P.S. 166 The Richard Rodgers School of the Arts and Technology', type: 'District - Zoned', address: '132 West 89 Street, Manhattan, NY 10024', grades: 'K-5' },
  { id: '03M180', name: 'P.S. 180 Hugo Newman', type: 'District - Zoned', address: '370 West 120 Street, Manhattan, NY 10027', grades: 'PK-5' },
  { id: '03M199', name: 'P.S. 199 Jessie Isador Straus', type: 'District - Zoned', address: '270 West 70 Street, Manhattan, NY 10023', grades: 'K-5' },
  { id: '03M242', name: 'P.S. 242 - The Young Diplomats Magnet Academy', type: 'District - Zoned', address: '134 West 122 Street, Manhattan, NY 10027', grades: 'PK-5' },
  { id: '03M452', name: 'P.S. 452', type: 'District - Zoned', address: '210 West 61 Street, Manhattan, NY 10023', grades: 'PK-5' },
  { id: '03M241', name: 'STEM Institute of Manhattan', type: 'District - Zoned', address: '240 West 113 Street, Manhattan, NY 10026', grades: 'PK-5' },
  { id: '03M185', name: 'The Locke School of Arts and Engineering', type: 'District - Zoned', address: '20 West 112 Street, Manhattan, NY 10026', grades: 'PK-5' },
  { id: '03M191', name: 'The Riverside School for Makers and Artists', type: 'District - Zoned', address: '300 West 61 Street, Manhattan, NY 10023', grades: 'PK-8' },

  { id: '03M258', name: 'Community Action School - MS 258', type: 'District - Choice', address: '154 West 93 Street, Manhattan, NY 10025', grades: '6-8' },
  { id: '03M485', name: 'Fiorello H. LaGuardia High School of Music & Art and Performing Arts', type: 'District - Choice', address: '100 Amsterdam Avenue, Manhattan, NY 10023', grades: '9-12' },
  { id: '03M417', name: 'Frank McCourt High School', type: 'District - Choice', address: '145 West 84 Street, Manhattan, NY 10024', grades: '9-12' },
  { id: '03M860', name: 'Frederick Douglass Academy II Secondary School', type: 'District - Choice', address: '215 West 114 Street, Manhattan, NY 10026', grades: '6-12' },
  { id: '03M492', name: 'High School for Law, Advocacy and Community Justice', type: 'District - Choice', address: '122 Amsterdam Avenue, Manhattan, NY 10023', grades: '9-12' },
  { id: '03M494', name: 'High School of Arts and Technology', type: 'District - Choice', address: '122 Amsterdam Avenue, Manhattan, NY 10023', grades: '9-12' },
  { id: '03M054', name: 'J.H.S. 054 Booker T. Washington', type: 'District - Choice', address: '103 West 107 Street, Manhattan, NY 10025', grades: '6-8' },
  { id: '03M256', name: 'Lafayette Academy', type: 'District - Choice', address: '154 West 93 Street, Manhattan, NY 10025', grades: '6-8' },
  { id: '03M243', name: 'M.S. 243 Center School', type: 'District - Choice', address: '100 West 84 Street, Manhattan, NY 10024', grades: '5-8' },
  { id: '03M245', name: 'M.S. M245 The Computer School', type: 'District - Choice', address: '100 West 77 Street, Manhattan, NY 10024', grades: '6-8' },
  { id: '03M247', name: 'M.S. M247 Dual Language Middle School', type: 'District - Choice', address: '100 West 77 Street, Manhattan, NY 10024', grades: '6-8' },
  { id: '03M541', name: 'Manhattan / Hunter Science High School', type: 'District - Choice', address: '122 Amsterdam Avenue, Manhattan, NY 10023', grades: '9-12' },
  { id: '03M862', name: 'Mott Hall II', type: 'District - Choice', address: '234 West 109 Street, Manhattan, NY 10025', grades: '6-9' },
  { id: '03M333', name: 'P.S. 333 Manhattan School for Children', type: 'District - Choice', address: '154 West 93 Street, Manhattan, NY 10025', grades: 'K-8' },
  { id: '03M859', name: 'Special Music School', type: 'District - Choice', address: '129 West 67 Street, Manhattan, NY 10023', grades: 'K-12' },
  { id: '03M334', name: 'The Anderson School', type: 'District - Choice', address: '100 West 77 Street, Manhattan, NY 10024', grades: 'K-8' },
  { id: '03M403', name: 'The Global Learning Collaborative', type: 'District - Choice', address: '145 West 84 Street, Manhattan, NY 10024', grades: '9-12' },
  { id: '03M402', name: 'The Urban Assembly School for Green Careers', type: 'District - Choice', address: '145 West 84 Street, Manhattan, NY 10024', grades: '9-12' },
  { id: '03M307', name: 'Urban Assembly School for Media Studies, The', type: 'District - Choice', address: '122 Amsterdam Avenue, Manhattan, NY 10023', grades: '9-12' },
  { id: '03M415', name: 'Wadleigh Secondary School for the Performing & Visual Arts', type: 'District - Choice', address: '215 West 114 Street, Manhattan, NY 10026', grades: '6-12' },
  { id: '03M291', name: 'West End Secondary School', type: 'District - Choice', address: '227-243 West 61 Street, Manhattan, NY 10023', grades: '6-12' },
  { id: '03M421', name: 'West Prep Academy', type: 'District - Choice', address: '220 West 108 Street, Manhattan, NY 10025', grades: '6-8' },
  { id: '03M610', name: "Young Women's Leadership School", type: 'District - Choice', address: '140 West 102 Street, Manhattan, NY 10025', grades: '6-12' },

  { id: 'CH-FLI', name: 'Future Leaders Institute Charter School', type: 'Charter', address: '134 West 122 Street, Manhattan, NY 10027', grades: 'K-8' },
  { id: 'CH-HARLEM-LINK', name: 'Harlem Link Charter School', type: 'Charter', address: '21 West 111 Street, Manhattan, NY 10026', grades: 'PK-6' },
  { id: 'CH-KIPP-BEYOND', name: 'KIPP Beyond Charter School', type: 'Charter', address: '535 West 121 Street, Manhattan, NY 10027', grades: '6-11' },
  { id: 'CH-NYFACS', name: 'New York French-American Charter School', type: 'Charter', address: '311 West 120 Street, Manhattan, NY 10027', grades: 'PK-8' },
  { id: 'CH-OPPORTUNITY', name: 'Opportunity Charter School', type: 'Charter', address: '240 West 113 Street, Manhattan, NY 10026', grades: '6-12' },
  { id: 'CH-SA-H1', name: 'Success Academy Charter School - Harlem 1', type: 'Charter', address: '34 West 118 Street, Manhattan, NY 10026', grades: 'K-12' },
  { id: 'CH-SA-H4', name: 'Success Academy Charter School - Harlem 4', type: 'Charter', address: '240 West 113 Street, Manhattan, NY 10026', grades: 'K-8' },
  { id: 'CH-SA-UWS', name: 'Success Academy Charter School - Upper West', type: 'Charter', address: '145 West 84 Street, Manhattan, NY 10024', grades: 'K-4' }
];

const OUTREACH_CONTACTS = [
  { schoolId: 'DISTRICT-3', school: 'NYC Public Schools District 3', name: 'Reginald Higgins', role: 'Superintendent', email: 'rhiggins@schools.nyc.gov', phone: '', verified: '2026-09-17' },
  { schoolId: 'DISTRICT-3', school: 'NYC Public Schools District 3', name: 'Tracy Mcclaire', role: 'Family Leadership Coordinator', email: 'TMcClaire@schools.nyc.gov', phone: '', verified: '2026-09-17' },
  { schoolId: 'DISTRICT-3', school: 'NYC Public Schools District 3', name: 'Patricia Lysius', role: 'Family Support Coordinator', email: 'plysius2@schools.nyc.gov', phone: '', verified: '2026-09-17' },
  { schoolId: '03M452', school: 'P.S. 452', name: 'Sharon Lustig', role: 'Parent Coordinator', email: 'slustig3@schools.nyc.gov', phone: '212-259-6222', verified: '2026-09-17' },
  { schoolId: '03M334', school: 'The Anderson School', name: 'Ann Crenovich', role: 'Parent Coordinator', email: 'acrenovich@schools.nyc.gov', phone: '212-595-7193', verified: '2026-09-17' },
  { schoolId: '03M333', school: 'P.S. 333 Manhattan School for Children', name: 'Iraida Perez', role: 'Parent Coordinator', email: 'iperez39@schools.nyc.gov', phone: '212-222-1450', verified: '2026-09-17' },
  { schoolId: '03M180', school: 'P.S. 180 Hugo Newman', name: 'Maryum Delves Opa', role: 'Parent Coordinator', email: 'mdelvesopa@schools.nyc.gov', phone: '212-678-2849', verified: '2026-09-17' },
  { schoolId: '03M417', school: 'Frank McCourt High School', name: 'Jazmin Garcia', role: 'Parent Coordinator', email: 'jgarcia71@schools.nyc.gov', phone: '212-362-2015', verified: '2026-09-17' },
  { schoolId: '03M199', school: 'P.S. 199 Jessie Isador Straus', name: 'Sara Lise Raff', role: 'Parent Coordinator', email: 'sraff3@schools.nyc.gov', phone: '212-799-1033', verified: '2026-09-17' },
  { schoolId: '03M054', school: 'J.H.S. 054 Booker T. Washington', name: 'Anne Mcintosh', role: 'Parent Coordinator', email: 'amcintosh6@schools.nyc.gov', phone: '212-678-2861', verified: '2026-09-17' },
  { schoolId: '03M145', school: 'P.S. 145, The Bloomingdale School', name: 'Rania Amer', role: 'Parent Coordinator', email: 'ramer@schools.nyc.gov', phone: '212-678-2857', verified: '2026-09-17' },
  { schoolId: '03M242', school: 'P.S. 242 - The Young Diplomats Magnet Academy', name: 'Ashley Nunez', role: 'Parent Coordinator', email: 'anunez61@schools.nyc.gov', phone: '212-678-2908', verified: '2026-09-17' },
  { schoolId: '03M241', school: 'STEM Institute of Manhattan', name: 'Crystal Johnson', role: 'Parent Coordinator', email: 'cjohnson95@schools.nyc.gov', phone: '212-678-2898', verified: '2026-09-17' },
  { schoolId: '03M258', school: 'Community Action School - MS 258', name: 'Atanisha Lewis', role: 'Parent Coordinator', email: 'ilewis9@schools.nyc.gov', phone: '212-678-5888', verified: '2026-09-17' },
  { schoolId: '03M243', school: 'M.S. 243 Center School', name: 'Joshua Weinberger', role: 'Parent Coordinator', email: 'jweinberger4@schools.nyc.gov', phone: '212-799-1477', verified: '2026-09-17' },
  { schoolId: '03M075', school: 'P.S. 075 Emily Dickinson', name: 'Mariel Martinez', role: 'Parent Coordinator', email: 'mmartinez121@schools.nyc.gov', phone: '212-866-5400', verified: '2026-09-17' },
  { schoolId: '03M185', school: 'The Locke School of Arts and Engineering', name: 'Tsharaye Preston', role: 'Parent Coordinator', email: 'tpreston@schools.nyc.gov', phone: '212-534-7490', verified: '2026-09-17' },
  { schoolId: '03M492', school: 'High School for Law, Advocacy and Community Justice', name: 'Claudia Reyes', role: 'Parent Coordinator', email: 'creyes47@schools.nyc.gov', phone: '212-501-1201', verified: '2026-09-17' },
  { schoolId: '03M494', school: 'High School of Arts and Technology', name: 'Jeffrey Santos', role: 'Parent Coordinator', email: 'jsantos55@schools.nyc.gov', phone: '212-501-1198', verified: '2026-09-17' },
  { schoolId: '03M610', school: "Young Women's Leadership School", name: 'Nelly Lopez Alvear', role: 'Parent Coordinator', email: 'nlopezalvear@schools.nyc.gov', phone: '212-678-7390', verified: '2026-09-17' },
  { schoolId: '03M291', school: 'West End Secondary School', name: 'Karyn Gooden', role: 'Parent Coordinator', email: 'kgooden5@schools.nyc.gov', phone: '212-245-1506', verified: '2026-09-17' }
];

const WORKSHOPS = [
  {
    id: 'robot-rescue',
    title: 'Robot Rescue Mission',
    subtitle: 'LEGO robotics + FLL-style teamwork',
    icon: '🤖',
    ages: 'Grades 3-8',
    duration: '90 minutes',
    capacity: 30,
    description: 'Students build and program a LEGO robot to complete a rescue mission. Teams test, debug, improve, and explain their engineering choices.',
    objectives: ['Build a simple robot mechanism', 'Use sequence, loops, and debugging', 'Practice iterative engineering design', 'Collaborate using defined team roles'],
    standards: ['NYS CS&DF: Computational Thinking', 'NYSP12SLS: Engineering Design', 'NYS Math: measurement and problem solving'],
    pathway: 'Robotics → coding → engineering design'
  },
  {
    id: '3d-invention',
    title: 'Invent It in 3D',
    subtitle: 'CAD design + 3D printing',
    icon: '🧊',
    ages: 'Grades 4-12',
    duration: '90 minutes',
    capacity: 30,
    description: 'Students turn a real-world need into a digital 3D model and learn how a design moves from CAD software to a 3D printer.',
    objectives: ['Sketch with constraints', 'Create a basic CAD model', 'Connect scale and measurement to fabrication', 'Explain design trade-offs'],
    standards: ['NYSP12SLS: Engineering Design', 'NYS CS&DF: Digital Literacy', 'NYS Math: geometry and measurement'],
    pathway: 'Design thinking → CAD → additive manufacturing'
  },
  {
    id: 'laser-lab',
    title: 'Laser Lab: Design, Cut, Create',
    subtitle: 'Vector design + laser cutting',
    icon: '✨',
    ages: 'Grades 6-12',
    duration: '90 minutes',
    capacity: 24,
    description: 'Students create a vector design for a tag, sign, or small prototype while learning how digital drawings become precise machine instructions.',
    objectives: ['Create vector geometry', 'Plan size, material, and tolerances', 'Learn safe digital fabrication workflow', 'Evaluate a finished prototype'],
    standards: ['NYSP12SLS: Engineering Design', 'NYS CS&DF: Digital Literacy', 'NYS Arts: creating and presenting'],
    pathway: 'Graphic design → fabrication → prototype'
  },
  {
    id: 'solar-city',
    title: 'Solar City Challenge',
    subtitle: 'Environmental engineering + solar power',
    icon: '☀️',
    ages: 'Grades 4-12',
    duration: '90 minutes',
    capacity: 30,
    description: 'Teams design a small solar-powered neighborhood concept, test panel angle and light conditions, and use evidence to improve energy output.',
    objectives: ['Measure solar energy output', 'Compare design variables', 'Use evidence to improve a solution', 'Connect clean energy to NYC infrastructure'],
    standards: ['NYSP12SLS: Energy', 'NYSP12SLS: Engineering Design', 'NYS Math: data and graphing'],
    pathway: 'Energy science → data → environmental engineering'
  },
  {
    id: 'code-quest',
    title: 'Code Quest: Make It Move',
    subtitle: 'Block coding for young creators',
    icon: '🧩',
    ages: 'Grades 2-7',
    duration: '75 minutes',
    capacity: 30,
    description: 'Students use friendly block coding to make a character, robot, or virtual system react, move, repeat actions, and solve a challenge.',
    objectives: ['Build an algorithm with blocks', 'Use events and loops', 'Debug a sequence', 'Explain cause and effect in code'],
    standards: ['NYS CS&DF: Computational Thinking', 'NYS CS&DF: Impacts of Computing'],
    pathway: 'Logic → block coding → robotics/software'
  },
  {
    id: 'smart-world',
    title: 'Smart World: Sensors & Circuits',
    subtitle: 'Physical computing',
    icon: '🔌',
    ages: 'Grades 6-12',
    duration: '90 minutes',
    capacity: 24,
    description: 'Students connect sensors, lights, and simple code to build a physical system that reacts to the world around it.',
    objectives: ['Identify input, process, and output', 'Wire a simple circuit', 'Read sensor data', 'Program a responsive device'],
    standards: ['NYS CS&DF: Networks and Systems Design', 'NYSP12SLS: Engineering Design'],
    pathway: 'Circuits → sensors → Arduino/physical computing'
  },
  {
    id: 'sound-engineers',
    title: 'Sound Engineers: Build a Beat Machine',
    subtitle: 'Sound + electronics + coding',
    icon: '🎛️',
    ages: 'Grades 6-12',
    duration: '90 minutes',
    capacity: 24,
    description: 'Students explore frequency, vibration, speakers, microphones, and simple electronic or coded sound effects.',
    objectives: ['Relate vibration to sound', 'Test pitch and frequency changes', 'Build or code a simple sound system', 'Document experimental results'],
    standards: ['NYSP12SLS: Waves and Information', 'NYS CS&DF: Computational Thinking'],
    pathway: 'Physics → electronics → sound engineering'
  },
  {
    id: 'chemistry-makers',
    title: 'Chemistry Makers: Reactions in Action',
    subtitle: 'Chemistry engineering',
    icon: '🧪',
    ages: 'Grades 4-10',
    duration: '75 minutes',
    capacity: 28,
    description: 'Students investigate safe, classroom-scale reactions and use observations to think like process engineers: measure, compare, redesign.',
    objectives: ['Record evidence of chemical change', 'Control variables', 'Compare reaction conditions', 'Connect chemistry to engineered products'],
    standards: ['NYSP12SLS: Matter and Its Interactions', 'NYSP12SLS: Engineering Design'],
    pathway: 'Chemistry → testing → process engineering'
  },
  {
    id: 'eco-sensor',
    title: 'Eco Detectives: Measure the Invisible',
    subtitle: 'Environmental sensors + data',
    icon: '🌿',
    ages: 'Grades 6-12',
    duration: '90 minutes',
    capacity: 24,
    description: 'Students use environmental sensors to investigate air, light, temperature, or humidity and turn the readings into an engineering question.',
    objectives: ['Collect sensor data', 'Identify patterns', 'Discuss data quality', 'Propose an evidence-based environmental solution'],
    standards: ['NYSP12SLS: Earth and Human Activity', 'NYS CS&DF: Data and Computational Thinking'],
    pathway: 'Environmental science → sensors → data engineering'
  }
];

const RESERVATION_HEADERS = [
  'Created At', 'Reservation ID', 'Status', 'School ID', 'School Name',
  'Contact Name', 'Contact Email', 'Contact Phone', 'Grade(s)',
  'Expected Students', 'Actual Students', 'Adults / Chaperones',
  'Workshop ID', 'Workshop Title', 'Date', 'Time', 'Duration',
  'Accessibility / Learning Needs', 'Notes', 'Risk Form Version',
  'Risk Acknowledged', 'Risk Signer', 'Confirmation Sent'
];

export const getAppData = () => {
  const spreadsheet = ensureDatabase_();
  return {
    schools: D3_SCHOOLS,
    contacts: OUTREACH_CONTACTS,
    workshops: WORKSHOPS,
    availability: getAvailability_(),
    district: {
      name: 'NYC Public Schools District 3',
      area: 'Upper West Side, Morningside Heights, and West Harlem',
      schoolCount: D3_SCHOOLS.length
    },
    demo: true,
    databaseReady: Boolean(spreadsheet)
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
    throw new Error('Please complete the demo risk acknowledgement.');
  }

  const school = D3_SCHOOLS.find((item) => item.id === payload.schoolId);
  const workshop = WORKSHOPS.find((item) => item.id === payload.workshopId);
  if (!school || !workshop) {
    throw new Error('The selected school or activity could not be found.');
  }

  const ss = ensureDatabase_();
  const reservations = ss.getSheetByName('Reservations');
  const values = reservations.getDataRange().getValues();

  const duplicate = values.slice(1).some((row) => {
    const status = String(row[2] || '').toUpperCase();
    return String(row[14]) === payload.date &&
      String(row[15]) === payload.time &&
      status !== 'CANCELLED';
  });
  if (duplicate) {
    throw new Error('That date and time was just reserved. Please choose another open slot.');
  }

  const reservationId = createReservationId_(payload.date);
  const now = Utilities.formatDate(new Date(), APP_TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

  reservations.appendRow([
    now,
    reservationId,
    'PENDING CONFIRMATION',
    school.id,
    school.name,
    payload.contactName,
    payload.contactEmail,
    payload.contactPhone || '',
    payload.grades || '',
    Number(payload.expectedStudents || 0),
    '',
    Number(payload.adults || 0),
    workshop.id,
    workshop.title,
    payload.date,
    payload.time,
    workshop.duration,
    payload.accessibility || '',
    payload.notes || '',
    'DEMO-v1 / replace with official assumption-of-risk form',
    payload.riskAcknowledged ? 'YES' : 'NO',
    payload.riskSigner,
    'NO'
  ]);

  return {
    ok: true,
    reservationId,
    status: 'PENDING CONFIRMATION',
    school: school.name,
    workshop: workshop.title,
    date: payload.date,
    time: payload.time
  };
};

export const getAvailability = () => getAvailability_();

export const getDatabaseInfo = () => {
  const ss = ensureDatabase_();
  return {
    name: ss.getName(),
    id: ss.getId(),
    url: ss.getUrl()
  };
};

function ensureDatabase_() {
  const properties = PropertiesService.getScriptProperties();
  const existingId = properties.getProperty(DATABASE_PROPERTY);

  if (existingId) {
    try {
      return SpreadsheetApp.openById(existingId);
    } catch (error) {
      properties.deleteProperty(DATABASE_PROPERTY);
    }
  }

  const ss = SpreadsheetApp.create('D3 STEM Field Trips Reservations - DEMO');
  properties.setProperty(DATABASE_PROPERTY, ss.getId());

  const reservations = ss.getSheets()[0];
  reservations.setName('Reservations');
  reservations.getRange(1, 1, 1, RESERVATION_HEADERS.length).setValues([RESERVATION_HEADERS]);
  reservations.setFrozenRows(1);

  const schoolsSheet = ss.insertSheet('D3 Schools');
  schoolsSheet.getRange(1, 1, 1, 6).setValues([['School ID', 'School Name', 'Type', 'Address', 'Grades', 'Outreach Contact Status']]);
  const schoolRows = D3_SCHOOLS.map((school) => {
    const hasContact = OUTREACH_CONTACTS.some((contact) => contact.schoolId === school.id);
    return [school.id, school.name, school.type, school.address, school.grades, hasContact ? 'Public contact verified' : 'Contact research pending'];
  });
  schoolsSheet.getRange(2, 1, schoolRows.length, 6).setValues(schoolRows);
  schoolsSheet.setFrozenRows(1);

  const contactsSheet = ss.insertSheet('Outreach Contacts');
  contactsSheet.getRange(1, 1, 1, 8).setValues([['School ID', 'School', 'Contact Name', 'Role', 'Email', 'Phone', 'Verified', 'Outreach Note']]);
  const contactRows = OUTREACH_CONTACTS.map((contact) => [
    contact.schoolId,
    contact.school,
    contact.name,
    contact.role,
    contact.email,
    contact.phone,
    contact.verified,
    'Public NYCPS contact. Confirm the correct STEM / field-trip coordinator before outreach.'
  ]);
  contactsSheet.getRange(2, 1, contactRows.length, 8).setValues(contactRows);
  contactsSheet.setFrozenRows(1);

  const workshopsSheet = ss.insertSheet('Workshops');
  workshopsSheet.getRange(1, 1, 1, 8).setValues([['Workshop ID', 'Title', 'Grade Band', 'Duration', 'Capacity', 'Pathway', 'Learning Objectives', 'Standards']]);
  const workshopRows = WORKSHOPS.map((workshop) => [
    workshop.id,
    workshop.title,
    workshop.ages,
    workshop.duration,
    workshop.capacity,
    workshop.pathway,
    workshop.objectives.join(' | '),
    workshop.standards.join(' | ')
  ]);
  workshopsSheet.getRange(2, 1, workshopRows.length, 8).setValues(workshopRows);
  workshopsSheet.setFrozenRows(1);

  const availabilitySheet = ss.insertSheet('Availability');
  availabilitySheet.getRange(1, 1, 1, 4).setValues([['Date', 'Time', 'Status', 'Capacity']]);
  const availabilityRows = getAvailability_().flatMap((day) =>
    day.times.map((time) => [day.date, time, 'OPEN', 1])
  );
  if (availabilityRows.length) {
    availabilitySheet.getRange(2, 1, availabilityRows.length, 4).setValues(availabilityRows);
  }
  availabilitySheet.setFrozenRows(1);

  const settings = ss.insertSheet('Settings');
  settings.getRange(1, 1, 7, 2).setValues([
    ['Setting', 'Value'],
    ['App', 'D3 STEM Field Trips Demo'],
    ['Timezone', APP_TIMEZONE],
    ['Reservation status default', 'PENDING CONFIRMATION'],
    ['Risk form', 'DEMO PLACEHOLDER - replace with official form'],
    ['Media', 'Demo illustrations/placeholders - replace with NYC FIRST photos/videos'],
    ['Attendance', 'Enter Actual Students in Reservations after the visit']
  ]);

  autoResize_(ss);
  return ss;
}

function getAvailability_() {
  const slots = ['10:00 AM', '12:30 PM'];
  const output = [];
  const today = new Date();

  for (let offset = 1; offset <= 100; offset += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    const day = date.getDay();

    if (day === 2 || day === 3 || day === 4) {
      output.push({
        date: Utilities.formatDate(date, APP_TIMEZONE, 'yyyy-MM-dd'),
        label: Utilities.formatDate(date, APP_TIMEZONE, 'EEE, MMM d'),
        times: slots
      });
    }
  }

  return output;
}

function createReservationId_(dateString) {
  const compactDate = String(dateString).replace(/-/g, '');
  return 'D3-' + compactDate + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();
}

function autoResize_(ss) {
  ss.getSheets().forEach((sheet) => {
    const lastColumn = sheet.getLastColumn();
    if (lastColumn > 0) {
      sheet.autoResizeColumns(1, lastColumn);
    }
  });
}
