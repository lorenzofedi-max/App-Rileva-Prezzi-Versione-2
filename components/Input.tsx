import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  list?: string;
  options?: string[];
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, list, options, error, className, ...props }) => {
  // Generate a unique ID for the datalist if options are provided
  // This ensures the input is correctly linked to the datalist even if no explicit 'list' prop is passed
  const generatedId = useId();
  const listId = list || (options ? `datalist-${generatedId}` : undefined);

  return (
    <div className={`flex flex-col ${className || ''}`}>
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        {...props}
        list={listId}
        autoComplete="off" // Disable browser history to prioritize datalist options
        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-brand-500 outline-none transition-all ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500'
        }`}
      />
      {options && listId && (
        <datalist id={listId}>
          {options.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      )}
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
};