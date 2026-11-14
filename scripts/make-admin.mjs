// Promote an existing user to admin by email (local / server use only).
//
// Usage: node scripts/make-admin.mjs owner@example.com
//
// - Finds the user by email (case-insensitive exact match).
// - If not found, prints "User not found" and exits with code 1.
// - Sets role: "admin", onboardingComplete: true and updatedAt: new Date().
// - Prints a short confirmation only (no secrets / personal data).

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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main() {
  const email = (process.argv[2] ?? "").trim();
  if (!email) {
    console.error("Usage: node scripts/make-admin.mjs <owner-email>");
    process.exitCode = 1;
    return;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const dbName = process.env.DB_NAME ?? process.env.MONGODB_DB ?? "hireloopdb";
    const user = await client
      .db(dbName)
      .collection("user")
      .findOne({ email: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } });

    if (!user) {
      console.log("User not found");
      process.exitCode = 1;
      return;
    }

    await client.db(dbName).collection("user").updateOne(
      { _id: user._id },
      { $set: { role: "admin", onboardingComplete: true, updatedAt: new Date() } },
    );

    console.log(`User ${email} promoted to admin.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Failed to make admin:", error?.message ?? error);
  process.exitCode = 1;
});
