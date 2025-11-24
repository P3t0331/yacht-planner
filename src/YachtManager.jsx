import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useExchangeRate } from './hooks/useExchangeRate';
import { useTripData } from './hooks/useTripData';
import { useYachtActions } from './hooks/useYachtActions';

// Components
import Navbar from './components/features/Navbar';
import TripStatusBanner from './components/features/TripStatusBanner';
import ControllerBar from './components/features/ControllerBar';
import YachtTable from './components/features/YachtTable';
import PaymentQrSection from './components/features/PaymentQrSection';
import TripSettingsModal from './components/features/TripSettingsModal';
import YachtFormModal from './components/features/YachtFormModal';
import AuthModal from './components/features/AuthModal';
import PaymentManager from './components/features/PaymentManager';

// --- Main Application Component ---

export default function YachtManager() {
  const { tripId } = useParams();
  
  // State for UI controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null); // Used to pass data to modal

  // Custom Hooks
  const { user, isCaptain, authError, login } = useAuth();
  const { exchangeRate, isRateLoading, fetchRate, handleManualRateChange, eurToCzk } = useExchangeRate(isCaptain);
  const { tripData, yachts, pax, setPax } = useTripData(tripId, user);
  const { 
    isFetchingData, 
    fetchError, 
    saveYacht, 
    deleteYacht, 
    selectYacht, 
    confirmTrip, 
    updateTripSettings, 
    fetchAaayachtData 
  } = useYachtActions(tripId, isCaptain, tripData);

  // Derived State
  const filteredYachts = useMemo(() => {
    return yachts.filter(y => 
      y.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [yachts, searchTerm]);

  // Handlers
  const handleSaveYachtWrapper = async (data, id) => {
      const success = await saveYacht(data, id);
      if (success) {
          setIsModalOpen(false);
          setEditingId(null);
          setFormData(null);
      }
      return success;
  };

  const openEdit = (yacht) => {
    setFormData({
      name: yacht.name,
      link: yacht.link || '',
      detailsLink: yacht.detailsLink || '',
      imageUrl: yacht.imageUrl || '',
      price: yacht.price,
      charterPack: yacht.charterPack,
      extras: yacht.extras
    });
    setEditingId(yacht.id);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setFormData(null);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleConfirmTripWrapper = async () => {
      if (!tripData?.selectedYachtId) return;
      const selectedYacht = yachts.find(y => y.id === tripData.selectedYachtId);
      if (!selectedYacht) return;

      const totalCost = selectedYacht.price + selectedYacht.charterPack + selectedYacht.extras;
      const deposit = totalCost * 0.5;
      const final = totalCost * 0.5;

      if (!confirm(`Confirm trip with ${selectedYacht.name}? This will set Deposit to €${deposit} and Final Payment to €${final}.`)) return;

      await confirmTrip(selectedYacht, pax);
  };

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <div className="text-amber-400 font-mono text-sm animate-pulse tracking-widest">CAPTAIN ON BRIDGE...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-[#0f172a] to-black text-slate-200 font-sans selection:bg-amber-500/30 selection:text-amber-200 pb-20">
      
      {/* Ambient Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] opacity-50"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-amber-600/10 rounded-full blur-[120px] opacity-40"></div>
      </div>

      <Navbar 
        tripData={tripData}
        isCaptain={isCaptain}
        exchangeRate={exchangeRate}
        isRateLoading={isRateLoading}
        fetchRate={fetchRate}
        handleManualRateChange={handleManualRateChange}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
        openNew={openNew}
        setIsAuthModalOpen={setIsAuthModalOpen}
      />

      {/* Main Interface */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        <TripStatusBanner status={tripData?.status} />

        <ControllerBar 
            pax={pax}
            setPax={setPax}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isLocked={!!tripData?.confirmedGuests}
        />

        <YachtTable 
            yachts={filteredYachts}
            pax={pax}
            tripData={tripData}
            isCaptain={isCaptain}
            eurToCzk={eurToCzk}
            handleSelectYacht={selectYacht}
            openEdit={openEdit}
            handleDelete={deleteYacht}
            openNew={openNew}
        />

        <PaymentQrSection 
            tripData={tripData}
            isCaptain={isCaptain}
            handleConfirmTrip={handleConfirmTripWrapper}
            eurToCzk={eurToCzk}
        />

        <PaymentManager tripId={tripId} isCaptain={isCaptain} exchangeRate={exchangeRate} />

      </main>

      <TripSettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        tripData={tripData}
        handleSaveSettings={updateTripSettings}
      />

      <YachtFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingId={editingId}
        initialData={formData}
        handleSaveYacht={handleSaveYachtWrapper}
        fetchAaayachtData={fetchAaayachtData}
        isFetchingData={isFetchingData}
        fetchError={fetchError}
      />

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        login={login}
        authError={authError}
      />
    </div>
  );
}