
export interface ExtraItemInput {
  product_id: number;
  quantity: number;
}

export interface SaleItemInput {
  item_id?: number | null;
  menu_id: number;
  quantity: number;
  extras: ExtraItemInput[];
}

export interface OpenSaleRequest {
  sale_type: 'DINE_IN' | 'TAKEAWAY';
  table_id?: number | null;
  guest_id?: number | null;
  guest_count?: number | null;
  note?: string | null;
  items: SaleItemInput[];
}

export interface SaleResponse {
  sale_id: number;
  total_amount: string;
  state: string;
}

export interface ExtraDetail {
  id: number;
  product_id: number;
  product_name: string;
  quantity: string;
  unit_price: string;
  total: string;
}

export interface SaleItemDetail {
  id: number;
  menu_id: number | null;
  product_name: string;
  quantity: string;
  unit_price: string;
  total: string;
  extras: ExtraDetail[];
}

export interface SaleDetail {
  id: number;
  state: string;
  sale_type: string;
  table_id: number | null;
  table_number: string | null;
  guest_name: string | null;
  guest_count: number | null;
  total_amount: string;
  note: string;
  opened_at: string;
  items: SaleItemDetail[];
}

export interface DashboardItem {
  id: number;
  table: string | null;
  guest_name: string | null;
  total_amount: string;
  opened_by_name: string;
  opened_at: string;
}

export interface DashboardResponse {
  active_sales: DashboardItem[];
  total_count: number;
}
