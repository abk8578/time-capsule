import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Deck | Time Capsule",
  description: "Administrative command and control interface.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-text antialiased">
      {children}
    </div>
  );
}
