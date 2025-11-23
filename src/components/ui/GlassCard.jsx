import React from 'react';

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-slate-900/40 backdrop-blur-md border border-amber-500/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl ${className}`}>
    {children}
  </div>
);

export default GlassCard;
