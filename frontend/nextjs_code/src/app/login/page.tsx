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

import { Suspense } from 'react';
import LoginForm from './LoginForm';

// Recommended: Set your production domain here to fix the metadataBase warning
export const metadata = {
  metadataBase: new URL('https://your-domain.com'), // ← Change to your real domain
};

// Fix for the themeColor warning (if you had it in metadata before)
export const viewport = {
  themeColor: '#1e1b4b', // dark indigo to match your gradient, adjust as needed
};

export default function LoginPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 px-4">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700 animate-pulse">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-900/50 rounded-full mb-4">
                  <span className="text-3xl">🔐</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-100 mb-2">در حال بارگذاری...</h1>
              </div>
            </div>
          }
        >
          <LoginForm />
        </Suspense>

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
