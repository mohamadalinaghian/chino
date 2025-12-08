/**
 * Button Component
 *
 * Reusable button component with multiple variants, sizes, and loading state.
 *
 * Follows Single Responsibility Principle:
 * - Only handles button rendering and click events
 * - Does not handle business logic
 * - Does not handle state management
 *
 * @module components/common/Button
 */

'use client';

import React from 'react';

/**
 * Button variant types
 */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

/**
 * Button size types
 */
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button component props
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Whether button is in loading state */
  isLoading?: boolean;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
  /** Make button full width */
  fullWidth?: boolean;
}

/**
 * Button Component
 *
 * A flexible, accessible button component with loading states and variants.
 *
 * @component
 * @example
 * // Primary button
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 *
 * @example
 * // Loading state
 * <Button variant="primary" isLoading disabled>
 *   Logging in...
 * </Button>
 *
 * @example
 * // With icons
 * <Button
 *   variant="outline"
 *   leftIcon={<UserIcon />}
 *   rightIcon={<ArrowIcon />}
 * >
 *   Profile
 * </Button>
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  /**
   * Get variant-specific CSS classes
   */
  const getVariantClasses = (): string => {
    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-primary text-text-inverted hover:bg-primary-dark focus:ring-primary',
      secondary:
        'bg-secondary text-text-inverted hover:bg-secondary/90 focus:ring-secondary',
      outline:
        'border-2 border-primary text-primary hover:bg-primary-light/20 focus:ring-primary',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost:
        'text-primary hover:bg-primary-light/20 focus:ring-primary',
    };

    return variants[variant] || variants.primary;
  };

  /**
   * Get size-specific CSS classes
   */
  const getSizeClasses = (): string => {
    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return sizes[size] || sizes.md;
  };

  // Build complete class string
  const buttonClasses = [
    // Base styles
    'inline-flex items-center justify-center font-medium rounded-lg',
    'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    // Variant styles
    getVariantClasses(),
    // Size styles
    getSizeClasses(),
    // Full width
    fullWidth ? 'w-full' : '',
    // Custom classes
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Loading spinner */}
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Left icon */}
      {!isLoading && leftIcon && (
        <span className="mr-2 flex-shrink-0">{leftIcon}</span>
      )}

      {/* Button text */}
      <span>{children}</span>

      {/* Right icon */}
      {!isLoading && rightIcon && (
        <span className="ml-2 flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};

Button.displayName = 'Button';
