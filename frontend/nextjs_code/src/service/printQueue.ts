/**
 * Print Queue API Service
 *
 * Handles all API calls for print queue operations:
 * - Add print job to queue
 * - Get pending print jobs (for cafe PC monitoring)
 * - Mark print job as printed/failed
 */

import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import { CS_API_URL } from '@/libs/constants';

export interface PrintJobCreateRequest {
  sale_id?: number;
  print_type: 'STANDARD' | 'EDIT_DIFF';
  print_data: any; // PrintSaleData or PrintEditData
}

export interface PrintJob {
  id: number;
  sale_id?: number;
  print_type: string;
  print_data: any;
  status: 'PENDING' | 'PRINTED' | 'FAILED';
  created_at: string;
  printed_at?: string;
}

const PRINT_QUEUE_ENDPOINTS = {
  CREATE: '/print-queue/',
  PENDING: '/print-queue/pending/',
  MARK_PRINTED: (id: number) => `/print-queue/${id}/printed/`,
  MARK_FAILED: (id: number) => `/print-queue/${id}/failed/`,
  DELETE: (id: number) => `/print-queue/${id}/`,
};

/**
 * Add a print job to the queue
 *
 * @param data - Print job data
 * @returns Created print job
 */
export async function addPrintJob(data: PrintJobCreateRequest): Promise<PrintJob> {
  try {
    const response = await authenticatedFetchJSON<PrintJob>(
      `${CS_API_URL}${PRINT_QUEUE_ENDPOINTS.CREATE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    return response;
  } catch (error) {
    console.error('Error adding print job:', error);
    throw error;
  }
}

/**
 * Get all pending print jobs
 *
 * This is used by the cafe PC to monitor the queue
 *
 * @returns List of pending print jobs
 */
export async function getPendingPrintJobs(): Promise<PrintJob[]> {
  try {
    const response = await authenticatedFetchJSON<PrintJob[]>(
      `${CS_API_URL}${PRINT_QUEUE_ENDPOINTS.PENDING}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching pending print jobs:', error);
    throw error;
  }
}

/**
 * Mark a print job as successfully printed
 *
 * @param jobId - Print job ID
 */
export async function markPrintJobAsPrinted(jobId: number): Promise<void> {
  try {
    await authenticatedFetchJSON(
      `${CS_API_URL}${PRINT_QUEUE_ENDPOINTS.MARK_PRINTED(jobId)}`,
      {
        method: 'PUT',
      }
    );
  } catch (error) {
    console.error('Error marking print job as printed:', error);
    throw error;
  }
}

/**
 * Mark a print job as failed
 *
 * @param jobId - Print job ID
 * @param errorMessage - Error message
 */
export async function markPrintJobAsFailed(
  jobId: number,
  errorMessage: string
): Promise<void> {
  try {
    await authenticatedFetchJSON(
      `${CS_API_URL}${PRINT_QUEUE_ENDPOINTS.MARK_FAILED(jobId)}?error_message=${encodeURIComponent(errorMessage)}`,
      {
        method: 'PUT',
      }
    );
  } catch (error) {
    console.error('Error marking print job as failed:', error);
    throw error;
  }
}
