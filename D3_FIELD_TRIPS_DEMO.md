# D3 STEM Field Trips Demo

This branch contains a working prototype for a District 3 STEM field-trip reservation web app.

## Architecture

- **GitHub**: source code, version history, review, collaboration.
- **Google Apps Script**: live web application and server-side functions.
- **Google Sheets**: reservation database and staff operations table.
- **Google Drive**: stores the generated spreadsheet and future media/documents if desired.

The first time the app backend is called, it creates a spreadsheet named:

`D3 STEM Field Trips Reservations - DEMO`

and saves its spreadsheet ID in Script Properties.

## Demo features

- District 3 school directory with DBN, school type, address, grades, and outreach-contact status.
- Public District 3 leadership and school outreach contacts.
- Workshop catalog for robotics/FLL, 3D design, laser cutting, solar/environmental engineering, block coding, physical computing, chemistry, sound engineering, and environmental sensing.
- Activity detail modal with temporary illustrations/video placeholders.
- Four-step reservation flow.
- Clickable monthly availability calendar.
- Date/time collision check.
- Contact and group information.
- Accessibility/learning-needs field.
- Temporary assumption-of-risk acknowledgement placeholder.
- Reservation confirmation ID.
- Google Sheets database with separate tabs for Reservations, D3 Schools, Outreach Contacts, Workshops, Availability, and Settings.
- Attendance field (`Actual Students`) for staff to complete after the visit.
- Curriculum fields for scope/sequence, learning objectives, pathways, and standards.

## Important demo notes

1. Workshop titles, content, capacities, schedule, images/videos, and risk language are placeholders until the official material is supplied.
2. Public school contacts should be re-verified before outreach. A Parent Coordinator or district family contact is not automatically the official STEM/field-trip decision maker.
3. District 3 school data should be reconciled with the final official NYC FIRST/District 3 school list before launch.
4. The current availability generator opens Tuesdays, Wednesdays, and Thursdays at 10:00 AM and 12:30 PM for roughly the next 100 days. Replace this with the actual operating calendar.

## Deploy to Google Apps Script

The repository's `.clasp.json` still contains `<DEV_PROJECT_ID>`, so it is not yet connected to a real Apps Script project.

### First deployment

1. Install Node.js.
2. Clone this repository and checkout `d3-field-trips-demo`.
3. Run `npm install`.
4. Run `npx clasp login` and authorize the NYC FIRST Google account that should own the reservation spreadsheet.
5. Create a standalone Apps Script project:
   ```
   npx clasp create --type standalone --title "D3 STEM Field Trips" --rootDir ./dist
   ```
   Or create the project in script.google.com and put its Script ID into `.clasp.json`.
6. Run:
   ```
   npm run build
   npm run upload
   ```
7. In Apps Script open **Deploy → New deployment → Web app**.
8. Set **Execute as** to the deploying account.
9. Choose the access level appropriate for the program. For a public booking page, use the available public/anonymous option if organizational policy permits it; otherwise restrict to the intended Google Workspace audience.
10. Authorize Sheets/Drive permissions.
11. Copy the Web App URL. That becomes the booking link.

## Can it be hosted on GitHub Pages?

Yes, but not with this exact simplest architecture.

GitHub Pages can host the HTML/CSS/JavaScript front end, but it cannot directly run Apps Script server functions such as `SpreadsheetApp`. You would need a separate backend/API and authentication/CORS design.

For this project, the simplest setup is:

**GitHub = code repository**
→ **Google Apps Script Web App = live app**
→ **Google Sheets = reservation database**

This keeps the first version inexpensive and easier to maintain.

## Data flow

1. School user opens the Web App URL.
2. `getAppData()` loads schools, contacts, workshops, and open dates.
3. The user chooses a school, workshop, date, and time.
4. The user enters contact/group details and completes the risk acknowledgement.
5. `submitReservation()` checks that the slot is not already taken.
6. A reservation ID is generated.
7. A row is written to the `Reservations` sheet.
8. Staff can update status, actual attendance, and follow-up information in the sheet.
9. Future versions can automatically send confirmation emails, calendar invitations, reminders, risk-form links, and post-visit attendance requests.

## Suggested next additions

- Official workshop catalog and grade bands.
- Official assumption-of-risk/consent form.
- Real open dates tied to Google Calendar.
- Real activity photos and video embeds.
- Automatic email confirmation and reminders.
- Staff admin dashboard.
- Reservation cancel/reschedule links.
- Capacity rules by activity.
- Transportation/arrival instructions.
- School-specific curriculum alignment notes.
- Promotion/outreach status per school.
- CRM-like contact history.
