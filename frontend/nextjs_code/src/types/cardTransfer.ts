export interface ICardTransferItem {
  id: number;
  sale_id: number;
  amount_applied: number;
  amount_total: number;
  tip_amount: number;
  destination_card_number: string | null;
  destination_account_owner: string | null;
  destination_bank_name: string | null;
  received_by_name: string;
  received_at: string;
  confirmed: boolean;
  status: string;
}

export interface ICardTransferListResponse {
  transfers: ICardTransferItem[];
  total_count: number;
  unconfirmed_count: number;
  confirmed_count: number;
}

export interface IConfirmTransferResponse {
  id: number;
  confirmed: boolean;
  message: string;
}
