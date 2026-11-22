# FixMate Client

FixMate is a role-based repair booking platform built with Next.js, React, TypeScript, and Better Auth.

## Local setup

```bash
npm install
npm run typecheck
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` to the Express API origin. For local development, use `http://localhost:5000`.

## Deployment

Deploy this repository to Vercel and set `NEXT_PUBLIC_API_URL` to the deployed Express API origin. The Next.js rewrite proxies `/api/*` requests to that API.
