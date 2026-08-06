# Civicदृष्टि

Civicदृष्टि is a government budget analysis web app built with Next.js, Express, MongoDB, and Mongoose. It helps users view budget records, analyze spending, compare departments, and manage approved data changes through role-based access.

## Main Benefits

- View government budget data in a dashboard.
- Analyze spending by sector, department, district, and fiscal year.
- Search and filter budget line items.
- Store data permanently in MongoDB.
- Control access with Admin, Analyst, and Researcher roles.
- Let analysts propose edits while admins approve important changes.

## User Roles

### Admin

- Manage users and roles.
- View all dashboards and reports.
- Review pending budget change requests.
- Approve or reject proposed data changes.

### Analyst

- View dashboards, analytics, budget records, departments, and reports.
- Select a budget line and submit a proposed edit.
- Track pending proposals.
- Cannot directly change official data without admin approval.

### Researcher

- View and analyze budget data.
- Use dashboards, reports, filters, and search.
- Cannot propose, edit, approve, or manage users.

## Data Change Rule

Best rule used in this app:

```text
Normal users can view data, analysts can propose or edit data, and admins approve/manage important changes.
```

In practice:

1. Analyst opens Budget Explorer.
2. Analyst clicks `Propose edit` on a budget item.
3. Analyst submits changed fields and a reason.
4. Admin opens Budget Explorer.
5. Admin approves or rejects the pending change.
6. If approved, the official budget item is updated.

## Tech Stack

- Frontend: Next.js 14, React, Tailwind CSS
- Backend: Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT
- Password security: bcryptjs

## Setup

Install dependencies:

```bash
npm install
```

Create `.env` in the project root:


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

Expected MongoDB response:

```json
{"ok":true,"database":"mongo"}
```

If MongoDB is not available, the app falls back to memory mode:

```json
{"ok":true,"database":"memory"}
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

Important collections:

- `users`
- `documents`
- `budgetitems`
- `projects`
- `activities`
- `changerequests`

## Useful Scripts

Run development server:

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

## First Use

The first registered account becomes Admin. After login, sample budget data is seeded automatically so the dashboard, analytics, budget explorer, and department pages are not empty.