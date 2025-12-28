/**
 * Quantity Control Component (Mobile Optimized)
 *
 * Reusable component for incrementing/decrementing quantities
 * Mobile-optimized with larger tap targets (min 44px)
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
      {/* Decrement Button - Mobile optimized */}
      <button
        onClick={handleDecrement}
        disabled={value <= min}
        className="
          min-w-[44px] min-h-[44px]
          rounded-lg
          bg-gray-700 hover:bg-gray-600 active:bg-gray-650
          disabled:bg-gray-800 disabled:text-gray-600
          text-gray-200 font-bold text-xl
          transition-all
          disabled:cursor-not-allowed
          flex items-center justify-center
          active:scale-95
        "
      >
        −
      </button>

      {/* Quantity Input - Mobile friendly */}
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        inputMode="numeric"
        className="
          w-20 h-[44px]
          text-center
          bg-gray-700 border-2 border-gray-600
          rounded-lg
          text-gray-100 font-bold text-lg
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          [appearance:textfield]
          [&::-webkit-outer-spin-button]:appearance-none
          [&::-webkit-inner-spin-button]:appearance-none
        "
      />

      {/* Increment Button - Mobile optimized */}
      <button
        onClick={handleIncrement}
        disabled={value >= max}
        className="
          min-w-[44px] min-h-[44px]
          rounded-lg
          bg-gray-700 hover:bg-gray-600 active:bg-gray-650
          disabled:bg-gray-800 disabled:text-gray-600
          text-gray-200 font-bold text-xl
          transition-all
          disabled:cursor-not-allowed
          flex items-center justify-center
          active:scale-95
        "
      >
        +
      </button>
    </div>
  );
}
