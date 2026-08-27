import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tsef";

const TEAM = [
  { name: "Danny", email: "danny@tensee.local", password: "danny123", role: "Product & Tech Lead", department: "tech", avatarColor: "#00d4ff" },
  { name: "Marwa", email: "marwa@tensee.local", password: "marwa123", role: "Marketing & Growth Lead", department: "marketing", avatarColor: "#ff6b9d" },
  { name: "Ansar", email: "ansar@tensee.local", password: "ansar123", role: "Operations Head", department: "ops", avatarColor: "#ff9500" },
];

// This seed script only provisions the 3 team login accounts.
// It intentionally leaves tasks/meetings/documents empty for a clean start.
async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to", MONGODB_URI);

  for (const member of TEAM) {
    const passwordHash = await bcrypt.hash(member.password, 10);
    await User.findOneAndUpdate(
      { email: member.email },
      { $set: { name: member.name, passwordHash, role: member.role, department: member.department, avatarColor: member.avatarColor } },
      { upsert: true, returnDocument: "after" }
    );
    console.log(`Upserted user ${member.name} <${member.email}> / password: ${member.password}`);
  }

  await mongoose.disconnect();
  console.log("Done. Database is otherwise empty — ready for fresh use.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
