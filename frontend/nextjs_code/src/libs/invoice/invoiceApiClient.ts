/**
 * Invoice API client
 *
 * Handles all invoice-related API requests with proper authentication.
 * Uses authenticatedFetch to automatically handle token refresh.
 */

import { CS_API_URL } from '@/libs/constants';
import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import {
  InitiateInvoiceRequest,
  InitiateInvoiceResponse,
  ProcessPaymentRequest,
  ProcessPaymentResponse,
  CancelInvoiceRequest,
  CancelInvoiceResponse,
  InvoiceDetailResponse,
} from '@/types/invoiceType';

/**
 * Base URL for invoice endpoints
 */
const INVOICE_BASE_URL = `${CS_API_URL}/invoice`;

/**
 * Invoice API client class
 * Centralizes all invoice-related API operations
 */
export class InvoiceApiClient {
  /**
   * Initiates an invoice from a sale
   *
   * @param saleId - ID of the sale
   * @param data - Invoice initiation data (tax amount optional)
   * @returns Invoice details
   * @throws Error if initiation fails or user lacks permission
   */
  static async initiateInvoice(
    saleId: number,
    data: InitiateInvoiceRequest = {}
  ): Promise<InitiateInvoiceResponse> {
    try {
      return await authenticatedFetchJSON<InitiateInvoiceResponse>(
        `${INVOICE_BASE_URL}/sales/${saleId}/initiate-invoice`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('permission')) {
          throw new Error('شما مجوز ایجاد فاکتور را ندارید');
        }
        if (error.message.includes('empty')) {
          throw new Error('نمی‌توان برای فروش خالی فاکتور صادر کرد');
        }
        if (error.message.includes('already')) {
          throw new Error('برای این فروش قبلاً فاکتور صادر شده است');
        }
        throw error;
      }
      throw new Error('خطا در صدور فاکتور');
    }
  }

  /**
   * Processes a payment for an invoice
   *
   * @param invoiceId - ID of the invoice
   * @param data - Payment data
   * @returns Payment response with updated invoice status
   * @throws Error if payment fails or user lacks permission
   */
  static async processPayment(
    invoiceId: number,
    data: ProcessPaymentRequest
  ): Promise<ProcessPaymentResponse> {
    try {
      return await authenticatedFetchJSON<ProcessPaymentResponse>(
        `${INVOICE_BASE_URL}/invoices/${invoiceId}/process-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('permission')) {
          throw new Error('شما مجوز ثبت پرداخت را ندارید');
        }
        if (error.message.includes('VOID')) {
          throw new Error('نمی‌توان برای فاکتور لغو شده پرداخت ثبت کرد');
        }
        if (error.message.includes('destination')) {
          throw new Error('لطفاً حساب مقصد را انتخاب کنید');
        }
        throw error;
      }
      throw new Error('خطا در ثبت پرداخت');
    }
  }

  /**
   * Cancels an invoice
   *
   * @param invoiceId - ID of the invoice to cancel
   * @param data - Cancellation data (reason optional)
   * @returns Cancellation response
   * @throws Error if cancellation fails or user lacks permission
   */
  static async cancelInvoice(
    invoiceId: number,
    data: CancelInvoiceRequest = {}
  ): Promise<CancelInvoiceResponse> {
    try {
      return await authenticatedFetchJSON<CancelInvoiceResponse>(
        `${INVOICE_BASE_URL}/invoices/${invoiceId}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('permission')) {
          throw new Error('شما مجوز لغو فاکتور را ندارید');
        }
        if (error.message.includes('already')) {
          throw new Error('این فاکتور قبلاً لغو شده است');
        }
        if (error.message.includes('payment')) {
          throw new Error('نمی‌توان فاکتوری که پرداخت دریافت کرده را لغو کرد. ابتدا باید مبلغ را مسترد کنید');
        }
        throw error;
      }
      throw new Error('خطا در لغو فاکتور');
    }
  }

  /**
   * Gets invoice details
   *
   * @param invoiceId - ID of the invoice
   * @returns Invoice details with payments
   * @throws Error if invoice not found or user lacks permission
   */
  static async getInvoiceDetail(invoiceId: number): Promise<InvoiceDetailResponse> {
    try {
      return await authenticatedFetchJSON<InvoiceDetailResponse>(
        `${INVOICE_BASE_URL}/invoices/${invoiceId}`
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          throw new Error('فاکتور مورد نظر یافت نشد');
        }
        if (error.message.includes('403') || error.message.includes('permission')) {
          throw new Error('شما مجوز مشاهده جزئیات این فاکتور را ندارید');
        }
        throw error;
      }
      throw new Error('خطا در دریافت جزئیات فاکتور');
    }
  }
}
