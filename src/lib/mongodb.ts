import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI ?? "";
// `ignoreUndefined` keeps { $set: undefined } style values out of stored
// documents — used by auth hooks that must never persist the admin invite code.
const client = new MongoClient(uri, { ignoreUndefined: true });
const dbName = process.env.DB_NAME ?? "hireloopdb";

export const db = client.db(dbName);

export { client };
