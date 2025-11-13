import React from "react";
import { Check } from "lucide-react";

export default function ModernCheckbox({ 
  checked, 
  onChange, 
  label, 
  sublabel, 
  required = false,
  error = false,
  id 
}) {
  return (
    <div 
      className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer ${
        error 
          ? 'bg-red-50 border-red-400 shadow-md animate-pulse'
          : checked
            ? 'bg-white border-blue-600 shadow-sm'
            : 'bg-white border-gray-200 hover:border-blue-300'
      }`}
      onClick={() => onChange(!checked)}
    >
      <div className="relative flex-shrink-0 mt-1">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => {
            e.stopPropagation();
            onChange(e.target.checked);
          }}
          required={required}
          className="peer appearance-none w-6 h-6 border-2 border-gray-400 rounded bg-white checked:bg-white checked:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer transition-all"
        />
        <Check
          className="absolute top-0.5 left-0.5 w-5 h-5 text-green-600 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
          strokeWidth={3}
        />
      </div>
      <label 
        htmlFor={id}
        className="cursor-pointer flex-1" 
      >
        <strong className="text-gray-900 text-base block mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </strong>
        {sublabel && (
          <p className="text-gray-700 text-sm leading-relaxed">
            {sublabel}
          </p>
        )}
      </label>
    </div>
  );
}