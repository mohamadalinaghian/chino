/**
 * Input Component
 *
 * Reusable input field component with label, error display, and full styling.
 * Designed to work with React Hook Form.
 *
 * Follows Single Responsibility Principle:
 * - Only handles input rendering and user interaction
 * - Does not handle validation logic (delegated to React Hook Form)
 * - Does not handle state management (controlled by parent/form)
 *
 * @module components/common/Input
 */

'use client';

import React, { forwardRef, useId } from 'react';

/**
 * Input component props
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input label text */
  label?: string;
  /** Error message to display below input */
  error?: string;
  /** Additional CSS classes for input container */
  containerClassName?: string;
  /** Additional CSS classes for label */
  labelClassName?: string;
  /** Additional CSS classes for input element */
  inputClassName?: string;
  /** Force LTR direction (useful for passwords in RTL apps) */
  forceLtr?: boolean;
}

/**
 * Input Component
 *
 * A reusable, accessible input field with label and error display.
 * Uses forwardRef for React Hook Form compatibility.
 *
 * @component
 * @example
 * // Basic usage
 * <Input
 *   label="Mobile Number"
 *   placeholder="09123456789"
 *   {...register('mobile')}
 * />
 *
 * @example
 * // With error
 * <Input
 *   label="Password"
 *   type="password"
 *   error={errors.password?.message}
 *   {...register('password')}
 * />
 *
 * @example
 * // Force LTR (for passwords in RTL apps)
 * <Input
 *   label="رمز عبور"
 *   type="password"
 *   forceLtr
 *   {...register('password')}
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      containerClassName = '',
      labelClassName = '',
      inputClassName = '',
      id,
      className = '',
      disabled,
      required,
      type,
      forceLtr = false,
      ...props
    },
    ref
  ) => {
    // Use React's useId for stable ID generation (fixes hydration)
    const generatedId = useId();
    const inputId = id || generatedId;

    // Determine if input has error
    const hasError = !!error;

    // Auto-detect if input should be LTR (password, email, tel, number)
    const shouldBeLtr =
      forceLtr ||
      type === 'password' ||
      type === 'email' ||
      type === 'tel' ||
      type === 'number' ||
      type === 'url';

    // Build input classes based on state
    const inputClasses = [
      // Base styles
      'w-full px-4 py-3 rounded-lg border-2 transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60',
      // Direction
      shouldBeLtr ? 'ltr text-left' : '',
      // Error state
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-primary focus:ring-primary',
      // Custom classes
      inputClassName,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const labelClasses = [
      'block text-sm font-medium mb-2',
      hasError ? 'text-red-700' : 'text-text',
      labelClassName,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={`mb-4 ${containerClassName}`}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
            {required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}

        {/* Input field */}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={inputClasses}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          {...props}
        />

        {/* Error message */}
        {hasError && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-red-600 flex items-center"
            role="alert"
          >
            <svg
              className="w-4 h-4 ml-1 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
