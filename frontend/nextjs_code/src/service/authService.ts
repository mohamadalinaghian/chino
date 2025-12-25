
import { tokenStorage } from '@/libs/auth/tokenStorage';
import { authenticatedFetch } from '@/libs/auth/authFetch';
import { loginRequest } from '@/libs/auth/authApi';
import { TokenPair, UserInfo } from '@/types/authType';

export class AuthService {
  static async login(mobile: string, password: string): Promise<TokenPair> {
    const tokens = await loginRequest(mobile, password);
    tokenStorage.setTokens(tokens);
    return tokens;
  }

  static async getCurrentUser(): Promise<UserInfo> {
    const res = await authenticatedFetch('/auth/me');
    return res.json();
  }

  static logout(): void {
    tokenStorage.clear();
    window.location.href = '/login';
  }

  static isAuthenticated(): boolean {
    return tokenStorage.isAuthenticated();
  }
}
