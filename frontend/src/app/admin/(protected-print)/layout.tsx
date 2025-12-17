// src/app/admin/(protected-print)/layout.tsx
import AdminAuthGuard from "../../components/auth/AdminAuthGuard";

export default function ProtectedPrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      {/* Tanpa AdminDashboardLayout agar full screen / clean untuk print */}
      {children}
    </AdminAuthGuard>
  );
}
