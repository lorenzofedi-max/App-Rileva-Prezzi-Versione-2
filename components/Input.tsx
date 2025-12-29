import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  list?: string;
  options?: string[];
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, list, options, error, className, ...props }) => {
  const generatedId = useId();
  const listId = list || (options ? `datalist-${generatedId}` : undefined);

  return (
    <div className={`flex flex-col space-y-2 ${className || ''}`}>
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
        {label}
      </label>
      <div className="relative group">
        <input
          {...props}
          list={listId}
          autoComplete="off"
          className={`w-full h-14 px-5 rounded-xl border-2 bg-white text-slate-900 text-sm font-bold transition-all duration-300 outline-none
            ${error 
              ? 'border-rose-400 bg-rose-50 text-rose-900' 
              : 'border-slate-100 focus:border-brand-600 hover:border-slate-200 focus:shadow-md'
            }`}
        />
      </div>
      {options && listId && (
        <datalist id={listId}>
          {options.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      )}
      {error && <span className="text-[10px] text-rose-600 font-bold px-2">{error}</span>}
    </div>
  );
};