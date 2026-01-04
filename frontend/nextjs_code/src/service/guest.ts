/**
 * Guest Management API Service
 *
 * Handles all API calls for guest operations:
 * - Search by mobile
 * - Quick-create
 * - List guests
 */

import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import { CS_API_URL } from '@/libs/constants';
import { IGuest, IGuestQuickCreateRequest, IGuestListResponse } from '@/types/guest';

const GUEST_ENDPOINTS = {
  SEARCH: (mobile: string) => `/guests/search?mobile=${mobile}`,
  QUICK_CREATE: '/guests/quick-create',
  LIST: (params: { search?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.limit !== undefined) searchParams.set('limit', params.limit.toString());
    if (params.offset !== undefined) searchParams.set('offset', params.offset.toString());
    return `/guests?${searchParams.toString()}`;
  },
};

/**
 * Search for a guest by mobile number
 *
 * @param mobile - 11-digit mobile number (09XXXXXXXXX)
 * @returns Guest information if found
 * @throws Error if not found or invalid mobile
 */
export async function searchGuestByMobile(mobile: string): Promise<IGuest> {
  try {
    const guest = await authenticatedFetchJSON<IGuest>(
      `${CS_API_URL}${GUEST_ENDPOINTS.SEARCH(mobile)}`
    );
    return guest;
  } catch (error) {
    console.error('Error searching guest:', error);
    throw error;
  }
}

/**
 * Quick-create a new guest account
 *
 * @param data - Guest mobile and name
 * @returns Created guest information
 * @throws Error if mobile already exists or validation fails
 */
export async function quickCreateGuest(
  data: IGuestQuickCreateRequest
): Promise<IGuest> {
  try {
    const guest = await authenticatedFetchJSON<IGuest>(
      `${CS_API_URL}${GUEST_ENDPOINTS.QUICK_CREATE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    return guest;
  } catch (error) {
    console.error('Error creating guest:', error);
    throw error;
  }
}

/**
 * List guests with optional search and pagination
 *
 * @param params - Search and pagination parameters
 * @returns List of guests and total count
 */
export async function listGuests(params: {
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<IGuestListResponse> {
  try {
    const response = await authenticatedFetchJSON<IGuestListResponse>(
      `${CS_API_URL}${GUEST_ENDPOINTS.LIST(params)}`
    );
    return response;
  } catch (error) {
    console.error('Error listing guests:', error);
    throw new Error('خطا در دریافت لیست مهمانان');
  }
}
