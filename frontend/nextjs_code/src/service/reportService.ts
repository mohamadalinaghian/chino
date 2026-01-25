import { authenticatedFetchJSON } from "@/libs/auth/authFetch"
import { CS_API_URL, API_ENDPOINTS, UI_TEXT } from "@/libs/constants"
import { IReportDetails } from "@/types/reportType"

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
