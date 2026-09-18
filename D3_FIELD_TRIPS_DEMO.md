# NYC FIRST D3 School Field Trip App 2026–2027

This branch contains the working prototype and production architecture for the District 3 School Field Trip system managed by NYC FIRST at the Washington Heights STEM Center.

## Architecture

The system has three user-facing layers plus Google Workspace services behind them.

### 1. Public School Front End
For District 3 schools, teachers, STEM coordinators, and school staff.

Core functions:
- Browse available STEM field-trip activities.
- Open activity details with grade band, duration, capacity, descriptions, curriculum, images, and videos.
- Share an individual activity link.
- Select school, activity, date, and time.
- Submit a reservation request.
- Access the NYC FIRST Member Card link.
- Access the NYC FIRST website and Washington Heights STEM Center page.
- View Washington Heights equipment and machine information.
- Contact Katiuska Hernandez at `kat@nycfirst.org` for field-trip cost information.

### 2. Google Apps Script Back End
Server-side application logic.

Core functions:
- Read public content from Google Sheets.
- Validate requested dates/times.
- Prevent duplicate booking of the same slot.
- Write reservation records.
- Send booking notifications.
- Create confirmed Google Calendar events.
- Include the Assumption of Risk link in confirmation/reminder communications.
- Run scheduled reminder automations.
- Authorize NYC FIRST staff dashboard access.
- Save staff edits back to the central database.

### 3. NYC FIRST Staff Admin Interface
Private interface for approved NYC FIRST staff.

Staff controls:
- Reservation review and approval.
- Manual reminder sending.
- Activities and public descriptions.
- Calendar / availability.
- Images and videos.
- Washington Heights equipment and software.
- District 3 school and STEM-teacher/contact database.
- Invitation letters.
- Reservation confirmation letters.
- Reminder letters.
- Monthly promotional communications.
- Assumption of Risk workflow.
- Attendance.
- System settings and automation controls.

Staff access is controlled through the `Staff Access` sheet and the signed-in Google account.

## Google Workspace Services

- **Google Sheets** — central database and content-management source.
- **Google Calendar** — confirmed field-trip calendar.
- **Gmail / MailApp** — school confirmations, staff alerts, reminders, invitations, and promotional campaigns.
- **Google Drive** — risk forms, activity images, media, documents, and future uploaded files.
- **Google Apps Script** — web app hosting, automation engine, permissions, and backend.
- **GitHub** — source control, review, version history, and deployment source.

## Live Database

The app is connected to the native Google Sheet:

**D3 School Field Trip APP 2026-2027**

Current tabs:
- Reservations
- D3 Schools
- Outreach Contacts
- Workshops
- Availability
- Risk Forms
- Email Campaigns
- Email Templates
- Media Library
- Staff Access
- Settings
- Attendance
- Equipment

## Reservation Workflow

1. School user opens the public field-trip app.
2. The app loads active schools, activities, equipment content, and available slots from Google Sheets.
3. The school selects a school, activity, date, and time.
4. Contact and attendance-estimate information is submitted.
5. The backend checks that the slot is still open.
6. The request is written to the `Reservations` sheet with status `REQUESTED`.
7. The selected availability slot is marked as booked/held.
8. A school request acknowledgement can be emailed automatically.
9. Every new reservation alert is configured for:
   - `patricio@nycfirst.org`
   - `mariana@nycfirst.org`
   - `kat@nycfirst.org`
10. NYC FIRST staff reviews the request in the Staff Admin interface.
11. Staff approves the request.
12. Status becomes `CONFIRMED`.
13. When enabled, the system creates a Google Calendar event.
14. A confirmation email is sent to the school.
15. The confirmation includes the official Assumption of Risk link once configured.
16. Daily automation can send reminders 7 days and 2 days before the visit.
17. After the field trip, staff enters actual attendance and closes the record.

## Communications

The database includes editable templates for:
- Reservation received
- Reservation confirmed
- Reminder communications
- Monthly District 3 promotion

The Staff Admin interface is designed to expand this into:
- invitation letters
- school outreach letters
- custom confirmation copy
- risk-form messages
- follow-up communications

## Public Links

- NYC FIRST: https://www.nycfirst.org/
- Washington Heights STEM Center: https://www.nycfirst.org/stem-center-locations/wh
- Washington Heights Member Card: https://dashboard.nycfirst.org/check-in/washington-heights

## Washington Heights STEM Center Content

The public app includes an equipment/machines section controlled by the `Equipment` sheet. Current items include:
- Epilog Helix 24 laser cutter
- ShopBot Desktop Max CNC router
- Markforged Onyx One
- Bambu Lab P1S
- Bambu Lab X1C
- Formlabs Form 2
- Apple iMac 27
- Autodesk Fusion 360
- Adobe Illustrator
- Adobe Photoshop
- Cricut Design Space
- Bambu Studio

The same system can be expanded with new machines/software without editing the public page code.

## Current Automation Controls

The `Settings` sheet includes:
- Cost contact name/email
- Internal reservation-alert recipients
- Assumption of Risk URL
- Email automation on/off
- Calendar automation on/off
- Calendar ID
- NYC FIRST website
- Member Card URL
- Staff Admin requirement
- Activity sharing
- Monthly outreach settings

Automations remain disabled until the final Apps Script project has been connected, permissions approved, and the production Calendar / Assumption of Risk URL supplied.

## Apps Script Deployment

The repository still needs to be connected to the final Apps Script project before production deployment.

1. Create or select the NYC FIRST Apps Script project.
2. Replace `<DEV_PROJECT_ID>` in `.clasp.json` with the real Script ID.
3. Build and upload:
   ```
   npm install
   npm run build
   npm run upload
   ```
4. Authorize the required Google scopes.
5. Deploy as a Web App.
6. Copy the production Web App URL into the `Public App URL` setting.
7. Open `?view=staff` for the Staff Admin interface.
8. Select the production Google Calendar and enter its Calendar ID.
9. Enter the official Assumption of Risk URL.
10. Enable email/calendar automations only after testing.

## OAuth / Permissions Used

The current manifest includes scopes for:
- Google Sheets
- Google Drive
- Gmail sending
- Calendar events
- staff identity
- Apps Script trigger creation
- external requests

## Important Launch Checks

Before public launch:
- Verify the final District 3 school list.
- Verify the correct STEM/field-trip contact at each school.
- Confirm official field-trip availability.
- Confirm workshop grade bands, durations, capacities, and descriptions.
- Add approved activity photos/videos.
- Supply the official Assumption of Risk form URL.
- Select the production field-trip Google Calendar.
- Review all email/letter templates.
- Test reservation submission, approval, duplicate-slot protection, confirmations, reminders, and attendance workflow.
- Confirm NYC FIRST Google Workspace policy for public Web App access.

## GitHub Role

GitHub is the development and source-control layer, not the production database.

**GitHub**
→ **Google Apps Script public + staff web interfaces**
→ **Google Sheets / Calendar / Gmail / Drive**
