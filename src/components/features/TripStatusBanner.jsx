import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function TripStatusBanner({ status }) {
  if (status !== 'confirmed') return null;

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4">
      <CheckCircle className="text-emerald-400" size={24} />
      <span className="text-emerald-300 font-bold text-lg tracking-wide uppercase">Trip Confirmed</span>
    </div>
  );
}
