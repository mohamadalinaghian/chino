import { authenticatedFetchJSON } from "@/libs/auth/authFetch";
import { CS_API_URL, API_ENDPOINTS } from "@/libs/constants";
import {
  ICardTransferListResponse,
  IConfirmTransferResponse,
} from "@/types/cardTransfer";

export async function fetchCardTransfers(
  confirmed?: boolean,
  limit: number = 50
): Promise<ICardTransferListResponse> {
  try {
    let url = CS_API_URL + API_ENDPOINTS.CARD_TRANSFER_LIST;
    const params = new URLSearchParams();
    if (confirmed !== undefined) {
      params.append("confirmed", confirmed.toString());
    }
    params.append("limit", limit.toString());
    if (params.toString()) {
      url += "?" + params.toString();
    }
    const response = await authenticatedFetchJSON<ICardTransferListResponse>(url);
    return response;
  } catch (error) {
    console.error("Error fetching card transfers:", error);
    throw new Error("خطا در بارگذاری لیست انتقال‌ها");
  }
}

export async function confirmCardTransfer(
  transferId: number
): Promise<IConfirmTransferResponse> {
  try {
    const url = CS_API_URL + API_ENDPOINTS.CARD_TRANSFER_CONFIRM(transferId);
    const response = await authenticatedFetchJSON<IConfirmTransferResponse>(url, {
      method: "POST",
    });
    return response;
  } catch (error) {
    console.error("Error confirming card transfer:", error);
    throw new Error("خطا در تایید انتقال");
  }
}

export async function unconfirmCardTransfer(
  transferId: number
): Promise<IConfirmTransferResponse> {
  try {
    const url = CS_API_URL + API_ENDPOINTS.CARD_TRANSFER_UNCONFIRM(transferId);
    const response = await authenticatedFetchJSON<IConfirmTransferResponse>(url, {
      method: "POST",
    });
    return response;
  } catch (error) {
    console.error("Error unconfirming card transfer:", error);
    throw new Error("خطا در لغو تایید انتقال");
  }
}
