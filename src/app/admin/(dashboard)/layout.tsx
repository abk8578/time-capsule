import { requireAdminPage } from "@/lib/admin";
import AdminSidebar from "../AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Live database check: verifies session and confirms role === "admin"
  const { user } = await requireAdminPage();

  return (
    <div className="min-h-screen bg-bg text-text antialiased">
      <AdminSidebar
        adminEmail={user.email}
        adminName={user.name}
      />
      {/* Content area offset for fixed desktop sidebar */}
      <main className="md:pl-64 min-h-screen flex flex-col">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
