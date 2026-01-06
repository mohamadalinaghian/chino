/**
 * Login page for staff authentication.
 *
 * Features:
 * - Mobile + password authentication
 * - RTL support for Persian
 * - Redirects to previous page or dashboard after login
 * - Form validation
 * - Error handling
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthService } from '@/service/authService';
import { useAuth } from '@/libs/auth/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, revalidate } = useAuth();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Where to redirect after login
  const redirectTo = searchParams.get('next') || '/dashboard';

  /**
   * If already authenticated, redirect to dashboard
   */
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  /**
   * Validates mobile number format
   */
  const validateMobile = (mobile: string): boolean => {
    // Iranian mobile format: 09xxxxxxxxx (11 digits)
    const mobileRegex = /^09\d{9}$/;
    return mobileRegex.test(mobile);
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!mobile || !password) {
      setError('شماره موبایل و رمز عبور الزامی است');
      return;
    }

    if (!validateMobile(mobile)) {
      setError('فرمت شماره موبایل نادرست است (مثال: 09123456789)');
      return;
    }

    if (password.length < 4) {
      setError('رمز عبور حداقل باید 4 کاراکتر باشد');
      return;
    }

    try {
      setLoading(true);

      // Login and store tokens
      await AuthService.login(mobile, password);

      // Revalidate auth context to load user info
      await revalidate();

      // Redirect to intended page or dashboard
      router.replace(redirectTo);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'خطای غیرمنتظره در ورود رخ داد'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles mobile input change (sanitize)
   */
  const handleMobileChange = (value: string) => {
    // Only allow digits
    const sanitized = value.replace(/\D/g, '');
    // Limit to 11 characters
    setMobile(sanitized.slice(0, 11));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 px-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-900/50 rounded-full mb-4 ring-4 ring-indigo-500/20">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">
              ورود کارکنان
            </h1>
            <p className="text-gray-400">
              لطفاً با اطلاعات کاربری خود وارد شوید
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-900/30 border border-red-800/50 p-4 flex items-start gap-3">
              <span className="text-red-400 text-xl mt-0.5">⚠️</span>
              <p className="text-red-300 text-sm flex-1">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mobile Input */}
            <div>
              <label
                htmlFor="mobile"
                className="block text-sm font-semibold text-gray-300 mb-2"
              >
                شماره موبایل
              </label>
              <input
                id="mobile"
                type="tel"
                dir="ltr"
                value={mobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                className="w-full rounded-xl bg-gray-700/70 border border-gray-600 px-4 py-3.5 text-left text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="09123456789"
                disabled={loading}
                autoComplete="tel"
                inputMode="numeric"
              />
              <p className="text-xs text-gray-500 mt-1.5 text-left" dir="ltr">
                Format: 09XXXXXXXXX
              </p>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-300 mb-2"
              >
                رمز عبور
              </label>
              <input
                id="password"
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-gray-700/70 border border-gray-600 px-4 py-3.5 text-left text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin text-xl">⏳</span>
                  در حال ورود...
                </span>
              ) : (
                'ورود به سیستم'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            سیستم مدیریت کافه | نسخه 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
