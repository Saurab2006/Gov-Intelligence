# Civicदृष्टि

Civicदृष्टि ("Civic Vision") is a civic transparency and accountability platform for Nepal, built with Next.js, Express, MongoDB, and Mongoose. It combines two things in one app:

1. **Public budget transparency** — browse government budget records, analyze spending by sector/department/district/fiscal year, and propose or approve data changes.
2. **Civic issue reporting** — citizens report local problems (potholes, floods, drainage, electrical hazards, etc.), the community verifies them, the right authority takes ownership, and the outcome stays on record.

The interface is bilingual (English / नेपाली) and adapts by role — citizens, local body staff, ward representatives, and admins each see a dashboard scoped to what they're responsible for.

## Main Features

- **Civic issue chain** — report → verify → assign → resolve, with photo upload, duplicate detection, severity/status tracking, upvotes, and comments.
- **Budget explorer** — search and filter budget line items by sector, department, district, and fiscal year; view spend trends and department load.
- **Authorities & departments** — see which office owns which category of work, and their track record.
- **AI briefs** — plain-language summaries of budget and civic-issue trends.
- **Notices & notifications** — admins can broadcast an important notice (banner + email) to all users or a specific role; everyone gets in-app notifications for report status changes.
- **Ward representatives** — a scoped role limited to issues and budget items inside their approved ward, subject to admin approval on signup.
- **Bilingual UI** — every core page switches between English and Nepali from a single toggle.
- **Role-based data changes** — analysts propose edits, admins approve or reject them before they become official.

## User Roles

### Admin
- Manage users, roles, and ward representative applications.
- View all dashboards and reports.
- Review and approve/reject pending budget change requests.
- Broadcast important notices to the whole app or a specific role.

### Analyst (Local Body Staff)
- View dashboards, analytics, budget records, departments, and civic issues.
- Verify, assign, and update the status of citizen reports.
- Propose edits to budget line items; cannot apply them without admin approval.

### Researcher (Citizen)
- Report civic issues with location, category, severity, and an optional photo.
- Upvote and comment on existing reports.
- View and analyze public budget data, reports, and dashboards.
- Cannot propose, edit, approve, or manage users.

### Ward Representative
- Same as Researcher, scoped to a specific ward.
- Can additionally handle issue and budget work inside that ward once an admin approves their application.

## Data Change Rule

```text
Citizens report and view data. Analysts verify reports and propose budget edits.
Admins approve/manage important changes and broadcast notices.
```

In practice, for budget edits:

1. Analyst opens Budget Explorer.
2. Analyst clicks `Propose edit` on a budget item.
3. Analyst submits changed fields and a reason.
4. Admin opens the pending Change Requests queue.
5. Admin approves or rejects the proposal.
6. If approved, the official budget item is updated.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Recharts, lucide-react
- **Backend:** Express.js (dual-mode: MongoDB when available, in-memory fallback otherwise)
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT + bcryptjs
- **Email:** Nodemailer (welcome, OTP verification, password reset, notices)
- **AI:** Google Gemini (plain-language briefs)

## Setup

Install dependencies:

```bash
npm install
```

Copy the environment template and fill in real values:

```bash
cp .env.example .env
```

`.env` needs:

| Variable | Purpose |
|---|---|
| `PORT` | Express API port (default `5000`) |
| `MONGODB_URI` | MongoDB connection string — omit or leave unreachable to run in memory mode |
| `MONGODB_DB` | Database name |
| `JWT_SECRET` | Any long random string used to sign auth tokens |
| `GEMINI_API_KEY` | Google Gemini API key, for AI Briefs |
| `EMAIL_SERVICE` | e.g. `gmail` |
| `EMAIL_USER` | Sender email address |
| `EMAIL_PASS` | App password for that email account (not your normal login password) |

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Check API/database status:

```text
http://localhost:5000/api/health
```

Memory mode is temporary. Data disappears when the server restarts.

## MongoDB Compass

Use this connection string:

```text
mongodb://127.0.0.1:27017
```

After signup/login, refresh Compass and open:

```text
govinsight-nepal
```

Collections:

- `users`
- `incidentreports` — citizen-reported civic issues
- `budgetitems`
- `changerequests`
- `authorities`
- `wardunits`
- `notices`
- `notifications`
- `reviews`
- `projects`
- `documents`
- `activities`

## Useful Scripts

Run development server (frontend + backend together):

```bash
npm run dev
```

Build production app:

```bash
npm run build
```

Run Express server only:

```bash
npm run server
```

Run Next frontend only:

```bash
npm run client
```

## Demo accounts

Quick demo accounts — the first login attempt with one of these emails auto-creates the account with whatever password you type, so pick a password and remember it for next time:

- `admin@govinsight.np`
- `analyst@govinsight.np`
- `researcher@govinsight.np`