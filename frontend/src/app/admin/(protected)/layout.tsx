// src/app/admin/(protected)/layout.tsx
import AdminAuthGuard from "../../components/auth/AdminAuthGuard";
import { AdminDashboardLayout } from "@/components/layout/AdminDashboardLayout";

/**
 * Layout Terproteksi untuk Admin.
 * Membungkus konten dengan AdminAuthGuard (validasi token) dan AdminDashboardLayout (sidebar/header).
 */
export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminDashboardLayout>
        {children}
      </AdminDashboardLayout>
    </AdminAuthGuard>
  );
}