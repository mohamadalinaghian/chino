// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SaleApiClient, DashboardItem } from '@/libs/api/saleApi';
import { AuthService } from '@/service/authService';

/**
 * Main dashboard displaying all active (OPEN) sales.
 * Features real-time updates and quick navigation to sale details.
 */
export default function DashboardPage() {
  const router = useRouter();
  const [sales, setSales] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  /**
   * Fetches dashboard data on mount and sets up polling.
   */
  useEffect(() => {
    loadDashboard();

    // Poll for updates every 30 seconds
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Loads active sales from API.
   */
  const loadDashboard = async () => {
    try {
      const data = await SaleApiClient.getDashboard();
      setSales(data.active_sales);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formats ISO datetime to readable format.
   */
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return date.toLocaleDateString();
  };

  /**
   * Navigates to sale detail page.
   */
  const viewSale = (saleId: number) => {
    router.push(`/sale/${saleId}`);
  };

  /**
   * Navigates to new sale creation.
   */
  const createNewSale = () => {
    router.push('/sale/new');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Active Sales</h1>
            <p className="text-sm text-gray-600 mt-1">
              {sales.length} order{sales.length !== 1 ? 's' : ''} in progress
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadDashboard}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Refresh
            </button>
            <button
              onClick={createNewSale}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg"
            >
              + New Sale
            </button>
            <button
              onClick={() => AuthService.logout()}
              className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Sales Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sales.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No active sales</h3>
            <p className="text-gray-600 mb-6">Create a new sale to get started</p>
            <button
              onClick={createNewSale}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Create First Sale
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sales.map((sale) => (
              <div
                key={sale.id}
                onClick={() => viewSale(sale.id)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition cursor-pointer border border-gray-200 overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm opacity-90">Table</p>
                      <p className="text-2xl font-bold">{sale.table || 'Takeaway'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-90">Total</p>
                      <p className="text-xl font-bold">${parseFloat(sale.total_amount).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm">{sale.guest_name || 'Walk-in'}</span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{formatTime(sale.opened_at)}</span>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">Staff: {sale.opened_by_name}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center">Click to view details</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
