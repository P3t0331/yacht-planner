import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Navigation, 
  TrendingUp, 
  RefreshCw, 
  ArrowLeft, 
  Banknote, 
  Plus, 
  Lock,
  Menu,
  X
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          
          {/* Logo Area */}
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur opacity-20 group-hover:opacity-50 transition-opacity duration-500"></div>
              <div className="relative bg-slate-900 p-2 sm:p-2.5 rounded-full border border-amber-500/30">
                <Navigation className="text-amber-400 h-5 w-5 sm:h-6 sm:w-6 transform group-hover:rotate-45 transition-transform duration-700" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-black tracking-widest text-white uppercase">
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
            {/* Mobile: Compact Logo Text */}
            <div className="sm:hidden">
              <h1 className="text-sm font-black tracking-wide text-white">
                Captain's<span className="text-amber-500">Deck</span>
              </h1>
              <p className="text-[8px] font-bold text-amber-500/70 tracking-wider uppercase truncate max-w-[120px]">
                 {tripData?.name || 'Trip System'}
              </p>
            </div>
          </div>
          
          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center gap-6">
            
            {/* Live Rate Ticker (Read Only for Guest, Editable for Captain) */}
            <div className="flex flex-col items-end">
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

            <div className="h-10 w-px bg-white/10 mx-2"></div>

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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/5 py-4 space-y-4">
            
            {/* Exchange Rate on Mobile */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500/70 uppercase tracking-wider">
                <TrendingUp size={12} />
                Exchange Rate
                <button onClick={fetchRate} className={`hover:text-white transition-colors ${isRateLoading ? 'animate-spin' : ''}`}>
                  <RefreshCw size={12} />
                </button>
              </div>
              <div className="flex items-center bg-white/5 rounded-lg p-2 border border-white/10 w-full max-w-xs">
                <span className="px-2 text-slate-400 text-sm">€1 =</span>
                <input 
                  type="number" 
                  step="0.1"
                  disabled={!isCaptain}
                  className={`flex-1 bg-transparent text-right text-lg font-bold text-white focus:outline-none ${!isCaptain ? 'opacity-70 cursor-default' : ''}`}
                  value={exchangeRate}
                  onChange={(e) => handleManualRateChange(e.target.value)}
                />
                <span className="px-2 text-amber-400 font-bold text-sm">CZK</span>
              </div>
            </div>

            <div className="h-px bg-white/10"></div>

            {/* Mobile Actions */}
            {isCaptain ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigate('/');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all text-sm font-bold w-full"
                >
                  <ArrowLeft size={16} />
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setIsSettingsModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all text-sm font-bold w-full"
                >
                  <Banknote size={16} />
                  Trip Settings
                </button>
                <button
                  onClick={() => {
                    openNew();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border border-amber-500/30 transition-all text-sm font-bold w-full"
                >
                  <Plus size={16} />
                  Add Option
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setIsAuthModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 border border-white/5 hover:border-amber-500/30 transition-all text-sm font-bold uppercase tracking-wide w-full"
              >
                <Lock size={16} /> Captain Login
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
