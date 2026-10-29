import connectToDatabase from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const keys = Object.keys(process.env).filter((k) =>
    k.toLowerCase().includes("mongo")
  );

  let mongoConnection = "untested";
  let mongoError: string | null = null;

  if (process.env.MONGODB_URI) {
    try {
      await connectToDatabase();
      mongoConnection = "connected";
    } catch (err: unknown) {
      mongoConnection = "failed";
      mongoError = err instanceof Error ? err.message : String(err);
    }
  }

  return Response.json({
    hasUri: !!process.env.MONGODB_URI,
    mongoRelatedKeys: keys,
    vercelEnv: process.env.VERCEL_ENV,
    deployment: process.env.VERCEL_URL,
    mongoConnection,
    mongoError,
  });
}
