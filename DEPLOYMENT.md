# Backend Deployment

## Vercel

- Import the backend repository as its own Vercel project.
- Keep the default Node.js project type.
- Set these environment variables:
  - `DATABASE_URL`
  - `FRONTEND_URL`
  - `FRONTEND_URLS`
  - `FRONTEND_ORIGIN_SUFFIXES`
  - `GROQ_WHISPER_API_KEYS`
  - `GROQ_QWEN_API_KEY`

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
