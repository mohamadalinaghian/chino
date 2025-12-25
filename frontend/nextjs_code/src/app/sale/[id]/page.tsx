// app/sale/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SaleApiClient } from '@/libs/sale/saleApiClient';
import { SaleDetail } from '@/types/saleType';
import { SaleItemInput } from '@/types/saleType';

/**
 * Sale detail page with inline editing capabilities.
 * Supports adding, removing, and updating items.
 */
export default function SaleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const saleId = Number(params.id);

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadSale();
  }, [saleId]);

  /**
   * Loads sale details from API.
   */
  const loadSale = async () => {
    try {
      const data = await SaleApiClient.getSaleDetail(saleId);
      setSale(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sale');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates item quantity.
   */
  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (!sale || newQuantity < 1) return;

    setSale({
      ...sale,
      items: sale.items.map((item) =>
        item.id === itemId
          ? { ...item, quantity: String(newQuantity), total: String(Number(item.unit_price) * newQuantity) }
          : item
      ),
    });
  };

  /**
   * Removes item from sale.
   */
  const removeItem = (itemId: number) => {
    if (!sale) return;

    setSale({
      ...sale,
      items: sale.items.filter((item) => item.id !== itemId),
    });
  };

  /**
   * Saves changes to backend.
   */
  const saveChanges = async () => {
    if (!sale) return;

    setSaving(true);
    try {
      // Convert current state to API format
      const items: SaleItemInput[] = sale.items.map((item) => ({
        item_id: item.id,
        menu_id: item.menu_id || 0,
        quantity: Number(item.quantity),
        extras: item.extras.map((extra) => ({
          product_id: extra.product_id,
          quantity: Number(extra.quantity),
        })),
      }));

      await SaleApiClient.syncSaleItems(saleId, items);
      await loadSale(); // Reload to get updated totals
      alert('Changes saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Closes the sale (marks as paid).
   */
  const closeSale = async () => {
    if (!confirm('Close this sale and mark as paid?')) return;

    setSaving(true);
    try {
      await SaleApiClient.closeSale(saleId);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close sale');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Sale not found</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const calculateTotal = (): number => {
    return sale.items.reduce((sum, item) => sum + Number(item.total), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sale #{sale.id}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {sale.table_number || 'Takeaway'} • {sale.state}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sale Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Guest</p>
              <p className="font-semibold">{sale.guest_name || 'Walk-in'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Guest Count</p>
              <p className="font-semibold">{sale.guest_count || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-semibold">{sale.sale_type.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Opened At</p>
              <p className="font-semibold">{new Date(sale.opened_at).toLocaleTimeString()}</p>
            </div>
          </div>
          {sale.note && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> {sale.note}
              </p>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {sale.items.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.product_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">${Number(item.unit_price).toFixed(2)} each</p>

                    {/* Extras */}
                    {item.extras.length > 0 && (
                      <div className="mt-3 ml-4 space-y-1">
                        {item.extras.map((extra) => (
                          <div key={extra.id} className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">+</span>
                            <span>{extra.product_name}</span>
                            <span className="mx-2">×</span>
                            <span>{extra.quantity}</span>
                            <span className="ml-auto">${Number(extra.total).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex items-center gap-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, Number(item.quantity) - 1)}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition"
                        disabled={sale.state !== 'OPEN'}
                      >
                        −
                      </button>
                      <span className="px-4 py-2 font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition"
                        disabled={sale.state !== 'OPEN'}
                      >
                        +
                      </button>
                    </div>

                    {/* Total */}
                    <div className="text-right min-w-[80px]">
                      <p className="text-lg font-bold text-gray-900">${Number(item.total).toFixed(2)}</p>
                    </div>

                    {/* Remove Button */}
                    {sale.state === 'OPEN' && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        title="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-300">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-indigo-600">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {sale.state === 'OPEN' && (
          <div className="flex gap-4 justify-end">
            <button
              onClick={saveChanges}
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition shadow-lg"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={closeSale}
              disabled={saving || sale.items.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition shadow-lg"
            >
              Close Sale (Pay)
            </button>
          </div>
        )}

        {sale.state === 'CLOSED' && (
          <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">This sale has been closed and paid</p>
          </div>
        )}
      </main>
    </div>
  );
}
