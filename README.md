# ⏳ Time Capsule Web App

A modern, secure web application where users write messages to their future selves, lock them until a chosen date, and receive an automated email notification when the capsule unlocks.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **MongoDB Atlas (Mongoose)**, **NextAuth.js (Credentials & JWT)**, and **Resend**.

---

## 🔒 Critical Security Architecture

- **Database-Level Sealing**: When a capsule is locked (`unlockAt > now`), queries strictly whitelist `.select("title unlockAt createdAt")`. The message `content` is never loaded from the database layer into server memory or transmitted over the network until the exact unlock timestamp arrives.
- **Server Clock Authority**: Time is evaluated strictly on the server (`now = new Date()`). Client clocks are never trusted to decide whether a capsule is open.
- **Ownership & Privacy**: Sealed capsules cannot be read or edited before unlock. Detail views return a 404 (`notFound()`) if a capsule doesn't exist or belongs to another user, preventing account or ID enumeration.
- **Atomic Cron Claims**: Cron jobs claim capsules using `findOneAndUpdate({ _id, notified: false }, { notified: true })` **before** dispatching email notifications, preventing duplicate emails across concurrent or overlapping runs.

---

## 📬 How Notifications Work

1. **Triggering the Cron**:
   - The endpoint `GET /api/cron/unlock` is called by an external scheduler (e.g. Vercel Cron or GitHub Actions).
   - The request must provide the header: `Authorization: Bearer <CRON_SECRET>`. The endpoint uses constant-time string comparison (`crypto.timingSafeEqual`) to verify the secret.
2. **Querying Unlocked Capsules**:
   - The query searches for capsules where `{ unlockAt: { $lte: now }, notified: false }` using the compound index `{ unlockAt: 1, notified: 1 }`, limited to batches of 50.
3. **Atomic Claiming**:
   - Before any email is sent, the server atomically updates `{ notified: true }`. If another concurrent run already claimed the capsule, `findOneAndUpdate` returns `null` and the worker safely skips it.
4. **Email Dispatch via Resend**:
   - An email is sent to the capsule owner via Resend with a link back to `/capsules/{id}`.
   - **For privacy and security, capsule content is NEVER included in the email body.**
5. **Rollback & Retry on Failure**:
   - If Resend returns an error, the capsule's `notified` status is safely rolled back to `false` so the next scheduled run will retry it. Errors are logged without leaking authorization secrets.

---

## 🚀 Deploy Checklist

Before deploying to Vercel or production, verify the following:

### 1. MongoDB Atlas Network Access
- Go to **MongoDB Atlas > Network Access**.
- Add IP Address `0.0.0.0/0` (Allow Access from Anywhere) so Vercel's dynamic serverless IP addresses can connect to your database cluster.

### 2. Environment Variables
Configure the following in your **Vercel Project Settings > Environment Variables** (or production host):

| Variable | Description | Example / Notes |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://<user>:<password>@cluster.mongodb.net/time_capsule?retryWrites=true&w=majority` |
| `NEXTAUTH_SECRET` | Secret key for JWT signing & session encryption | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical URL of your application | `https://your-domain.vercel.app` (or `http://localhost:3000` locally) |
| `RESEND_API_KEY` | Resend API key | `re_xxxxxxxxxxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | Verified sender email | `Time Capsule <capsule@yourdomain.com>` (or `Time Capsule <onboarding@resend.dev>` for testing) |
| `CRON_SECRET` | Secret token protecting the unlock cron route | Generate with `openssl rand -hex 16` |
| `SUPABASE_URL` | Supabase project URL | `https://xxxxxxxxxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key | Found in **Project Settings > API > service_role (secret)** |

### 3. Supabase Private Storage Setup
1. In your [Supabase Dashboard](https://supabase.com/dashboard), navigate to **Storage**.
2. Click **New Bucket**, set the name to exactly: **`capsule-images`**.
3. **Keep "Public bucket" toggled OFF** (ensures 100% private access).
4. Copy your `SUPABASE_URL` and `service_role` key from **Project Settings > API** into your environment variables.

### 4. Resend Domain Verification
- In [Resend Dashboard](https://resend.com/domains), add your custom domain and configure the DKIM, SPF, and DMARC DNS records.
- If using `onboarding@resend.dev` during initial development, note that Resend will only deliver emails to the email address registered with your Resend account.

### 5. Cron Scheduling Options

- **Option A: Vercel Cron (`vercel.json`)**
  - Included in the repository. Runs automatically once per day on Vercel Hobby plans:
    ```json
    {
      "crons": [{ "path": "/api/cron/unlock", "schedule": "0 0 * * *" }]
    }
    ```
- **Option B: GitHub Actions (`.github/workflows/cron.yml`)**
  - Included in the repository. Runs every 15 minutes.
  - In your GitHub Repository, go to **Settings > Secrets and variables > Actions** and add:
    - `APP_URL`: `https://your-domain.vercel.app`
    - `CRON_SECRET`: Your `CRON_SECRET` value matching the one on Vercel.

---

## 💻 Local Development

1. **Clone and Install**:
   ```bash
   git clone <repo-url>
   cd time-capsule
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your MongoDB URI, Resend API key, and generated secrets
   ```

3. **Run Locally**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Testing the Unlock Cron**:
   ```bash
   curl -X GET http://localhost:3000/api/cron/unlock \
     -H "Authorization: Bearer <YOUR_CRON_SECRET>"
   ```
