// One-time backfill for legacy users missing `role` / `onboardingComplete`.
//
// Run:
//   npm run users:backfill           # dry run (default) - prints counts only
//   npm run users:backfill:apply     # --apply - writes the fixes
//
// What it does:
//   - Users with no `role` get `role: "seeker"`, `onboardingComplete: false`
//     and `updatedAt: new Date()` (so they pass through /onboarding/role once).
//   - Users that have a `role` but no `onboardingComplete` get
//     `onboardingComplete: true` (already onboarded, flag was just missing).
//
// Safe to run repeatedly - after a successful apply the second run changes 0
// documents.

import { MongoClient } from "mongodb";

// Load env from .env.local / .env (existing var names: MONGODB_URI, DB_NAME).
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
    break;
  } catch {
    // File not present - try the next candidate.
  }
}

const APPLY = process.argv.includes("--apply");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Add it to .env.local first.");
  process.exit(1);
}

const dbName = process.env.DB_NAME ?? process.env.MONGODB_DB ?? "hireloopdb";

const client = new MongoClient(uri);

async function main() {
  await client.connect();
  const users = client.db(dbName).collection("user");

  const missingRoleFilter = { role: { $exists: false } };
  const missingOnboardingFilter = {
    role: { $exists: true },
    onboardingComplete: { $exists: false },
  };

  const missingRoleCount = await users.countDocuments(missingRoleFilter);
  const missingOnboardingCount = await users.countDocuments(missingOnboardingFilter);

  console.log(`Users with missing "role": ${missingRoleCount}`);
  console.log(`Users with role but missing "onboardingComplete": ${missingOnboardingCount}`);

  if (APPLY) {
    const roleResult = await users.updateMany(missingRoleFilter, {
      $set: { role: "seeker", onboardingComplete: false, updatedAt: new Date() },
    });
    const onboardingResult = await users.updateMany(missingOnboardingFilter, {
      $set: { onboardingComplete: true },
    });

    console.log(
      `Backfill applied: ${roleResult.modifiedCount} user(s) updated (missing role).`,
    );
    console.log(
      `Backfill applied: ${onboardingResult.modifiedCount} user(s) updated (missing onboardingComplete).`,
    );
  } else {
    console.log("Dry run only. Re-run with --apply to write the changes.");
  }
}

try {
  await main();
} catch (error) {
  console.error("Backfill failed:", error?.message ?? error);
  process.exitCode = 1;
} finally {
  await client.close();
}
