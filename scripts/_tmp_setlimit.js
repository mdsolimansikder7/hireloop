// TEMP: bump Mahmuda's application count to 10 with marker docs, or clean them up.
const { MongoClient } = require("mongodb");

const mode = process.argv[2] || "set"; // set | clean

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
  await client.connect();
  const db = client.db("hireloopdb");
  const user = await db.collection("user").findOne({ email: "solimanboss10@gmail.com" });
  if (!user) throw new Error("user not found");
  const uid = user._id.toString();

  if (mode === "clean") {
    const r = await db.collection("applications").deleteMany({
      $or: [{ userId: uid }, { userId: user._id }, { seekerId: uid }, { seekerId: user._id }],
      jobId: /^test-limit-marker/,
    });
    console.log("cleaned:", r.deletedCount);
  } else {
    const count = await db.collection("applications").countDocuments({
      $or: [{ userId: uid }, { userId: user._id }, { seekerId: uid }, { seekerId: user._id }],
    });
    console.log("current count:", count);
    const need = 10 - count;
    const docs = [];
    for (let i = 0; i < need; i++) {
      docs.push({
        jobId: `test-limit-marker-${i}`,
        userId: user._id,
        seekerId: user._id,
        createdAt: new Date(),
        marker: true,
      });
    }
    if (docs.length) {
      await db.collection("applications").insertMany(docs);
      console.log("inserted:", docs.length);
    }
    const after = await db.collection("applications").countDocuments({
      $or: [{ userId: uid }, { userId: user._id }, { seekerId: uid }, { seekerId: user._id }],
    });
    console.log("after count:", after);
  }
  await client.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
