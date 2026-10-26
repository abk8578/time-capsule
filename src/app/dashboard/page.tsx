import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Capsule from "@/models/Capsule";
import ConstellationDashboard from "@/components/dashboard/ConstellationDashboard";
import type { SealedCapsuleDTO, OpenedCapsuleDTO } from "@/types";

// Force dynamic execution so cached responses never reveal sealed capsules or misstate unlock times
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }

  await connectToDatabase();

  // Compute "now" strictly on the server to prevent client clock manipulation
  const now = new Date();

  // 1. Sealed capsules query: STRICT whitelist (.select("title unlockAt createdAt")).
  // Content is never loaded from the database layer.
  const sealedDocs = await Capsule.find({
    userId: session.user.id,
    unlockAt: { $gt: now },
  })
    .select("title unlockAt createdAt recipientEmail")
    .sort({ unlockAt: 1 })
    .lean();

  // 2. Opened capsules query: STRICT whitelist (.select("title unlockAt createdAt")).
  // Rule: Do NOT fetch or decrypt content in the dashboard list. Content is fetched only at /capsules/[id] upon unlock.
  const openedDocs = await Capsule.find({
    userId: session.user.id,
    unlockAt: { $lte: now },
  })
    .select("title unlockAt createdAt")
    .sort({ unlockAt: -1 })
    .lean();

  // Convert Mongoose documents into plain client-safe DTOs with string ids & ISO date strings
  const sealedCapsules: SealedCapsuleDTO[] = sealedDocs.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    unlockAt: doc.unlockAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    recipientEmail: doc.recipientEmail || null,
    isUnlocked: false as const,
  }));

  const openedCapsules: OpenedCapsuleDTO[] = openedDocs.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    unlockAt: doc.unlockAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    isUnlocked: true as const,
  }));

  return (
    <ConstellationDashboard
      sealedCapsules={sealedCapsules}
      openedCapsules={openedCapsules}
    />
  );
}
