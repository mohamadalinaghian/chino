/**
 * Login Page
 *
 * Public page that displays the login form.
 * Redirects to dashboard after successful login.
 *
 * @module app/login/page
 */

import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

/**
 * Page metadata
 */
export const metadata: Metadata = {
  title: 'ورود | کافه چینو',
  description: 'ورود به پنل کاربری کافه چینو',
};

/**
 * Login Page Component
 *
 * Displays the login form centered on the page.
 *
 * Features:
 * - Responsive layout
 * - Centered login form
 * - Auto-redirect to dashboard on success
 *
 * @page
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <LoginForm redirectTo="/dashboard" />
    </div>
  );
}
