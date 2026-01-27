'use client';

import { THEME_COLORS } from '@/libs/constants';

interface ReportFormFieldProps {
  label: string;
  name: string;
  type: 'number' | 'text' | 'date' | 'textarea';
  value: string | number;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  icon?: string;
  helpText?: string;
  disabled?: boolean;
}

/**
 * ReportFormField
 * A reusable form field component with validation display
 */
export function ReportFormField({
  label,
  name,
  type,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  touched,
  required,
  icon,
  helpText,
  disabled = false,
}: ReportFormFieldProps) {
  const hasError = touched && error;
  const inputId = `field-${name}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
    onChange(newValue);
  };

  const baseInputStyles = {
    backgroundColor: THEME_COLORS.surface,
    color: THEME_COLORS.text,
    borderColor: hasError ? THEME_COLORS.red : THEME_COLORS.border,
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label
        htmlFor={inputId}
        className="flex items-center gap-2 text-sm font-medium"
        style={{ color: THEME_COLORS.text }}
      >
        {icon && <span>{icon}</span>}
        {label}
        {required && <span style={{ color: THEME_COLORS.red }}>*</span>}
      </label>

      {/* Input */}
      {type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border outline-none transition-all focus:ring-2"
          style={{
            ...baseInputStyles,
            resize: 'vertical',
          }}
        />
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          min={type === 'number' ? 0 : undefined}
          className="w-full px-4 py-3 rounded-lg border outline-none transition-all focus:ring-2"
          style={baseInputStyles}
        />
      )}

      {/* Help Text */}
      {helpText && !hasError && (
        <p className="text-xs" style={{ color: THEME_COLORS.subtext }}>
          {helpText}
        </p>
      )}

      {/* Error Message */}
      {hasError && (
        <p className="text-xs" style={{ color: THEME_COLORS.red }}>
          {error}
        </p>
      )}
    </div>
  );
}
