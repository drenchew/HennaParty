import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminProvider } from "@/components/admin/AdminProvider";

export default function AdminPage() {
  return (
    <AdminProvider>
      <AdminDashboard />
    </AdminProvider>
  );
}
