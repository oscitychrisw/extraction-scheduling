# Extraction Scheduling (Vercel + Supabase)

This is the repo-ready backend file set for the Processing Team Scheduler.

## Included
- `api/` Vercel API routes
- `lib/` shared Supabase and validation helpers
- `supabase/schema.sql` database schema
- `vercel.json`
- `.env.local.example`

## Required environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

## API routes
- `GET /api/bootstrap?week=current`
- `GET /api/schedules?weekKey=current`
- `PUT /api/schedules?weekKey=current`
- `POST /api/employees`
- `PUT /api/employees`
- `DELETE /api/employees?id=...`

## Notes
This package does not include the React frontend app files. It is intended to be merged into the repo structure you already have.
