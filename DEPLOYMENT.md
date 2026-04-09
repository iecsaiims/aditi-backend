# Backend Deployment

## Vercel

- Import the backend repository as its own Vercel project.
- Keep the default Node.js project type.
- Set these environment variables:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `FRONTEND_URL`
  - `FRONTEND_URLS`
  - `FRONTEND_ORIGIN_SUFFIXES`
  - `GROQ_WHISPER_API_KEYS`
  - `GROQ_QWEN_API_KEY`

## Supabase database URLs

- Use the Supabase pooled connection string for `DATABASE_URL`.
- Use the Supabase direct connection string for `DIRECT_URL`.
- App runtime uses `DATABASE_URL`.
- Prisma migrations use `DIRECT_URL`.

## Recommended values

- Production:
  - `FRONTEND_URL=https://triage.example.com`
  - `FRONTEND_URLS=https://triage.example.com`
- Preview or staging backend:
  - `FRONTEND_URL=https://staging-frontend.example.com`
  - `FRONTEND_URLS=https://staging-frontend.example.com`
  - `FRONTEND_ORIGIN_SUFFIXES=.vercel.app`

## Notes

- The Vercel function entrypoint is `api/[...route].ts`.
- Keep PostgreSQL external to Vercel so the backend can move later without changing schema ownership.
- Run Prisma migrations from CI or a controlled deploy step against the target database.
- Do not run `prisma migrate dev` in production.
- Use `npm run prisma:deploy` for production or staging schema application.

## GitHub Actions migration workflow

- Add these repository secrets in the backend repo:
  - `DATABASE_URL`
  - `DIRECT_URL`
- The workflow runs `prisma migrate deploy` against `DIRECT_URL`.
- Trigger it manually for now, or on `main` after you are comfortable with the flow.

## Quick verification

- Generate/apply migrations:
  - `npm run prisma:deploy`
- Check Prisma can reach Supabase:
  - `npx prisma migrate status`
- Check tables from Supabase SQL editor:
  - `select tablename from pg_tables where schemaname = 'public' order by tablename;`
