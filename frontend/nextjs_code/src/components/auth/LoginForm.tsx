/**
 * Login Form Component
 *
 * User login form with mobile number and password fields.
 * Uses React Hook Form for validation and Zustand for state management.
 *
 * Follows Single Responsibility Principle:
 * - Only handles login form UI and user input
 * - Delegates authentication to Zustand store
 * - Delegates validation to React Hook Form
 * - Delegates API calls to authService (via store)
 *
 * @module components/auth/LoginForm
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import type { LoginCredentials } from '@/types/auth';

/**
 * Login form validation rules
 */
const loginValidationRules = {
  mobile: {
    required: 'شماره موبایل الزامی است',
    pattern: {
      value: /^09\d{9}$/,
      message: 'فرمت شماره موبایل باید 09XXXXXXXXX باشد',
    },
  },
  password: {
    required: 'رمز عبور الزامی است',
    minLength: {
      value: 6,
      message: 'رمز عبور باید حداقل 6 کاراکتر باشد',
    },
  },
};

/**
 * LoginForm Component
 *
 * Provides a login form with mobile and password fields.
 * Handles form validation, submission, and error display.
 *
 * Features:
 * - Mobile number validation (Iranian format)
 * - Password validation
 * - Loading state during login
 * - Error handling and display
 * - Auto-redirect after successful login
 *
 * @component
 * @example
 * <LoginForm redirectTo="/dashboard" />
 */
export const LoginForm: React.FC<{
  /** Route to redirect to after successful login */
  redirectTo?: string;
}> = ({ redirectTo = '/dashboard' }) => {
  const router = useRouter();
  const { login } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    mode: 'onBlur', // Validate on blur for better UX
  });

  /**
   * Handle form submission
   *
   * @param {LoginCredentials} data - Form data
   */
  const onSubmit = async (data: LoginCredentials) => {
    try {
      // Clear previous errors
      setServerError(null);

      // Attempt login
      await login(data);

      // Redirect on success
      router.push(redirectTo);
    } catch (error) {
      // Handle login errors
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'ورود ناموفق بود. لطفا دوباره تلاش کنید.';

      setServerError(errorMessage);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Form header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-text">خوش آمدید</h2>
        <p className="mt-2 text-text-light">
          لطفا وارد حساب کاربری خود شوید
        </p>
      </div>

      {/* Login form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white/80 backdrop-blur-sm shadow-lg rounded-lg px-8 py-10 space-y-6 border border-border"
        noValidate
      >
        {/* Server error display */}
        {serverError && (
          <div
            className="bg-red-50 border-r-4 border-red-500 p-4 rounded"
            role="alert"
          >
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-500 ml-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          </div>
        )}

        {/* Mobile number input */}
        <Input
          label="شماره موبایل"
          type="tel"
          placeholder="09123456789"
          error={errors.mobile?.message}
          disabled={isSubmitting}
          {...register('mobile', loginValidationRules.mobile)}
          inputMode="numeric"
          autoComplete="tel"
          forceLtr
        />

        {/* Password input */}
        <Input
          label="رمز عبور"
          type="password"
          placeholder="رمز عبور خود را وارد کنید"
          error={errors.password?.message}
          disabled={isSubmitting}
          {...register('password', loginValidationRules.password)}
          autoComplete="current-password"
          forceLtr
        />

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'در حال ورود...' : 'ورود'}
        </Button>

      </form>
    </div>
  );
};

LoginForm.displayName = 'LoginForm';
