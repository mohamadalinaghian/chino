
export interface TokenPair {
  access: string;
  refresh: string;
}

export interface UserInfo {
  id: number;
  mobile: string;
  name: string;
  is_staff: boolean;
  permissions: string[];
}
