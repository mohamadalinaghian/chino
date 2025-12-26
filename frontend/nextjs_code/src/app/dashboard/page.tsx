/**
 * Dashboard page - displays active sales.
 *
 * Features:
 * - Authentication required (enforced by middleware)
 * - Real-time sale updates via polling
 * - Quick actions: new sale, refresh, logout
 */

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/libs/auth/AuthContext';
import { useDashboard } from '@/libs/sale/useDashboard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';

/**
 * Dashboard page component
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { sales, loading: salesLoading, error, reload } = useDashboard();

  /**
   * Show loading state while checking auth or loading sales
   */
  if (authLoading || salesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  /**
   * If no user after loading, redirect handled by middleware
   * This is a safety check
   */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">در حال هدایت به صفحه ورود...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        userName={user.name}
        salesCount={sales.length}
        onRefresh={reload}
        onNewSale={() => router.push('/sale/new')}
        onLogout={logout}
      />

      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto mt-4 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <DashboardGrid
          sales={sales}
          onSelect={(id) => router.push(`/sale/${id}`)}
        />
      </main>
    </div>
  );
}
