import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken, 
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { 
  Anchor, 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  DollarSign, 
  TrendingUp, 
  Search,
  RefreshCw,
  Minus,
  UserPlus,
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  Wand2,
  AlertCircle,
  Ship,
  Navigation,
  Lock,
  User,
  Check,
  ArrowLeft,
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle
} from 'lucide-react';

import { auth, db, appId } from './config/firebase';
import { COLLECTION_YACHTS, COLLECTION_SETTINGS, DOC_SETTINGS } from './config/constants';
import { formatCurrency, parsePrice } from './utils/formatters';
import GlassCard from './components/ui/GlassCard';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Modal from './components/ui/Modal';
import PaymentManager from './components/features/PaymentManager';

// --- Main Application Component ---

export default function YachtManager() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isCaptain, setIsCaptain] = useState(false); // Role State
  const [yachts, setYachts] = useState([]);
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(25); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pax, setPax] = useState(8); 
  const [isRateLoading, setIsRateLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [qrCurrency, setQrCurrency] = useState('EUR'); // 'EUR' or 'CZK'
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Trip Settings Form State
  const [tripSettings, setTripSettings] = useState({
    confirmedGuests: '',
    captainIbanEur: '',
    captainIbanCzk: '',
    depositAmount: '',
    finalPaymentAmount: ''
  });

  // Yacht Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    link: '',
    detailsLink: '',
    imageUrl: '',
    price: '',
    charterPack: '',
    extras: ''
  });

  // --- Authentication ---
  useEffect(() => {
    const initAuth = async () => {
      // 1. Handle Magic Token (Sandbox/AI Environment)
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
           await signInWithCustomToken(auth, __initial_auth_token);
        } catch (e) {
           console.error("Custom token auth failed", e);
        }
      }
    };
    
    initAuth();
    
    // 2. Listen for Auth Changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is logged in (Captain or Guest)
        setUser(currentUser);
        setIsCaptain(!currentUser.isAnonymous);
      } else {
        // No user logged in, fallback to Guest
        signInAnonymously(auth).catch((e) => console.warn("Guest login failed", e));
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Auth Handlers ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setIsAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (error) {
      console.error("Auth Error:", error);
      if (error.code === 'auth/operation-not-allowed') {
          setAuthError('Configuration Error: Enable "Email/Password" in Firebase Console.');
      } else {
          setAuthError("Invalid credentials. Only authorized Captains may enter.");
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    signInAnonymously(auth).catch((e) => console.warn("Guest re-login failed", e));
  };

  // --- Auto-Fetch Exchange Rate ---
  const fetchRate = async () => {
    setIsRateLoading(true);
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
        const data = await response.json();
        if (data && data.rates && data.rates.CZK) {
            setExchangeRate(data.rates.CZK);
            if (isCaptain) updateRateInDb(data.rates.CZK);
        }
    } catch (e) {
        console.warn("Failed to auto-fetch rate");
    } finally {
        setIsRateLoading(false);
    }
  };

  useEffect(() => {
      fetchRate();
  }, []);

  // --- Data Sync ---
  useEffect(() => {
    if (!tripId) return;

    // Fetch Trip Data
    const tripRef = doc(db, 'artifacts', appId, 'trips', tripId);
    const unsubTrip = onSnapshot(tripRef, (docSnap) => {
       if (docSnap.exists()) {
          const data = docSnap.data();
          setTripData(data);
          if (data.confirmedGuests) setPax(data.confirmedGuests);
          setTripSettings({
             confirmedGuests: data.confirmedGuests || '',
             captainIbanEur: data.captainIbanEur || '',
             captainIbanCzk: data.captainIbanCzk || '',
             depositAmount: data.depositAmount || '',
             finalPaymentAmount: data.finalPaymentAmount || ''
          });
       } else {
          navigate('/');
       }
    });

    // Fetch Yachts for this Trip
    const q = query(collection(db, 'artifacts', appId, 'trips', tripId, 'yachts'));
    const unsubYachts = onSnapshot(q, (snapshot) => {
      const loadedYachts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setYachts(loadedYachts);
      setLoading(false);
    });

    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_SETTINGS, DOC_SETTINGS);
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setExchangeRate(docSnap.data().rate || 25);
      }
    });

    return () => {
      unsubTrip();
      unsubYachts();
      unsubSettings();
    };
  }, [user, tripId]);

  // --- Handlers ---

  const handleSaveYacht = async () => {
    if (!isCaptain) return; 
    if (!formData.name) return;

    const payload = {
      name: formData.name,
      link: formData.link,
      detailsLink: formData.detailsLink,
      imageUrl: formData.imageUrl,
      price: parseFloat(formData.price) || 0,
      charterPack: parseFloat(formData.charterPack) || 0,
      extras: parseFloat(formData.extras) || 0,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'artifacts', appId, 'trips', tripId, 'yachts', editingId), payload);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'trips', tripId, 'yachts'), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!isCaptain) return; 
    if (!confirm("Delete this yacht?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'trips', tripId, 'yachts', id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleSelectYacht = async (yachtId) => {
     if (!isCaptain) return;
     try {
        await updateDoc(doc(db, 'artifacts', appId, 'trips', tripId), {
           selectedYachtId: yachtId === tripData?.selectedYachtId ? null : yachtId
        });
     } catch (error) {
        console.error("Error selecting yacht:", error);
     }
  };

  const handleConfirmTrip = async () => {
    if (!isCaptain || !tripData?.selectedYachtId) return;
    
    const selectedYacht = yachts.find(y => y.id === tripData.selectedYachtId);
    if (!selectedYacht) return;

    const totalCost = selectedYacht.price + selectedYacht.charterPack + selectedYacht.extras;
    const deposit = totalCost * 0.5;
    const final = totalCost * 0.5;

    if (!confirm(`Confirm trip with ${selectedYacht.name}? This will set Deposit to €${deposit} and Final Payment to €${final}.`)) return;

    try {
       await updateDoc(doc(db, 'artifacts', appId, 'trips', tripId), {
          status: 'confirmed',
          depositAmount: deposit,
          finalPaymentAmount: final,
          confirmedGuests: pax // Lock guest count
       });
    } catch (error) {
       console.error("Error confirming trip:", error);
    }
  };

  const handleSaveSettings = async () => {
     if (!isCaptain) return;
     try {
        await updateDoc(doc(db, 'artifacts', appId, 'trips', tripId), {
           confirmedGuests: parseInt(tripSettings.confirmedGuests) || null,
           captainIbanEur: tripSettings.captainIbanEur,
           captainIbanCzk: tripSettings.captainIbanCzk,
           depositAmount: parseFloat(tripSettings.depositAmount) || 0,
           finalPaymentAmount: parseFloat(tripSettings.finalPaymentAmount) || 0
        });
        setIsSettingsModalOpen(false);
     } catch (error) {
        console.error("Error saving settings:", error);
     }
  };

  const updateRateInDb = async (newRate) => {
      if (!isCaptain) return; 
      try {
        const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_SETTINGS, DOC_SETTINGS);
        await setDoc(settingsRef, { rate: parseFloat(newRate) }, { merge: true });
      } catch (e) { console.error(e); }
  }

  const handleManualRateChange = (val) => {
      setExchangeRate(val);
      updateRateInDb(val);
  }

  // --- SMART PARSING LOGIC (AAAYacht) ---
  const fetchAaayachtData = async (url) => {
    if (!url) return;
    setIsFetchingData(true);
    setFetchError(false);

    let htmlContent = "";
    let fetchSuccess = false;

    try {
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
            const data = await response.json();
            if (data && data.contents) {
                htmlContent = data.contents;
                fetchSuccess = true;
            }
        }
      } catch (err1) { console.warn("Proxy 1 failed"); }

      if (!fetchSuccess) {
          try {
            const backupProxy = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const response = await fetch(backupProxy);
            if (response.ok) {
                htmlContent = await response.text();
                fetchSuccess = true;
            }
          } catch (err2) { console.warn("Proxy 2 failed"); }
      }

      if (!fetchSuccess || !htmlContent) {
          throw new Error("All proxies failed");
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");

      const nameEl = doc.querySelector('h1.yacht-name-header');
      const name = nameEl ? nameEl.textContent.trim() : "";

      const imgEl = doc.querySelector('meta[property="og:image"]');
      const image = imgEl ? imgEl.getAttribute('content') : "";
      
      let techSpecsUrl = "";
      if (image) {
          const idMatch = image.match(/yacht\/(\d+)\//);
          if (idMatch && idMatch[1]) {
              techSpecsUrl = `https://ws.nausys.com/CBMS-external/rest/yacht/${idMatch[1]}/html`;
          }
      }

      const priceContainer = doc.querySelector('.price-after-discount');
      let price = 0;
      if (priceContainer) {
          const text = priceContainer.textContent;
          const match = text.match(/([\d\s]+[,.]\d{2})/);
          if (match && match[1]) {
              price = parsePrice(match[1]);
          }
      }

      let charterPack = 0;
      const allElements = Array.from(doc.querySelectorAll('*'));
      const labelNode = allElements.find(el => 
          el.children.length === 0 && 
          (el.textContent.toLowerCase().includes('charter package') || 
           el.textContent.toLowerCase().includes('transit log'))
      );

      if (labelNode) {
         const parentRow = labelNode.closest('.row');
         if (parentRow) {
             const bTag = parentRow.querySelector('b');
             if (bTag) {
                 charterPack = parsePrice(bTag.textContent);
             }
         }
      }

      setFormData(prev => ({
          ...prev,
          name: name || prev.name,
          imageUrl: image || prev.imageUrl,
          detailsLink: techSpecsUrl || prev.detailsLink,
          price: price || prev.price,
          charterPack: charterPack || prev.charterPack,
          link: url
      }));

    } catch (error) {
        console.error("Failed to fetch yacht data", error);
        setFetchError(true);
        setTimeout(() => setFetchError(false), 3000);
    } finally {
        setIsFetchingData(false);
    }
  };

  const handleLinkBlur = (e) => {
    const url = e.target.value;
    if (!url) return;

    if (url.includes('aaayacht.cz')) {
        fetchAaayachtData(url);
    } else if (url.includes('nausys') || url.includes('booking-manager')) {
        const idMatch = url.match(/(?:yacht\/|yachtId=|id=)(\d+)/);
        if (idMatch && idMatch[1]) {
            const nausysImage = `https://ws.nausys.com/CBMS-external/rest/yacht/${idMatch[1]}/pictures/main.jpg`;
            if (!formData.imageUrl) {
                setFormData(prev => ({ ...prev, imageUrl: nausysImage }));
            }
        }
    }
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
    resetForm();
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', link: '', detailsLink: '', imageUrl: '', price: '', charterPack: '', extras: '' });
    setEditingId(null);
  };

  const eurToCzk = (eur) => (eur * exchangeRate);

  const filteredYachts = useMemo(() => {
    return yachts.filter(y => 
      y.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [yachts, searchTerm]);

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

      {/* Navbar */}
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

      {/* Main Interface */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Trip Status Banner */}
        {tripData?.status === 'confirmed' && (
           <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4">
              <CheckCircle className="text-emerald-400" size={24} />
              <span className="text-emerald-300 font-bold text-lg tracking-wide uppercase">Trip Confirmed</span>
           </div>
        )}

        {/* Controller Bar (Pax + Search) */}
        <GlassCard className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Dynamic Pax Splitter */}
                <div className="flex-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">
                        <Users size={14} />
                        Guest Count
                        {tripData?.confirmedGuests && <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px]">LOCKED</span>}
                    </label>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-3 bg-slate-950/50 p-1.5 rounded-xl border border-white/10 ${tripData?.confirmedGuests ? 'opacity-50 pointer-events-none' : ''}`}>
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
                        
                        <div className={`hidden sm:block flex-1 ${tripData?.confirmedGuests ? 'opacity-50 pointer-events-none' : ''}`}>
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

        {/* Main Data Grid */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-sm">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                   {/* Image Column Header */}
                   <th className="sticky left-0 z-20 bg-slate-900/95 backdrop-blur px-4 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider w-40 border-r border-white/10 text-center">
                    <ImageIcon size={16} className="mx-auto"/>
                  </th>

                  <th className="px-6 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider w-64">
                    Vessel Option
                  </th>
                  <th className="px-4 py-5 text-right text-xs font-extrabold text-slate-500 uppercase tracking-wider w-32">Boat Price</th>
                  <th className="px-4 py-5 text-right text-xs font-extrabold text-slate-500 uppercase tracking-wider w-32">Logs/Pack</th>
                  <th className="px-4 py-5 text-right text-xs font-extrabold text-slate-500 uppercase tracking-wider w-32">Extras</th>
                  <th className="px-4 py-5 text-right text-xs font-extrabold text-amber-500 uppercase tracking-wider w-40 bg-amber-500/5">
                     <span className="flex items-center justify-end gap-1"><DollarSign size={12}/> Total (EUR)</span>
                  </th>
                  
                  <th className="px-4 py-5 text-center w-56 bg-blue-500/5 border-l border-white/5">
                       <div className="flex flex-col items-center">
                           <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                               <Users size={12}/> Cost Per Guest
                           </span>
                       </div>
                  </th>

                  {/* Hide Actions column for Guests */}
                  {isCaptain && <th className="px-6 py-5 text-right bg-slate-900/30"><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredYachts.length === 0 ? (
                   <tr>
                     <td colSpan="11" className="px-6 py-20 text-center text-slate-500">
                       <Ship className="mx-auto h-16 w-16 text-slate-700 mb-4 animate-pulse" />
                       <p className="text-lg font-medium text-slate-400">No proposals created yet.</p>
                       {isCaptain && <Button variant="secondary" onClick={openNew} className="mt-4">Start a New Proposal</Button>}
                     </td>
                   </tr>
                ) : (
                  filteredYachts.map((yacht) => {
                    const totalEur = yacht.price + yacht.charterPack + yacht.extras;
                    const perPersonEur = totalEur / pax;
                    const perPersonCzk = eurToCzk(perPersonEur);
                    const isSelected = tripData?.selectedYachtId === yacht.id;
                    
                    return (
                      <tr key={yacht.id} className={`group transition-colors ${isSelected ? 'bg-amber-500/10 hover:bg-amber-500/20' : 'hover:bg-white/[0.02]'}`}>
                        
                        {/* Clickable Image Column */}
                        <td className={`sticky left-0 z-10 border-r border-white/5 px-4 py-4 text-center ${isSelected ? 'bg-slate-900/95 shadow-[4px_0_24px_-4px_rgba(245,158,11,0.2)]' : 'bg-slate-900/95'}`}>
                           <div className={`relative h-20 w-32 rounded-lg bg-slate-800 border mx-auto transition-all duration-300 overflow-hidden ${isSelected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-white/10 group-hover:border-amber-500/50'}`}>
                             {isSelected && (
                                <div className="absolute top-1 right-1 z-20 bg-amber-500 text-slate-900 rounded-full p-0.5 shadow-lg">
                                   <Check size={12} strokeWidth={4} />
                                </div>
                             )}
                             {yacht.imageUrl ? (
                               <a 
                                 href={yacht.imageUrl} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="block w-full h-full cursor-pointer"
                               >
                                 <img 
                                   src={yacht.imageUrl} 
                                   alt={yacht.name} 
                                   className="h-full w-full object-cover hover:opacity-80 transition-opacity"
                                   onError={(e) => {
                                     e.target.onerror = null;
                                     e.target.style.display = 'none';
                                     e.target.parentElement.nextSibling.style.display = 'flex';
                                   }}
                                 />
                               </a>
                             ) : null}
                             <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-600 pointer-events-none" style={{ display: yacht.imageUrl ? 'none' : 'flex' }}>
                                <Anchor size={24} />
                             </div>
                           </div>
                        </td>

                        {/* Info Column */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="font-bold text-white text-lg truncate tracking-tight flex items-center gap-2">
                              {yacht.link ? (
                                <a href={yacht.link} target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                                  {yacht.name}
                                  <ExternalLink size={12} className="opacity-50" />
                                </a>
                              ) : yacht.name}
                            </div>
                            {yacht.detailsLink && (
                              <a href={yacht.detailsLink} target="_blank" rel="noreferrer" className="text-xs font-mono text-slate-500 hover:text-amber-300 transition-colors mt-1 flex items-center gap-1">
                                Tech Specs
                              </a>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-4 text-slate-400 text-right font-mono text-sm group-hover:text-slate-200 transition-colors">{formatCurrency(yacht.price)}</td>
                        <td className="px-4 py-4 text-slate-400 text-right font-mono text-sm group-hover:text-slate-200 transition-colors">{formatCurrency(yacht.charterPack)}</td>
                        <td className="px-4 py-4 text-slate-400 text-right font-mono text-sm group-hover:text-slate-200 transition-colors">{formatCurrency(yacht.extras)}</td>
                        
                        {/* Total EUR */}
                        <td className="px-4 py-4 text-right bg-amber-500/[0.05]">
                            <div className="font-mono font-bold text-amber-400 text-base shadow-amber-500/50 drop-shadow-sm">
                                {formatCurrency(totalEur)}
                            </div>
                        </td>

                        {/* Split Dynamic */}
                        <td className="px-4 py-4 bg-blue-500/[0.02] border-l border-white/5">
                            <div className="flex flex-col items-center gap-1">
                                <div className="text-xs text-slate-400 font-mono">{formatCurrency(perPersonEur)} <span className="text-[9px] text-slate-600">EUR</span></div>
                                <div className="text-lg font-black text-white font-mono bg-white/5 px-3 py-1 rounded-md border border-white/10 shadow-inner">
                                    {formatCurrency(perPersonCzk, 'CZK')}
                                </div>
                            </div>
                        </td>

                        {/* Actions (Protected) */}
                        {isCaptain && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                              <Button 
                                variant={isSelected ? "primary" : "secondary"} 
                                className={isSelected ? "bg-amber-500 text-white" : ""}
                                onClick={() => handleSelectYacht(yacht.id)}
                              >
                                 {isSelected ? "Selected" : "Select"}
                              </Button>
                              <Button variant="icon" onClick={() => openEdit(yacht)}>
                                  <Edit2 size={16} />
                              </Button>
                              <button 
                                  onClick={() => handleDelete(yacht.id)}
                                  className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                              >
                                  <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
        </div>

        {/* Payment & QR Section (Visible if Yacht Selected & IBAN set) */}
        {tripData?.selectedYachtId && (
           <GlassCard className="p-6 md:p-8 mt-8 border-amber-500/20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-black text-white flex items-center gap-3">
                        <QrCode className="text-amber-500" />
                        Payment Details
                      </h3>
                      {/* Confirm Trip Button for Captain */}
                      {isCaptain && tripData.status !== 'confirmed' && (
                          <Button variant="primary" onClick={handleConfirmTrip} icon={CheckCircle}>
                              Confirm Trip
                          </Button>
                      )}
                  </div>
                  
                  {/* Currency Toggler */}
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-white/10">
                      <button 
                         onClick={() => setQrCurrency('EUR')}
                         className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${qrCurrency === 'EUR' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                      >
                         EUR (€)
                      </button>
                      <button 
                         onClick={() => setQrCurrency('CZK')}
                         className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${qrCurrency === 'CZK' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                      >
                         CZK (Kč)
                      </button>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Deposit QR */}
                 {tripData.depositAmount > 0 && (
                    <div className="bg-white p-4 rounded-xl flex flex-col items-center gap-4">
                       {qrCurrency === 'EUR' && tripData.captainIbanEur ? (
                          <>
                            <QRCodeSVG 
                                value={`SPD*1.0*ACC:${tripData.captainIbanEur}*AM:${tripData.depositAmount}*CC:EUR*MSG:Deposit ${tripData.name}*`}
                                size={200}
                            />
                            <div className="text-center">
                                <div className="text-slate-900 font-black text-xl">Deposit: {formatCurrency(tripData.depositAmount)}</div>
                                <div className="text-slate-500 text-xs font-mono mt-1">Scan to Pay (EUR)</div>
                            </div>
                          </>
                       ) : qrCurrency === 'CZK' && tripData.captainIbanCzk ? (
                          <>
                            <QRCodeSVG 
                                value={`SPD*1.0*ACC:${tripData.captainIbanCzk}*AM:${eurToCzk(tripData.depositAmount).toFixed(0)}*CC:CZK*MSG:Deposit ${tripData.name}*`}
                                size={200}
                            />
                            <div className="text-center">
                                <div className="text-slate-900 font-black text-xl">Deposit: {formatCurrency(eurToCzk(tripData.depositAmount), 'CZK')}</div>
                                <div className="text-slate-500 text-xs font-mono mt-1">Scan to Pay (CZK)</div>
                            </div>
                          </>
                       ) : (
                          <div className="h-[200px] w-[200px] flex items-center justify-center bg-slate-100 text-slate-400 text-sm text-center p-4">
                             No IBAN for {qrCurrency}
                          </div>
                       )}
                    </div>
                 )}

                 {/* Final Payment QR */}
                 {tripData.finalPaymentAmount > 0 && (
                    <div className="bg-white p-4 rounded-xl flex flex-col items-center gap-4">
                       {qrCurrency === 'EUR' && tripData.captainIbanEur ? (
                          <>
                            <QRCodeSVG 
                                value={`SPD*1.0*ACC:${tripData.captainIbanEur}*AM:${tripData.finalPaymentAmount}*CC:EUR*MSG:Final ${tripData.name}*`}
                                size={200}
                            />
                            <div className="text-center">
                                <div className="text-slate-900 font-black text-xl">Final: {formatCurrency(tripData.finalPaymentAmount)}</div>
                                <div className="text-slate-500 text-xs font-mono mt-1">Scan to Pay (EUR)</div>
                            </div>
                          </>
                       ) : qrCurrency === 'CZK' && tripData.captainIbanCzk ? (
                          <>
                            <QRCodeSVG 
                                value={`SPD*1.0*ACC:${tripData.captainIbanCzk}*AM:${eurToCzk(tripData.finalPaymentAmount).toFixed(0)}*CC:CZK*MSG:Final ${tripData.name}*`}
                                size={200}
                            />
                            <div className="text-center">
                                <div className="text-slate-900 font-black text-xl">Final: {formatCurrency(eurToCzk(tripData.finalPaymentAmount), 'CZK')}</div>
                                <div className="text-slate-500 text-xs font-mono mt-1">Scan to Pay (CZK)</div>
                            </div>
                          </>
                       ) : (
                          <div className="h-[200px] w-[200px] flex items-center justify-center bg-slate-100 text-slate-400 text-sm text-center p-4">
                             No IBAN for {qrCurrency}
                          </div>
                       )}
                    </div>
                 )}
              </div>
           </GlassCard>
        )}

        {/* Payment Manager Component */}
        <PaymentManager tripId={tripId} isCaptain={isCaptain} exchangeRate={exchangeRate} />

      </main>

      {/* Trip Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Trip Settings"
        size="lg"
      >
         <div className="space-y-6">
            <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 space-y-4">
               <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Guest Configuration</h4>
               <Input 
                  label="Confirmed Guest Count"
                  placeholder="e.g. 8"
                  type="number"
                  value={tripSettings.confirmedGuests}
                  onChange={(v) => setTripSettings({...tripSettings, confirmedGuests: v})}
                  prefix={<Users size={14} />}
               />
               <p className="text-xs text-slate-500">Setting this locks the guest count for all viewers.</p>
            </div>

            <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 space-y-4">
               <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Payment Configuration</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                      label="Captain's IBAN (EUR)"
                      placeholder="CZ..."
                      value={tripSettings.captainIbanEur}
                      onChange={(v) => setTripSettings({...tripSettings, captainIbanEur: v})}
                      prefix={<CreditCard size={14} />}
                  />
                  <Input 
                      label="Captain's IBAN (CZK)"
                      placeholder="CZ..."
                      value={tripSettings.captainIbanCzk}
                      onChange={(v) => setTripSettings({...tripSettings, captainIbanCzk: v})}
                      prefix={<CreditCard size={14} />}
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <Input 
                     label="Deposit Amount (EUR)"
                     type="number"
                     value={tripSettings.depositAmount}
                     onChange={(v) => setTripSettings({...tripSettings, depositAmount: v})}
                     prefix="€"
                  />
                  <Input 
                     label="Final Payment (EUR)"
                     type="number"
                     value={tripSettings.finalPaymentAmount}
                     onChange={(v) => setTripSettings({...tripSettings, finalPaymentAmount: v})}
                     prefix="€"
                  />
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
               <Button variant="secondary" onClick={() => setIsSettingsModalOpen(false)}>Cancel</Button>
               <Button variant="primary" onClick={handleSaveSettings} icon={Save}>Save Settings</Button>
            </div>
         </div>
      </Modal>

      {/* Edit Modal (Protected) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Option" : "Add Charter Option"}
      >
        <div className="space-y-6">
          
          {/* Top Section with Larger Image Preview */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
             <div className="relative h-32 w-48 rounded-xl bg-slate-950 border border-white/10 flex-shrink-0 overflow-hidden shadow-lg">
                {formData.imageUrl ? (
                   <a href={formData.imageUrl} target="_blank" rel="noreferrer">
                     <img src={formData.imageUrl} className="h-full w-full object-cover hover:opacity-75 transition-opacity" alt="Preview" onError={(e) => e.target.style.opacity = 0.3} />
                   </a>
                ) : (
                   <div className="h-full w-full flex items-center justify-center text-slate-600">
                      {isFetchingData ? <RefreshCw className="animate-spin" /> : <ImageIcon size={32} />}
                   </div>
                )}
             </div>
             <div className="flex-1 space-y-4 w-full">
                <Input 
                  label="Aaayacht Link (Magic Import)" 
                  placeholder="Paste booking link here..."
                  value={formData.link} 
                  onChange={(v) => setFormData({...formData, link: v})}
                  onBlur={handleLinkBlur}
                  prefix={isFetchingData ? <RefreshCw className="animate-spin" size={14} /> : fetchError ? <AlertCircle className="text-red-500" size={14} /> : <Wand2 size={14} className="text-amber-400" />}
                  disabled={isFetchingData}
                />
                <Input 
                  label="Vessel Name" 
                  placeholder="e.g. Bavaria 46 Cataleya"
                  value={formData.name} 
                  onChange={(v) => setFormData({...formData, name: v})} 
                  disabled={isFetchingData}
                />
             </div>
          </div>

          <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Tech Specs URL" 
                  placeholder="https://..."
                  value={formData.detailsLink} 
                  onChange={(v) => setFormData({...formData, detailsLink: v})} 
                  prefix={<LinkIcon size={14} />}
                />
                <Input 
                  label="Image Source" 
                  placeholder="http://.../main.jpg"
                  value={formData.imageUrl} 
                  onChange={(v) => setFormData({...formData, imageUrl: v})} 
                  prefix={<ImageIcon size={14} />}
              />
             </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <DollarSign size={14} /> Voyage Costs (EUR)
             </label>
             <div className="grid grid-cols-3 gap-4">
               <Input 
                label="Base Price" 
                type="number"
                prefix="€"
                placeholder="0"
                value={formData.price} 
                onChange={(v) => setFormData({...formData, price: v})} 
              />
               <Input 
                label="Logs / Pack" 
                type="number"
                prefix="€"
                placeholder="0"
                value={formData.charterPack} 
                onChange={(v) => setFormData({...formData, charterPack: v})} 
              />
               <Input 
                label="Extras" 
                type="number"
                prefix="€"
                placeholder="0"
                value={formData.extras} 
                onChange={(v) => setFormData({...formData, extras: v})} 
              />
             </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveYacht} icon={Save} disabled={isFetchingData}>
              {editingId ? "Update Proposal" : "Add to Deck"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Auth Modal (Login Only) */}
      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Captain Login"
        size="sm"
      >
        <form onSubmit={handleLogin} className="space-y-6">
          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
              {authError}
            </div>
          )}
          
          <div className="space-y-4">
            <Input 
              label="Email Address" 
              type="email"
              placeholder="captain@deck.com"
              value={authEmail} 
              onChange={setAuthEmail}
              prefix={<User size={14} />}
            />
            <Input 
              label="Password" 
              type="password"
              placeholder="••••••••"
              value={authPassword} 
              onChange={setAuthPassword}
              prefix={<Lock size={14} />}
            />
          </div>

          <div className="pt-2">
            <Button variant="primary" className="w-full" onClick={handleLogin}>
              Board the Ship
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}