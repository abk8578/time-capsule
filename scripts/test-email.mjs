import { Resend } from "resend";
import fs from "fs";
import path from "path";

// Read .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
let apiKey = "";
let fromEmail = "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("RESEND_API_KEY=")) {
      apiKey = trimmed.replace("RESEND_API_KEY=", "").trim();
    }
    if (trimmed.startsWith("RESEND_FROM_EMAIL=")) {
      fromEmail = trimmed.replace("RESEND_FROM_EMAIL=", "").trim();
    }
  }
}

console.log("-----------------------------------------");
console.log("Resend Email Diagnostic Test");
console.log("-----------------------------------------");
console.log("API Key:", apiKey ? `${apiKey.slice(0, 10)}... (length: ${apiKey.length})` : "MISSING");
console.log("FROM Email in .env.local:", fromEmail);

if (!apiKey) {
  console.error("ERROR: RESEND_API_KEY is missing in .env.local!");
  process.exit(1);
}

const resend = new Resend(apiKey);

async function testSend(from, to, label) {
  console.log(`\n[${label}] Sending from: "${from}" to: "${to}"...`);
  try {
    const response = await resend.emails.send({
      from,
      to,
      subject: "Time Capsule Test Email",
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #03060E; color: #FFFFFF; border-radius: 12px;">
          <h2 style="color: #F59E0B;">Time Capsule Email Verification</h2>
          <p>Congratulations! Your Resend integration is working perfectly.</p>
          <p style="color: #94A3B8; font-size: 13px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    if (response.error) {
      console.error(`❌ FAILED:`, response.error);
      return false;
    } else {
      console.log(`✅ SUCCESS! Email sent. ID:`, response.data?.id);
      return true;
    }
  } catch (err) {
    console.error(`❌ EXCEPTION:`, err.message || err);
    return false;
  }
}

async function main() {
  const recipient = "abhishekchauhan46396@gmail.com";

  // Test 1: with configured fromEmail
  console.log("\nAttempt 1: With RESEND_FROM_EMAIL from .env.local");
  const success1 = await testSend(fromEmail, recipient, "Attempt 1");

  if (!success1) {
    console.log("\n⚠️ Notice: Resend does not allow sending directly from @gmail.com without verified domain DNS records.");
    console.log("Attempt 2: With Resend Testing Sandbox address (Time Capsule <onboarding@resend.dev>)...");
    const success2 = await testSend("Time Capsule <onboarding@resend.dev>", recipient, "Attempt 2");
    if (success2) {
      console.log("\n💡 Recommendation: In .env.local, set:");
      console.log('RESEND_FROM_EMAIL=Time Capsule <onboarding@resend.dev>');
    }
  }
  console.log("\n-----------------------------------------");
}

main();
