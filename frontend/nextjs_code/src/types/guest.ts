/**
 * Guest Management Types
 *
 * Matches backend guest_schemas.py
 */

/**
 * Guest information
 */
export interface IGuest {
  id: number;
  mobile: string;
  name: string;
  is_active: boolean;
}

/**
 * Guest quick-create request
 */
export interface IGuestQuickCreateRequest {
  mobile: string;
  name: string;
}

/**
 * Guest list response
 */
export interface IGuestListResponse {
  guests: IGuest[];
  total_count: number;
}

/**
 * Guest search/selector props
 */
export interface IGuestSelectorProps {
  selectedGuestId: number | null;
  onGuestChange: (guestId: number | null) => void;
  onQuickCreate?: () => void;
  disabled?: boolean;
}

/**
 * Guest quick-create modal props
 */
export interface IGuestQuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestCreated: (guest: IGuest) => void;
  initialMobile?: string;
}
