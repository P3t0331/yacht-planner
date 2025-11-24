import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Navigation, 
  TrendingUp, 
  RefreshCw, 
  ArrowLeft, 
  Banknote, 
  Plus, 
  Lock 
} from 'lucide-react';
import Button from '../ui/Button';

export default function Navbar({ 
  tripData, 
  isCaptain, 
  exchangeRate, 
  isRateLoading, 
  fetchRate, 
  handleManualRateChange, 
  setIsSettingsModalOpen, 
  openNew, 
  setIsAuthModalOpen 
}) {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-40 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo Area */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur opacity-20 group-hover:opacity-50 transition-opacity duration-500"></div>
              <div className="relative bg-slate-900 p-2.5 rounded-full border border-amber-500/30">
                <Navigation className="text-amber-400 h-6 w-6 transform group-hover:rotate-45 transition-transform duration-700" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-widest text-white uppercase">
                Captain's<span className="text-amber-500">Deck</span>
              </h1>
              <p className="text-[10px] font-bold text-amber-500/70 tracking-[0.2em] uppercase">
                 {tripData?.name || 'Trip Proposal System'}
              </p>
              {tripData?.startDate && tripData?.endDate && (
                <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                   {tripData.startDate.toDate().toLocaleDateString()} - {tripData.endDate.toDate().toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-6">
            
            {/* Live Rate Ticker (Read Only for Guest, Editable for Captain) */}
            <div className="hidden md:flex flex-col items-end">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500/70 uppercase tracking-wider mb-1">
                 <TrendingUp size={12} />
                 Exchange Rate
                 <button onClick={fetchRate} className={`hover:text-white transition-colors ${isRateLoading ? 'animate-spin' : ''}`}>
                   <RefreshCw size={12} />
                 </button>
              </div>
              <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10 hover:border-amber-500/50 transition-colors">
                <span className="px-2 text-slate-400 text-sm">€1 =</span>
                <input 
                  type="number" 
                  step="0.1"
                  disabled={!isCaptain}
                  className={`w-16 bg-transparent text-right text-lg font-bold text-white focus:outline-none ${!isCaptain ? 'opacity-70 cursor-default' : ''}`}
                  value={exchangeRate}
                  onChange={(e) => handleManualRateChange(e.target.value)}
                />
                <span className="px-2 text-amber-400 font-bold text-sm">CZK</span>
              </div>
            </div>

            <div className="h-10 w-px bg-white/10 mx-2 hidden md:block"></div>

            {/* Auth Button or Actions */}
            {isCaptain ? (
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => navigate('/')} icon={ArrowLeft}>
                   Dashboard
                </Button>
                <Button variant="secondary" onClick={() => setIsSettingsModalOpen(true)} icon={Banknote}>
                   Trip Settings
                </Button>
                <Button variant="primary" icon={Plus} onClick={openNew}>
                  Add Option
                </Button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 border border-white/5 hover:border-amber-500/30 transition-all text-sm font-bold uppercase tracking-wide"
              >
                <Lock size={14} /> Captain Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
