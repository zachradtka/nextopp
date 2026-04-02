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

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:generate` | Generate migration files |
| `npm run db:studio` | Open Drizzle Studio to browse your data |

## Tech Stack

- [Next.js](https://nextjs.org) — React framework
- [Drizzle ORM](https://orm.drizzle.team) — Type-safe database access
- [SQLite](https://sqlite.org) / [Turso](https://turso.tech) — Database (local file for dev, Turso for production)
- [Auth.js](https://authjs.dev) — Authentication
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) — Styling and components

## License

MIT
