'use client';

import { useRouter } from 'next/navigation';
import { useDashboard } from '@/libs/sale/useDashboard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { AuthService } from '@/service/authService';

export default function DashboardPage() {
  const router = useRouter();
  const { sales, loading, error, reload } = useDashboard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        salesCount={sales.length}
        onRefresh={reload}
        onNewSale={() => router.push('/sale/new')}
        onLogout={AuthService.logout}
      />

      {error && (
        <div className="max-w-7xl mx-auto mt-4 px-4 text-red-600">
          {error}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        <DashboardGrid
          sales={sales}
          onSelect={(id) => router.push(`/sale/${id}`)}
        />
      </main>
    </div>
  );
}
