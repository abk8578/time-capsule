import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Read .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
let smtpUser = "";
let smtpPass = "";
let smtpFrom = "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("SMTP_USER=")) {
      smtpUser = trimmed.replace("SMTP_USER=", "").replace(/^["']|["']$/g, "").trim();
    }
    if (trimmed.startsWith("SMTP_PASS=")) {
      smtpPass = trimmed.replace("SMTP_PASS=", "").replace(/^["']|["']$/g, "").trim();
    }
    if (trimmed.startsWith("SMTP_FROM=")) {
      smtpFrom = trimmed.replace("SMTP_FROM=", "").replace(/^["']|["']$/g, "").trim();
    }
  }
}

console.log("-----------------------------------------");
console.log("Nodemailer SMTP Test");
console.log("-----------------------------------------");
console.log("SMTP User:", smtpUser || "MISSING");
console.log("SMTP Pass:", smtpPass ? "******** (Configured)" : "EMPTY");
console.log("SMTP From:", smtpFrom || `Time Capsule <${smtpUser}>`);

if (!smtpUser || !smtpPass) {
  console.log("\n⚠️ SMTP_PASS is empty in .env.local!");
  console.log("Please create a 16-character App Password at:");
  console.log("👉 https://myaccount.google.com/apppasswords");
  console.log("Then set SMTP_PASS=your_16_digit_password in .env.local\n");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

async function main() {
  const recipient = "abhi@yopmail.com";
  console.log(`\nSending email to registered user: ${recipient}...`);

  try {
    const info = await transporter.sendMail({
      from: smtpFrom || `Time Capsule <${smtpUser}>`,
      to: recipient,
      subject: "Time Capsule Test for Registered User",
      html: `
        <div style="font-family: sans-serif; padding: 24px; background: #0F1419; color: #F3EBDD; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #F2B84B;">⏳ Time Capsule Unlocked</h2>
          <p>Hello abhi,</p>
          <p>Your capsule test message has been delivered to your registered email via SMTP!</p>
          <p style="color: #A9B1BC; font-size: 13px;">Sent successfully without any domain restriction.</p>
        </div>
      `,
    });

    console.log("✅ SUCCESS! Email sent to registered user.");
    console.log("Message ID:", info.messageId);
    console.log(`Check inbox at: https://yopmail.com?${recipient.split("@")[0]}`);
  } catch (err) {
    console.error("❌ FAILED to send email:", err.message || err);
  }
}

main();
