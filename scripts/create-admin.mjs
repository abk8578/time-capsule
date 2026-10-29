import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load .env.local
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI not found in .env.local");
  process.exit(1);
}

// User Schema
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// Parse CLI arguments or use defaults
// Usage: node scripts/create-admin.mjs [email] [password] [name]
const args = process.argv.slice(2);
const adminEmail = (args[0] || "admin@timecapsule.com").toLowerCase().trim();
const adminPassword = args[1] || "Admin1234!";
const adminName = args[2] || "Admin User";

async function run() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to database successfully!");

    console.log(`Checking for existing user with email: ${adminEmail}...`);
    const existing = await User.findOne({ email: adminEmail });

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    if (existing) {
      await User.updateOne(
        { _id: existing._id },
        {
          $set: {
            name: adminName,
            passwordHash,
            role: "admin",
            isSuspended: false,
          },
        }
      );

      console.log("\n========================================");
      console.log("✅ Existing user successfully updated to ADMIN!");
      console.log("----------------------------------------");
      console.log(`Email:    ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log(`Role:     admin`);
      console.log("========================================\n");
    } else {
      const newUser = await User.create({
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: "admin",
        isSuspended: false,
      });

      console.log("\n========================================");
      console.log("✅ New ADMIN user successfully created!");
      console.log("----------------------------------------");
      console.log(`Email:    ${newUser.email}`);
      console.log(`Password: ${adminPassword}`);
      console.log(`Role:     ${newUser.role}`);
      console.log(`User ID:  ${newUser._id}`);
      console.log("========================================\n");
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create admin user:", error);
    process.exit(1);
  }
}

run();
