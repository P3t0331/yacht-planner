import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
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
  Wind,
  Zap,
  Minus,
  UserPlus,
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  Wand2,
  AlertCircle,
  Ship,
  Navigation,
  Compass,
  Lock,
  LogOut,
  User
} from 'lucide-react';

// --- Firebase Configuration ---
let firebaseConfig;
let appId;

// 1. AI / Sandbox Environment (Automatic)
if (typeof __firebase_config !== 'undefined') {
  try {
    firebaseConfig = JSON.parse(__firebase_config);
    appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  } catch (e) {
    console.error("Error parsing config", e);
  }
} 

// 2. Production / Vercel Environment (Manual)
// NOTE: Uncomment this block when deploying to Vercel to read from .env

if (!firebaseConfig) {
  try {
    firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
    appId = 'yacht-manager-public'; 
  } catch (e) {
    console.warn("Vite env vars not found, skipping production config.");
  }
}


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Constants & Helpers ---
const COLLECTION_YACHTS = 'yachts';
const COLLECTION_SETTINGS = 'settings';
const DOC_SETTINGS = 'global_settings';

const formatCurrency = (amount, currency = 'EUR') => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat(currency === 'CZK' ? 'cs-CZ' : 'en-IE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper to clean price strings like "3 459,00 €" -> 3459.00
const parsePrice = (str) => {
  if (!str) return 0;
  // Remove all non-numeric chars except comma and dot
  let clean = str.replace(/[^\d,.]/g, '');
  // Replace comma with dot for float parsing if comma is decimal separator
  clean = clean.replace(',', '.');
  // If multiple dots exist (thousands separators), keep only the last one
  return parseFloat(clean) || 0;
};

// --- Components ---

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-slate-900/40 backdrop-blur-md border border-amber-500/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", icon: Icon, disabled }) => {
  const baseStyles = "inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 border border-amber-400/20",
    secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/30 backdrop-blur-sm",
    danger: "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50",
    ghost: "text-slate-300 hover:text-white hover:bg-white/5",
    icon: "p-2 rounded-full bg-white/5 hover:bg-white/20 text-amber-400 hover:text-amber-200 transition-colors",
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} className={children ? "mr-2" : ""} />}
      {children}
    </button>
  );
};

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

const Modal = ({ isOpen, onClose, title, children, size = "lg" }) => {
  if (!isOpen) return null;
  const maxWidth = size === "sm" ? "max-w-sm" : "max-w-lg";
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/80 transition-opacity" onClick={onClose}></div>
        <div className={`relative bg-slate-900 border border-amber-500/20 rounded-3xl shadow-2xl transform transition-all ${maxWidth} w-full overflow-hidden`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"></div>
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
              <Compass className="text-amber-500" size={24} />
              {title}
            </h3>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Application Component ---

export default function YachtManager() {
  const [user, setUser] = useState(null);
  const [isCaptain, setIsCaptain] = useState(false); // Role State
  const [yachts, setYachts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(25); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pax, setPax] = useState(8); 
  const [isRateLoading, setIsRateLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

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
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        // Default to anonymous (Guest)
        await signInAnonymously(auth).catch((e) => console.warn("Guest login failed", e));
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // If user is NOT anonymous, they are a Captain (authenticated via email)
        setIsCaptain(!currentUser.isAnonymous);
      } else {
        setIsCaptain(false);
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
    // Auto re-login as guest handled by the effect if needed, or user stays signed out until page refresh
    // To ensure guest access immediately after logout:
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
            // Only Captains persist the rate to DB for everyone
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
    if (!user) return;

    const q = query(collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_YACHTS));
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
      unsubYachts();
      unsubSettings();
    };
  }, [user]);

  // --- Handlers ---

  const handleSaveYacht = async () => {
    if (!isCaptain) return; // Security check
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
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_YACHTS, editingId), payload);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_YACHTS), {
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
    if (!isCaptain) return; // Security check
    if (!confirm("Delete this yacht?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_YACHTS, id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const updateRateInDb = async (newRate) => {
      if (!isCaptain) return; // Security check
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
            <div className="flex items-center gap-3 group cursor-default">
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
                <p className="text-[10px] font-bold text-amber-500/70 tracking-[0.2em] uppercase">Trip Proposal System</p>
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
                  <Button variant="primary" icon={Plus} onClick={openNew}>
                    Add Option
                  </Button>
                  <button 
                    onClick={handleLogout}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                    title="Captain Logout"
                  >
                    <LogOut size={20} />
                  </button>
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
        
        {/* Controller Bar (Pax + Search) */}
        <GlassCard className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Dynamic Pax Splitter */}
                <div className="flex-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">
                        <Users size={14} />
                        Guest Count
                    </label>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-slate-950/50 p-1.5 rounded-xl border border-white/10">
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
                        
                        <div className="hidden sm:block flex-1">
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
                    
                    return (
                      <tr key={yacht.id} className="group hover:bg-white/[0.02] transition-colors">
                        
                        {/* Clickable Image Column */}
                        <td className="sticky left-0 z-10 bg-slate-900/95 border-r border-white/5 px-4 py-4 text-center">
                           <div className="relative h-20 w-32 rounded-lg bg-slate-800 border border-white/10 mx-auto group-hover:border-amber-500/50 transition-all duration-300 overflow-hidden">
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
      </main>

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