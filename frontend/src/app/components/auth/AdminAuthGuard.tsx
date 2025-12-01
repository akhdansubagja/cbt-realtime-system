// src/components/auth/AdminAuthGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FullPageLoader } from '@/components/ui/FullPageLoader';

// Komponen ini akan "membungkus" halaman yang ingin diproteksi
export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Periksa token saat komponen dimuat di sisi klien
    const token = localStorage.getItem('access_token');

    if (!token) {
      // Jika tidak ada token, paksa redirect ke halaman login
      router.replace('/admin/login');
    } else {
      // Jika ada token, izinkan akses dan hilangkan loading
      setIsLoading(false);
    }
  }, [router]);

  // Selama pengecekan, tampilkan loader
  if (isLoading) {
    return <FullPageLoader />;
  }

  // Jika pengecekan selesai dan token ada, tampilkan halaman yang diproteksi
  return <>{children}</>;
}