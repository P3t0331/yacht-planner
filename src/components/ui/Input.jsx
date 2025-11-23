import React from 'react';

const Input = ({ label, value, onChange, onBlur, type = "text", placeholder, prefix, disabled }) => (
  <div className="space-y-1.5 group w-full">
    {label && <label className="block text-xs font-bold text-amber-500/80 uppercase tracking-widest group-focus-within:text-amber-400 transition-colors">{label}</label>}
    <div className="relative">
      {prefix && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-slate-400 font-medium">{prefix}</span>
        </div>
      )}
      <input
        type={type}
        disabled={disabled}
        className={`block w-full rounded-xl bg-slate-950/60 border border-white/10 text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:bg-slate-900/80 transition-all duration-300 py-3 ${prefix ? 'pl-8' : 'pl-4'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  </div>
);

export default Input;
