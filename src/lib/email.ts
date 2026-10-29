import nodemailer from "nodemailer";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Configure Nodemailer transporter if SMTP credentials are provided
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "").trim();

export const transporter =
  smtpUser && smtpPass
    ? nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || "gmail",
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE !== "false",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      })
    : null;

/**
 * Escapes raw user inputs to prevent HTML injection in emails.
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface SendUnlockEmailParams {
  to: string;
  name: string;
  capsuleId: string;
  capsuleTitle?: string;
}

/**
 * Sends an email notification when a capsule unlocks.
 *
 * Privacy & Security Rules:
 * - Capsule message content AND title are STRICTLY EXCLUDED.
 * - Always includes "sent via Time Capsule by {name}".
 * - All user input is HTML-escaped.
 */
export async function sendUnlockEmail({
  to,
  name,
  capsuleId,
}: SendUnlockEmailParams) {
  const appUrl = (process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3001").replace(
    /\/+$/,
    ""
  );
  const capsuleUrl = `${appUrl}/capsules/${capsuleId}`;
  const safeName = escapeHtml(name || "Time Traveler");

  if (process.env.EMAIL_MODE === "log") {
    const domain = to.includes("@") ? "@" + to.split("@")[1] : "@unknown";
    console.log(`[EMAIL_MODE=log] toDomain=${domain} previewToken=none`);
    return { id: "log-mode", success: true };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Time Capsule is Unlocked</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0F1419; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #F3EBDD;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F1419; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="580px" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #182029; border: 1px solid #2A3542; border-radius: 16px; overflow: hidden; padding: 36px 32px;">
                <tr>
                  <td align="left" style="padding-bottom: 20px;">
                    <div style="display: inline-block; padding: 8px 14px; background-color: rgba(242, 184, 75, 0.15); border: 1px solid rgba(242, 184, 75, 0.3); border-radius: 9999px; font-size: 12px; font-weight: 600; color: #F2B84B;">
                      ⏳ Time Capsule Unlocked
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding-bottom: 16px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #F3EBDD; line-height: 1.3;">
                      Your message from the past is ready
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 15px; color: #A9B1BC; line-height: 1.6;">
                      Hello ${safeName},
                    </p>
                    <p style="margin: 12px 0 0; font-size: 15px; color: #A9B1BC; line-height: 1.6;">
                      The unlock date for your time capsule has arrived. Your preserved memories, reflections, and thoughts are now unsealed and ready to read.
                    </p>
                    <p style="margin: 12px 0 0; font-size: 13px; color: #F2B84B; font-weight: 500;">
                      sent via Time Capsule by ${safeName}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 16px 0 28px;">
                    <a href="${capsuleUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #F2B84B; color: #1A1305; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(242, 184, 75, 0.25);">
                      Read Your Capsule &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #2A3542; padding-top: 20px; font-size: 12px; color: #5E5648; line-height: 1.5;">
                    <p style="margin: 0;">
                      For your privacy and security, capsule titles and message contents are never included in emails. You can view your sealed memories safely by logging in via the link above.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return await dispatchEmail({
    to,
    subject: "Your Time Capsule is ready to open",
    html: htmlContent,
  });
}

interface SendReminderEmailParams {
  to: string;
  name: string;
  capsuleId: string;
  unlockAtFormatted: string;
  capsuleTitle?: string;
}

/**
 * Sends a 24-hour reminder email to the capsule owner before unlocking.
 *
 * Privacy & Security Rules:
 * - Content AND title are NEVER included.
 * - Always includes "sent via Time Capsule by {name}".
 * - All user input is HTML-escaped.
 */
export async function sendReminderEmail({
  to,
  name,
  capsuleId,
  unlockAtFormatted,
}: SendReminderEmailParams) {
  const appUrl = (process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3001").replace(/\/+$/, "");
  const capsuleUrl = `${appUrl}/capsules/${capsuleId}`;
  const safeName = escapeHtml(name || "Time Traveler");
  const safeDate = escapeHtml(unlockAtFormatted);

  if (process.env.EMAIL_MODE === "log") {
    const domain = to.includes("@") ? "@" + to.split("@")[1] : "@unknown";
    console.log(`[EMAIL_MODE=log] toDomain=${domain} previewToken=none`);
    return { id: "log-mode", success: true };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Upcoming Time Capsule Unlock</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0F1419; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #F3EBDD;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F1419; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #171E26; border-radius: 16px; border: 1px solid #283340; overflow: hidden;">
                <tr>
                  <td style="padding: 32px 32px 24px 32px; text-align: center;">
                    <div style="display: inline-block; padding: 6px 14px; background-color: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 20px; font-size: 11px; font-weight: 600; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">
                      Final 24 Hours in Orbit
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em;">
                      Your capsule arrives tomorrow
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 32px 24px 32px;">
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #D1D5DB;">
                      Greetings, <strong>${safeName}</strong>.
                    </p>
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #9CA3AF;">
                      Your sealed time capsule is scheduled to unlock in approximately 24 hours on <strong>${safeDate}</strong>.
                    </p>
                    <p style="margin: 12px 0 16px 0; font-size: 13px; color: #F59E0B; font-weight: 500;">
                      sent via Time Capsule by ${safeName}
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 1.5; color: #6B7280; font-style: italic;">
                      Your message remains in cryptographic isolation. Titles and contents are never transmitted in reminder emails.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${capsuleUrl}" style="display: inline-block; padding: 14px 28px; background-color: #F59E0B; color: #0F1419; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 12px;">
                            View Countdown in Vault
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return await dispatchEmail({
    to,
    subject: "Your Time Capsule unlocks in 24 hours",
    html: htmlContent,
  });
}

interface SendRecipientUnlockEmailParams {
  to: string;
  recipientName?: string | null;
  senderName: string;
  rawToken: string;
  capsuleTitle?: string;
}

/**
 * Sends an unlock email notification to a designated recipient.
 *
 * Privacy & Security Rules:
 * - Content AND title are STRICTLY EXCLUDED.
 * - Always includes "sent via Time Capsule by {name}".
 * - All user input is HTML-escaped.
 */
export async function sendRecipientUnlockEmail({
  to,
  recipientName,
  senderName,
  rawToken,
}: SendRecipientUnlockEmailParams) {
  const appUrl = (process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3001").replace(/\/+$/, "");
  const recipientUrl = `${appUrl}/capsules/r/${rawToken}`;
  const safeRecipientName = recipientName ? escapeHtml(recipientName) : "Friend";
  const safeSenderName = escapeHtml(senderName || "A friend");

  if (process.env.EMAIL_MODE === "log") {
    const domain = to.includes("@") ? "@" + to.split("@")[1] : "@unknown";
    const preview = rawToken ? rawToken.slice(0, 6) : "none";
    console.log(`[EMAIL_MODE=log] toDomain=${domain} previewToken=${preview}`);
    return { id: "log-mode", success: true };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>A Time Capsule Has Been Unsealed For You</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0F1419; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #F3EBDD;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F1419; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #171E26; border-radius: 16px; border: 1px solid #283340; overflow: hidden;">
                <tr>
                  <td style="padding: 32px 32px 24px 32px; text-align: center;">
                    <div style="display: inline-block; padding: 6px 14px; background-color: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 20px; font-size: 11px; font-weight: 600; color: #818CF8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">
                      A Gift From Across Time
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.02em;">
                      ${safeSenderName} sent you a Time Capsule
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 32px 24px 32px;">
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #D1D5DB;">
                      Hello ${safeRecipientName},
                    </p>
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #9CA3AF;">
                      In the past, <strong>${safeSenderName}</strong> sealed a memory capsule and charted it to unlock for you today.
                    </p>
                    <p style="margin: 12px 0 16px 0; font-size: 13px; color: #818CF8; font-weight: 500;">
                      sent via Time Capsule by ${safeSenderName}
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.5; color: #D1D5DB;">
                      The coordinates have aligned, and the seal has officially opened. You can view this memory without an account using your private access link:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${recipientUrl}" style="display: inline-block; padding: 14px 28px; background-color: #6366F1; color: #FFFFFF; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
                            Open Your Time Capsule
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return await dispatchEmail({
    to,
    subject: `${senderName} left a Time Capsule for you`,
    html: htmlContent,
  });
}

interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  resetUrl: string;
}

/**
 * Sends a password reset email containing a secure 1-hour access link.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendPasswordResetEmailParams) {
  const safeName = escapeHtml(name || "Time Traveler");

  if (process.env.EMAIL_MODE === "log") {
    const domain = to.includes("@") ? "@" + to.split("@")[1] : "@unknown";
    console.log(`[EMAIL_MODE=log] Password reset email dispatched to ${domain}: ${resetUrl}`);
    return { id: "log-mode", success: true };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Secret Key - Time Capsule</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0F1419; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #F3EBDD;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F1419; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="580px" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #182029; border: 1px solid #2A3542; border-radius: 16px; overflow: hidden; padding: 36px 32px;">
                <tr>
                  <td align="left" style="padding-bottom: 20px;">
                    <div style="display: inline-block; padding: 8px 14px; background-color: rgba(242, 184, 75, 0.15); border: 1px solid rgba(242, 184, 75, 0.3); border-radius: 9999px; font-size: 12px; font-weight: 600; color: #F2B84B;">
                      🔑 Security Orbit Transmission
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding-bottom: 16px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #F3EBDD; line-height: 1.3;">
                      Reset Your Secret Key
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding-bottom: 24px;">
                    <p style="margin: 0; font-size: 15px; color: #A9B1BC; line-height: 1.6;">
                      Hello ${safeName},
                    </p>
                    <p style="margin: 12px 0 0; font-size: 15px; color: #A9B1BC; line-height: 1.6;">
                      A request was received to reset the secret key for your Time Capsule constellation account. Click the button below to establish a new key:
                    </p>
                    <p style="margin: 12px 0 0; font-size: 13px; color: #F2B84B; font-weight: 500;">
                      For your security, this reset link will expire in 1 hour.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 16px 0 28px;">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #F2B84B; color: #1A1305; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(242, 184, 75, 0.25);">
                      Reset My Secret Key &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="border-top: 1px solid #2A3542; padding-top: 20px; font-size: 12px; color: #5E5648; line-height: 1.5;">
                    <p style="margin: 0;">
                      If you did not request this password reset, you can safely ignore this transmission. Your existing password remains secure.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return await dispatchEmail({
    to,
    subject: "Reset your Time Capsule secret key",
    html: htmlContent,
  });
}

async function dispatchEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // 1. Try Nodemailer SMTP if configured
  if (transporter && smtpUser && smtpPass) {
    const from = process.env.SMTP_FROM || `Time Capsule <${smtpUser}>`;
    return await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
  }

  // 2. Fall back to Resend if configured
  if (resend) {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Time Capsule <onboarding@resend.dev>";
    return await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });
  }

  throw new Error(
    "No email service configured. Please provide SMTP credentials (SMTP_USER, SMTP_PASS) or RESEND_API_KEY in .env.local"
  );
}
