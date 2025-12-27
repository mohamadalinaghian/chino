/**
 * Quantity Control Component
 *
 * Reusable component for incrementing/decrementing quantities
 * Used for both cart items and extras
 */

'use client';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuantityControl({ value, onChange, min = 1, max = 99 }: Props) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min;
    const clampedValue = Math.max(min, Math.min(max, newValue));
    onChange(clampedValue);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Decrement Button */}
      <button
        onClick={handleDecrement}
        disabled={value <= min}
        className="
          w-8 h-8 rounded-lg
          bg-gray-700 hover:bg-gray-600
          disabled:bg-gray-800 disabled:text-gray-600
          text-gray-200 font-bold
          transition-colors
          disabled:cursor-not-allowed
        "
      >
        −
      </button>

      {/* Quantity Input */}
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        className="
          w-16 text-center
          bg-gray-700 border border-gray-600
          rounded-lg py-1
          text-gray-100 font-semibold
          focus:outline-none focus:ring-2 focus:ring-indigo-500
          [appearance:textfield]
          [&::-webkit-outer-spin-button]:appearance-none
          [&::-webkit-inner-spin-button]:appearance-none
        "
      />

      {/* Increment Button */}
      <button
        onClick={handleIncrement}
        disabled={value >= max}
        className="
          w-8 h-8 rounded-lg
          bg-gray-700 hover:bg-gray-600
          disabled:bg-gray-800 disabled:text-gray-600
          text-gray-200 font-bold
          transition-colors
          disabled:cursor-not-allowed
        "
      >
        +
      </button>
    </div>
  );
}
