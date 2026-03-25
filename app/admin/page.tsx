import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getCurrentUser } from "@/lib/server/auth";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/login?next=/admin");
  }

  return <AdminDashboard />;
}
