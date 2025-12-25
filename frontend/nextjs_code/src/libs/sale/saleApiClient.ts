
import { handleApiError } from '@/libs/sale/saleError';
import {
  OpenSaleRequest,
  SaleResponse,
  SaleDetail,
  DashboardResponse,
  SaleItemInput,
} from '@/types/saleType';

import { API_BASE_URL } from '../constants';
import { authenticatedFetch } from '../auth/authFetch';

export class SaleApiClient {
  static async openSale(payload: OpenSaleRequest): Promise<SaleResponse> {
    const res = await authenticatedFetch(
      `${API_BASE_URL}/sale/open`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) await handleApiError(res);
    return res.json();
  }

  static async syncSaleItems(
    saleId: number,
    items: SaleItemInput[]
  ): Promise<SaleResponse> {
    const res = await authenticatedFetch(
      `${API_BASE_URL}/sale/${saleId}/items`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      }
    );

    if (!res.ok) await handleApiError(res);
    return res.json();
  }

  static async getSaleDetail(saleId: number): Promise<SaleDetail> {
    const res = await authenticatedFetch(
      `${API_BASE_URL}/sale/${saleId}`
    );

    if (!res.ok) await handleApiError(res);
    return res.json();
  }

  static async getDashboard(): Promise<DashboardResponse> {
    const res = await authenticatedFetch(
      `${API_BASE_URL}/sale/dashboard`
    );

    if (!res.ok) await handleApiError(res);
    return res.json();
  }

  static async closeSale(saleId: number): Promise<SaleResponse> {
    const res = await authenticatedFetch(
      `${API_BASE_URL}/sale/${saleId}/close`,
      { method: 'POST' }
    );

    if (!res.ok) await handleApiError(res);
    return res.json();
  }

  static async cancelSale(saleId: number): Promise<SaleResponse> {
    const res = await authenticatedFetch(
      `${API_BASE_URL}/sale/${saleId}/cancel`,
      { method: 'POST' }
    );

    if (!res.ok) await handleApiError(res);
    return res.json();
  }
}
