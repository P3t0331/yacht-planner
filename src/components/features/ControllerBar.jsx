import React from 'react';
import { Users, Minus, UserPlus, Search } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

export default function ControllerBar({ pax, setPax, searchTerm, setSearchTerm, isLocked }) {
  return (
    <GlassCard className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Dynamic Pax Splitter */}
            <div className="flex-1">
                <label className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">
                    <Users size={14} />
                    Guest Count
                    {isLocked && <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px]">LOCKED</span>}
                </label>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-3 bg-slate-950/50 p-1.5 rounded-xl border border-white/10 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                        <button 
                            onClick={() => setPax(p => Math.max(1, p - 1))}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 transition-colors text-slate-400"
                        >
                            <Minus size={18} />
                        </button>
                        <div className="w-16 text-center">
                            <span className="text-2xl font-black text-white">{pax}</span>
                            <p className="text-[9px] text-slate-500 uppercase font-bold">Guests</p>
                        </div>
                        <button 
                            onClick={() => setPax(p => p + 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 transition-colors text-slate-400"
                        >
                            <UserPlus size={18} />
                        </button>
                    </div>
                    
                    <div className={`hidden sm:block flex-1 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                         <input 
                            type="range" 
                            min="1" 
                            max="16" 
                            value={pax} 
                            onChange={(e) => setPax(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
                            <span>1</span>
                            <span>8</span>
                            <span>16</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Box */}
            <div className="w-full md:w-1/3">
                <label className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">
                    <Search size={14} />
                    Find Vessel
                </label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Search className="h-5 w-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>
    </GlassCard>
  );
}
