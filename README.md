# Extraction Scheduling

Full repository set for the Processing Team Scheduler using:

- Next.js frontend
- Vercel API routes
- Supabase Postgres

## Run locally

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase values
3. Install dependencies
4. Start dev server

```bash
npm install
npm run dev
```

## API routes

- `GET /api/bootstrap?week=current`
- `GET /api/schedules?weekKey=current`
- `PUT /api/schedules?weekKey=current`
- `POST /api/employees`
- `PUT /api/employees`
- `DELETE /api/employees?id=<uuid>`

## Database

Run `supabase/schema.sql` in your Supabase SQL editor.
