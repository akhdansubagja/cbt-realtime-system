// src/app/admin/(protected)/layout.tsx
import AdminAuthGuard from "../../components/auth/AdminAuthGuard";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminDashboardLayout>
        {children}
      </AdminDashboardLayout>
    </AdminAuthGuard>
  );
}