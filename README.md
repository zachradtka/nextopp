# Opportunity Tracker

A simple web app to track job opportunities during your search. Keep tabs on where you've applied, interview status, salary ranges, notes, and more — all in one place.

Built with Next.js, SQLite, and Tailwind CSS.

## Features

- Track opportunities with company, role, status, salary, location, and notes
- Filter by status (Saved, Applied, Interviewing, Offered, Rejected, Withdrawn, Accepted)
- Update status inline from the dashboard
- Archive or delete opportunities you no longer need
- Optional GitHub authentication

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

1. Clone the repo and install dependencies:

```bash
git clone <your-repo-url>
cd opportunity-tracker
npm install
```

2. Copy the example environment file:

```bash
cp .env.example .env.local
```

The default config (`AUTH_DISABLED=true`) lets you run locally with no additional setup.

3. Set up the local database:

```bash
npm run db:push
```

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start tracking.

## Authentication (Optional)

By default, auth is disabled so you can use the app immediately. To enable GitHub OAuth:

1. Create a GitHub OAuth App at [github.com/settings/developers](https://github.com/settings/developers)
   - Set the callback URL to `http://localhost:3000/api/auth/callback/github`

2. Update `.env.local`:

```bash
AUTH_DISABLED=false
AUTH_GITHUB_ID=your-client-id
AUTH_GITHUB_SECRET=your-client-secret
AUTH_SECRET=your-random-secret  # Generate with: npx auth secret
```

3. Restart the dev server.

## Deploy to Vercel

### 1. Create a Turso database

```bash
# Install the Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Sign up / log in
turso auth login

# Create a database
turso db create opportunity-tracker

# Get your credentials
turso db show opportunity-tracker --url
turso db tokens create opportunity-tracker
```

### 2. Push the schema to Turso

```bash
TURSO_DATABASE_URL=<your-url> TURSO_AUTH_TOKEN=<your-token> npm run db:push
```

### 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com), sign in, and click **Add New Project**
2. Import your forked repository
3. Add the following environment variables:

| Variable | Value |
|----------|-------|
| `TURSO_DATABASE_URL` | Your Turso database URL |
| `TURSO_AUTH_TOKEN` | Your Turso auth token |
| `AUTH_DISABLED` | `true` (set to `false` to enable auth) |

4. Click **Deploy**

### 4. Enable authentication (optional)

Once your app is deployed and you have your production URL:

1. Create a GitHub OAuth App at [github.com/settings/developers](https://github.com/settings/developers)
   - **Homepage URL**: your Vercel production URL (e.g. `https://your-app.vercel.app`)
   - **Authorization callback URL**: `https://your-app.vercel.app/api/auth/callback/github`
2. Add these environment variables in Vercel:

| Variable | Value |
|----------|-------|
| `AUTH_DISABLED` | `false` |
| `AUTH_GITHUB_ID` | Your GitHub OAuth client ID |
| `AUTH_GITHUB_SECRET` | Your GitHub OAuth client secret |
| `AUTH_SECRET` | Generate with `npx auth secret` |
| `ALLOWED_USERS` | Comma-separated GitHub usernames (leave empty to allow all) |

3. Redeploy from the Vercel dashboard

## Sample Data

To load sample data for local development:

```bash
npm run import -- scripts/sample-data.csv local-dev-user
```

This imports 28 opportunities with a mix of statuses, dates, and companies. You can re-run it after resetting the database if you want a fresh start:

```bash
rm local.db
npm run db:push
npm run import -- scripts/sample-data.csv local-dev-user
```

To import your own data, create a CSV with these columns:

```
Application Date,Company,Role,Work Mode,Location,Status,Job URL
```

- **Application Date**: `MM/DD/YYYY` format
- **Status**: `saved`, `applied`, `interviewing`, `offered`, `rejected`, `withdrawn`, or `accepted`
- **Work Mode**: `remote`, `hybrid`, or `onsite`

Then run:

```bash
npm run import -- path/to/your-data.csv local-dev-user
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:generate` | Generate migration files |
| `npm run db:studio` | Open Drizzle Studio to browse your data |
| `npm run import -- <csv> <user-id>` | Import opportunities from a CSV file |

## Tech Stack

- [Next.js](https://nextjs.org) — React framework
- [Drizzle ORM](https://orm.drizzle.team) — Type-safe database access
- [SQLite](https://sqlite.org) / [Turso](https://turso.tech) — Database (local file for dev, Turso for production)
- [Auth.js](https://authjs.dev) — Authentication
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) — Styling and components

## License

MIT
