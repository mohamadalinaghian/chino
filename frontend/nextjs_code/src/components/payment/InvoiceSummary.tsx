/**
 * Invoice Summary Component
 *
 * Single Responsibility: Display invoice summary with items, tax, discount, and totals
 *
 * Features:
 * - Sale items list
 * - Subtotal calculation
 * - Tax input (editable)
 * - Discount input (editable)
 * - Final total calculation
 * - Mobile responsive
 */

'use client';

import type { SaleDetailResponse } from '@/types/saleType';

interface Props {
  sale: SaleDetailResponse;
  taxAmount: string;
  onTaxChange: (value: string) => void;
  discountAmount: string;
  onDiscountChange: (value: string) => void;
}

export function InvoiceSummary({
  sale,
  taxAmount,
  onTaxChange,
  discountAmount,
  onDiscountChange,
}: Props) {
  /**
   * Calculate final total
   */
  const subtotal = parseFloat(sale.total_amount);
  const tax = parseFloat(taxAmount || '0');
  const discount = parseFloat(discountAmount || '0');
  const finalTotal = subtotal + tax - discount;

  return (
    <div className="space-y-6">
      {/* Sale Items */}
      <div>
        <h3 className="text-lg font-bold text-gray-200 mb-3">
          آیتم‌های فروش
        </h3>
        <div className="space-y-2">
          {sale.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between bg-gray-700 rounded-xl p-4"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-200">
                  {item.product_name}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {item.quantity} × {parseFloat(item.unit_price).toLocaleString('fa-IR')}{' '}
                  تومان
                </div>
                {/* Extras */}
                {item.extras.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {item.extras.map((extra) => (
                      <div
                        key={extra.id}
                        className="text-xs text-gray-500 mr-4"
                      >
                        + {extra.product_name} ({extra.quantity} ×{' '}
                        {parseFloat(extra.unit_price).toLocaleString('fa-IR')})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-left shrink-0 mr-4">
                <div className="font-bold text-gray-200">
                  {parseFloat(item.total).toLocaleString('fa-IR')}
                </div>
                <div className="text-xs text-gray-500">تومان</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calculations */}
      <div className="bg-gray-700 rounded-xl p-4 space-y-4">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">جمع کل:</span>
          <span className="font-bold text-gray-200">
            {subtotal.toLocaleString('fa-IR')} تومان
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-600"></div>

        {/* Tax Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            مالیات (تومان)
          </label>
          <input
            type="number"
            value={taxAmount}
            onChange={(e) => onTaxChange(e.target.value)}
            placeholder="0"
            className="
              w-full px-4 py-2.5 rounded-xl
              bg-gray-800 border border-gray-600
              text-gray-100
              focus:outline-none focus:ring-2 focus:ring-indigo-500
            "
          />
        </div>

        {/* Discount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            تخفیف (تومان)
          </label>
          <input
            type="number"
            value={discountAmount}
            onChange={(e) => onDiscountChange(e.target.value)}
            placeholder="0"
            className="
              w-full px-4 py-2.5 rounded-xl
              bg-gray-800 border border-gray-600
              text-gray-100
              focus:outline-none focus:ring-2 focus:ring-indigo-500
            "
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-600"></div>

        {/* Final Total */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-300">
            مبلغ قابل پرداخت:
          </span>
          <div className="text-left">
            <div className="text-2xl font-bold text-green-400">
              {finalTotal.toLocaleString('fa-IR')}
            </div>
            <div className="text-xs text-gray-500">تومان</div>
          </div>
        </div>
      </div>

      {/* Breakdown (if tax or discount applied) */}
      {(tax > 0 || discount > 0) && (
        <div className="bg-gray-800 rounded-xl p-4 text-xs space-y-1 text-gray-400">
          <div className="flex justify-between">
            <span>جمع کل:</span>
            <span>{subtotal.toLocaleString('fa-IR')} تومان</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-yellow-400">
              <span>+ مالیات:</span>
              <span>{tax.toLocaleString('fa-IR')} تومان</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-green-400">
              <span>- تخفیف:</span>
              <span>{discount.toLocaleString('fa-IR')} تومان</span>
            </div>
          )}
          <div className="border-t border-gray-700 pt-1 mt-1 flex justify-between font-medium text-gray-300">
            <span>مبلغ نهایی:</span>
            <span>{finalTotal.toLocaleString('fa-IR')} تومان</span>
          </div>
        </div>
      )}
    </div>
  );
}
