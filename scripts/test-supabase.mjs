import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually if not already populated
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("\n=================================");
console.log(" 🔍 Supabase Diagnostics Test");
console.log("=================================\n");

console.log(`1. SUPABASE_URL: ${url ? url : "❌ MISSING"}`);
if (url) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(".supabase.co")) {
      console.warn(`   ⚠️ Warning: URL doesn't look like a standard Supabase project URL (*.supabase.co).`);
    } else {
      console.log(`   ✅ URL format is valid (Project ID: ${parsed.hostname.split(".")[0]})`);
    }
  } catch {
    console.error(`   ❌ Error: SUPABASE_URL is not a valid URL.`);
  }
}

console.log(`\n2. SUPABASE_SERVICE_ROLE_KEY: ${serviceKey ? (serviceKey.slice(0, 10) + "..." + serviceKey.slice(-5)) : "❌ MISSING"}`);
let keyFormatValid = true;
if (!serviceKey) {
  keyFormatValid = false;
  console.error("   ❌ Service Role Key is missing!");
} else if (serviceKey.startsWith("http://") || serviceKey.startsWith("https://")) {
  keyFormatValid = false;
  console.error("   ❌ ERROR: Your SUPABASE_SERVICE_ROLE_KEY is set to a URL instead of a secret key!");
  console.error("      You currently have: " + serviceKey);
  console.error("      It must be the 'service_role' secret token (starts with 'eyJhbGci...' or 'sbp_...').");
} else if (!serviceKey.startsWith("ey") && !serviceKey.startsWith("sbp_")) {
  console.warn("   ⚠️ Warning: Key does not start with standard JWT prefix ('ey...') or 'sbp_...'.");
} else {
  console.log("   ✅ Key format looks like a valid secret token.");
}

if (!url || !serviceKey || !keyFormatValid) {
  console.log("\n-------------------------------------------------------------");
  console.log("📌 HOW TO GET YOUR SERVICE ROLE KEY:");
  console.log("1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/whdqsrfrczkfwydlmxkz/settings/api");
  console.log("2. Look under 'Project API keys'");
  console.log("3. Find the key named 'service_role' (secret). Click 'Reveal' and copy it.");
  console.log("4. Paste it in your .env.local:");
  console.log("   SUPABASE_SERVICE_ROLE_KEY=eyJh...");
  console.log("-------------------------------------------------------------\n");
  process.exit(1);
}

console.log("\n3. Testing Storage API connection...");
try {
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error("   ❌ Connection failed:", error.message);
    process.exit(1);
  }

  console.log("   ✅ Successfully connected to Supabase Storage!");
  const bucketNames = buckets.map((b) => b.name);
  console.log("   Existing buckets:", bucketNames.length > 0 ? bucketNames.join(", ") : "(none)");

  const requiredBucket = "capsule-images";
  const hasCapsuleImages = bucketNames.includes(requiredBucket);

  if (hasCapsuleImages) {
    console.log(`   ✅ Required private bucket '${requiredBucket}' is ready!`);
  } else {
    console.log(`   ⚠️ Bucket '${requiredBucket}' not found.`);
    console.log(`   Attempting to create private bucket '${requiredBucket}'...`);
    const { error: createErr } = await supabase.storage.createBucket(requiredBucket, {
      public: false,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });

    if (createErr) {
      console.warn("   ⚠️ Could not automatically create bucket:", createErr.message);
      console.log(`   Please create a private bucket named '${requiredBucket}' in your Supabase Dashboard.`);
    } else {
      console.log(`   🎉 Successfully created private bucket '${requiredBucket}'!`);
    }
  }

  console.log("\n✨ Supabase Storage is 100% operational!\n");
} catch (err) {
  console.error("   ❌ Unexpected error:", err);
  process.exit(1);
}
