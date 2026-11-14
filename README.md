This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## User Backfill (legacy users missing `role` / `onboardingComplete`)

If users created before the role feature are missing the `role` / `onboardingComplete` fields (e.g. the first Google sign-up):

```bash
npm run users:backfill           # dry run - prints counts only
npm run users:backfill:apply     # --apply - writes the fixes
```

> **Reminder:** before running `npm run users:backfill:apply`, take a backup (`mongodump` or an Atlas snapshot).

## Admin Promote Script

The platform owner can promote an existing account to admin locally (there is no public endpoint for this):

```bash
npm run users:make-admin -- <owner@example.com>
```

This script runs only on the server/local machine with database access; the user must sign out and sign in again for the session to pick up the new role.
