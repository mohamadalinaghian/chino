import { authenticatedFetchJSON } from "@/libs/auth/authFetch"
import { CS_API_URL, API_ENDPOINTS, UI_TEXT } from "@/libs/constants"
import { IReportDetails, IReportListResponse } from "@/types/reportType"
import { ICreateReportInput, ICreateReportResponse } from "@/types/reportCreate"

export async function fetchReportDetails(reportId: number): Promise<IReportDetails> {
  try {
    const url = CS_API_URL + API_ENDPOINTS.REPORT_DETAILS(reportId)
    const report = await authenticatedFetchJSON<IReportDetails>(url);
    return report;
  }
  catch (error) {
    console.error('Error fetching report details:', error);
    throw new Error(UI_TEXT.ERROR_LOADING_REPORT);
  }
}

export async function fetchReportList(status?: string, limit: number = 30): Promise<IReportListResponse> {
  try {
    let url = CS_API_URL + API_ENDPOINTS.REPORT_LIST;
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    if (params.toString()) {
      url += '?' + params.toString();
    }
    const response = await authenticatedFetchJSON<IReportListResponse>(url);
    return response;
  }
  catch (error) {
    console.error('Error fetching report list:', error);
    throw new Error('خطا در بارگذاری لیست گزارش‌ها');
  }
}

export async function approveReport(reportId: number): Promise<{ id: number; state: string }> {
  try {
    const url = CS_API_URL + API_ENDPOINTS.REPORT_APPROVE(reportId);
    const response = await authenticatedFetchJSON<{ id: number; state: string }>(url, {
      method: 'POST',
    });
    return response;
  }
  catch (error) {
    console.error('Error approving report:', error);
    throw new Error('خطا در تایید گزارش');
  }
}

/**
 * Create a new report
 */
export async function createReport(input: ICreateReportInput): Promise<ICreateReportResponse> {
  try {
    const url = CS_API_URL + API_ENDPOINTS.REPORT_CREATE;
    const response = await authenticatedFetchJSON<ICreateReportResponse>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    return response;
  }
  catch (error) {
    console.error('Error creating report:', error);
    throw new Error('خطا در ایجاد گزارش');
  }
}
