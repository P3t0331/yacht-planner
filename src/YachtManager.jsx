import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  User, 
  Crosshair,
  Skull,
  AlertTriangle,
  Siren
} from 'lucide-react';

// --- Firebase Configuration ---
let firebaseConfig;
let appId;

if (typeof __firebase_config !== 'undefined') {
  try {
    firebaseConfig = JSON.parse(__firebase_config);
    appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  } catch (e) {
    console.error("Error parsing config", e);
  }
}

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

const parsePrice = (str) => {
  if (!str) return 0;
  let clean = str.replace(/[^\d,.]/g, '');
  clean = clean.replace(',', '.');
  return parseFloat(clean) || 0;
};

// --- SOUND ENGINE ---
const playKlaxon = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime); 
    
    osc.frequency.linearRampToValueAtTime(350, ctx.currentTime + 0.5);
    osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 1.0);
    osc.frequency.linearRampToValueAtTime(350, ctx.currentTime + 1.5);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);
    
    osc.start();
    osc.stop(ctx.currentTime + 2.0);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

// --- GLOBAL STYLES & ANIMATIONS ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Orbitron:wght@400;700&display=swap');

    /* --- CORE ANIMATIONS --- */
    @keyframes drift { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
    @keyframes wave { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    @keyframes bubble-rise { 0% { transform: translateY(100vh) scale(0.5); opacity: 0; } 50% { opacity: 0.5; } 100% { transform: translateY(-20vh) scale(1.5); opacity: 0; } }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    /* --- KRAKEN ATTACK SEQUENCE --- */
    
    /* 1. Warning Flash (0s - 1s) */
    @keyframes red-alert {
      0%, 100% { background-color: rgba(69, 10, 10, 0.8); box-shadow: inset 0 0 0 red; border-color: #ef4444; }
      50% { background-color: rgba(185, 28, 28, 0.4); box-shadow: inset 0 0 100px red; border-color: #7f1d1d; }
    }

    /* 2. Tentacles Rise (1s - 3s) */
    @keyframes kraken-rise { 
      0% { transform: translateY(120%) scale(0.8) rotate(5deg); opacity: 0; } 
      100% { transform: translateY(0%) scale(1) rotate(0deg); opacity: 1; } 
    }

    @keyframes tentacle-sway {
      0%, 100% { transform: rotate(-2deg) translateX(0); }
      50% { transform: rotate(3deg) translateX(10px); }
    }

    /* 3. Ink Blast (3s - 4s) */
    @keyframes ink-blast {
      0% { transform: scale(0.5); opacity: 0; }
      100% { transform: scale(2.5); opacity: 0.9; }
    }

    /* 4. The Struggle (Constant) */
    @keyframes victim-struggle {
      0% { transform: translate(0, 0) rotate(0deg); }
      25% { transform: translate(-3px, 3px) rotate(-2deg); }
      50% { transform: translate(3px, -3px) rotate(2deg); }
      75% { transform: translate(-3px, -3px) rotate(-2deg); }
      100% { transform: translate(0, 0) rotate(0deg); }
    }

    /* 5. The Drag Down (4s+) */
    @keyframes abyss-drag {
      0% { transform: translateY(0) scale(1); opacity: 1; filter: blur(0); }
      100% { transform: translateY(150px) scale(0.7) rotate(15deg); opacity: 0; filter: blur(8px); }
    }

    @keyframes ui-stabilize {
      0% { transform: scale(0.8); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    /* --- CLASSES --- */
    .font-cinzel { font-family: 'Cinzel', serif; }
    .font-orbitron { font-family: 'Orbitron', sans-serif; }
    
    .glass-panel {
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(245, 158, 11, 0.2);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
    }

    .ocean-bg {
      background: radial-gradient(circle at center, #1e293b 0%, #020617 100%);
    }

    .bubble {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
      animation: bubble-rise 15s infinite linear;
      bottom: -20px;
    }

    .wave-container {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 150px;
      overflow: hidden;
      z-index: 0;
      pointer-events: none;
    }

    .wave {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 200%;
      height: 100%;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" fill="%230ea5e9" opacity="0.1"><path d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>');
      background-size: 50% 100%;
      animation: wave 20s linear infinite;
    }
    .wave:nth-child(2) {
      bottom: 10px;
      opacity: 0.5;
      animation: wave 15s linear infinite reverse;
      filter: hue-rotate(45deg);
    }

    .shaking-screen {
      animation: victim-struggle 0.2s infinite;
    }

    /* --- INTERACTION FX --- */
    .btn-cyber {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    .btn-cyber:hover {
      transform: scale(1.05);
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
      border-color: #f59e0b;
    }
    .btn-cyber:active {
      transform: scale(0.95);
    }
    .btn-cyber::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: 0.5s;
    }
    .btn-cyber:hover::after {
      left: 100%;
    }

    /* --- KRAKEN SPECIFICS --- */
    .kraken-row-container {
        position: relative;
        background: #020617 !important;
        overflow: hidden;
        border: 3px solid #ef4444;
        animation: red-alert 0.5s infinite;
        box-shadow: 0 0 30px rgba(220, 38, 38, 0.3);
    }
    
    .tentacle-wrapper {
        position: absolute;
        bottom: -20px;
        width: 300px;
        height: 400px;
        z-index: 30;
        filter: drop-shadow(5px 5px 10px rgba(0,0,0,0.9));
    }

    .ink-cloud {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, #000 40%, transparent 90%);
        z-index: 25;
        opacity: 0;
        animation: ink-blast 3s ease-out forwards 2s;
        pointer-events: none;
    }

    .victim-card {
        position: relative;
        z-index: 20;
        animation: victim-struggle 0.1s infinite 1s, abyss-drag 8s ease-in forwards 4s; /* Delayed drag */
    }

    .harpoon-ui {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 100; /* SUPER HIGH Z-INDEX TO FIX CLICK ISSUE */
        opacity: 0;
        animation: ui-stabilize 0.5s ease-out forwards 1.5s; /* Rises above the chaos */
    }
  `}</style>
);

// --- Background Components ---
const Bubbles = () => {
  const bubbles = useMemo(() => [...Array(15)].map((_, i) => ({
    left: `${Math.random() * 100}%`,
    width: `${Math.random() * 20 + 5}px`,
    height: `${Math.random() * 20 + 5}px`,
    animationDuration: `${Math.random() * 10 + 10}s`,
    animationDelay: `${Math.random() * 5}s`,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {bubbles.map((style, i) => <div key={i} className="bubble" style={style} />)}
    </div>
  );
};

const Waves = () => (
  <div className="wave-container">
    <div className="wave"></div>
    <div className="wave"></div>
  </div>
);

// High-Quality Curved Tentacle
const TentacleSVG = ({ className, style, flip = false }) => (
  <div className={`tentacle-wrapper ${className}`} style={style}>
    <svg viewBox="0 0 200 500" preserveAspectRatio="none" className="w-full h-full" style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
        <defs>
        <linearGradient id="skin" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#330505" />
            <stop offset="50%" stopColor="#7f1d1d" />
            <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>
        <filter id="slime">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="2" result="turb"/>
            <feDisplacementMap in2="turb" in="SourceGraphic" scale="5"/>
        </filter>
        </defs>
        <path 
            d="M80,500 C20,400 180,300 60,200 C20,160 120,100 80,50 C60,25 40,25 20,50 C-20,120 80,180 120,220 C200,300 100,400 160,500 Z" 
            fill="url(#skin)"
            filter="url(#slime)"
            stroke="#2a0a0a"
            strokeWidth="2"
        />
        {/* Suckers */}
        <circle cx="70" cy="80" r="10" fill="#f87171" opacity="0.8" className="animate-pulse"/>
        <circle cx="50" cy="150" r="12" fill="#f87171" opacity="0.8" className="animate-pulse"/>
        <circle cx="90" cy="250" r="15" fill="#f87171" opacity="0.8" className="animate-pulse"/>
        <circle cx="120" cy="350" r="18" fill="#f87171" opacity="0.8" className="animate-pulse"/>
    </svg>
  </div>
);

// --- Basic Components ---

const GlassCard = ({ children, className = "" }) => (
  <div className={`glass-panel rounded-2xl ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", icon: Icon, disabled }) => {
  const baseStyles = "btn-cyber inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold rounded-xl focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-orbitron tracking-wider";
  const variants = {
    primary: "bg-gradient-to-r from-amber-600 to-orange-700 text-white border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
    secondary: "bg-slate-800/50 text-amber-100 border border-slate-600 hover:border-amber-500/50",
    danger: "bg-gradient-to-r from-red-600 to-red-800 text-white border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.4)]",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5",
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
    {label && <label className="block text-xs font-bold text-amber-500/80 uppercase tracking-widest font-orbitron">{label}</label>}
    <div className="relative">
      {prefix && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-500">
          {prefix}
        </div>
      )}
      <input
        type={type}
        disabled={disabled}
        className={`block w-full rounded-xl bg-slate-950/80 border border-slate-700 text-amber-100 placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:bg-slate-900 transition-all duration-300 py-3 font-orbitron text-sm ${prefix ? 'pl-9' : 'pl-4'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
    <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-md bg-black/60">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0" onClick={onClose}></div>
        <div className={`relative glass-panel rounded-3xl transform transition-all ${maxWidth} w-full overflow-hidden animate-[drift_1s_ease-out]`}>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3 font-cinzel border-b border-white/10 pb-4">
              <Compass className="text-amber-500" size={28} />
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
  const [isCaptain, setIsCaptain] = useState(false); 
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
  
  // Kraken State
  const [krakenTarget, setKrakenTarget] = useState(null);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsCaptain(!currentUser.isAnonymous);
      } else {
        signInAnonymously(auth).catch((e) => console.error("Guest login failed", e));
        setIsCaptain(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // KRAKEN LOGIC (30s Timer)
  useEffect(() => {
    if (!yachts.length) return;
    
    const triggerKraken = () => {
      const victimIndex = Math.floor(Math.random() * yachts.length);
      setKrakenTarget(yachts[victimIndex].id);
      playKlaxon(); // Audio Warning
    };

    const interval = setInterval(triggerKraken, 30000); // 30s
    return () => clearInterval(interval);
  }, [yachts]);

  const releaseKraken = () => {
    setKrakenTarget(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setIsAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (error) {
      if (error.code === 'auth/operation-not-allowed') {
          setAuthError('Configuration Error: Enable "Email/Password" in Firebase Console.');
      } else {
          setAuthError("Invalid credentials. Only authorized Captains may enter.");
      }
    }
  };

  const handleLogout = async () => { await signOut(auth); };

  const fetchRate = async () => {
    setIsRateLoading(true);
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
        const data = await response.json();
        if (data && data.rates && data.rates.CZK) {
            setExchangeRate(data.rates.CZK);
            if (isCaptain) updateRateInDb(data.rates.CZK); 
        }
    } catch (e) { console.warn("Failed to auto-fetch rate"); } 
    finally { setIsRateLoading(false); }
  };

  useEffect(() => { fetchRate(); }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_YACHTS));
    const unsubYachts = onSnapshot(q, (snapshot) => {
      const loadedYachts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setYachts(loadedYachts);
      setLoading(false);
    });
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_SETTINGS, DOC_SETTINGS);
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) setExchangeRate(docSnap.data().rate || 25);
    });
    return () => { unsubYachts(); unsubSettings(); };
  }, [user]);

  const handleSaveYacht = async () => {
    if (!isCaptain || !formData.name) return;
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
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', COLLECTION_YACHTS), { ...payload, createdAt: serverTimestamp() });
      }
      setIsModalOpen(false); resetForm();
    } catch (error) { console.error("Error saving:", error); }
  };

  const handleDelete = async (id) => {
    if (!isCaptain || !confirm("Delete this yacht?")) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', COLLECTION_YACHTS, id)); } 
    catch (error) { console.error("Error deleting:", error); }
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
            if (data && data.contents) { htmlContent = data.contents; fetchSuccess = true; }
        }
      } catch (err1) { }

      if (!fetchSuccess) {
          try {
            const backupProxy = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const response = await fetch(backupProxy);
            if (response.ok) { htmlContent = await response.text(); fetchSuccess = true; }
          } catch (err2) { }
      }

      if (!fetchSuccess || !htmlContent) throw new Error("All proxies failed");

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
      const nameEl = doc.querySelector('h1.yacht-name-header');
      const name = nameEl ? nameEl.textContent.trim() : "";
      const imgEl = doc.querySelector('meta[property="og:image"]');
      const image = imgEl ? imgEl.getAttribute('content') : "";
      let techSpecsUrl = "";
      if (image) {
          const idMatch = image.match(/yacht\/(\d+)\//);
          if (idMatch && idMatch[1]) techSpecsUrl = `https://ws.nausys.com/CBMS-external/rest/yacht/${idMatch[1]}/html`;
      }
      const priceContainer = doc.querySelector('.price-after-discount');
      let price = 0;
      if (priceContainer) {
          const text = priceContainer.textContent;
          const match = text.match(/([\d\s]+[,.]\d{2})/);
          if (match && match[1]) price = parsePrice(match[1]);
      }
      let charterPack = 0;
      const allElements = Array.from(doc.querySelectorAll('*'));
      const labelNode = allElements.find(el => el.children.length === 0 && (el.textContent.toLowerCase().includes('charter package') || el.textContent.toLowerCase().includes('transit log')));
      if (labelNode) {
         const parentRow = labelNode.closest('.row');
         if (parentRow) {
             const bTag = parentRow.querySelector('b');
             if (bTag) charterPack = parsePrice(bTag.textContent);
         }
      }
      setFormData(prev => ({ ...prev, name: name || prev.name, imageUrl: image || prev.imageUrl, detailsLink: techSpecsUrl || prev.detailsLink, price: price || prev.price, charterPack: charterPack || prev.charterPack, link: url }));
    } catch (error) { setFetchError(true); setTimeout(() => setFetchError(false), 3000); } finally { setIsFetchingData(false); }
  };

  const handleLinkBlur = (e) => {
    const url = e.target.value;
    if (!url) return;
    if (url.includes('aaayacht.cz')) { fetchAaayachtData(url); } 
    else if (url.includes('nausys') || url.includes('booking-manager')) {
        const idMatch = url.match(/(?:yacht\/|yachtId=|id=)(\d+)/);
        if (idMatch && idMatch[1]) {
            const nausysImage = `https://ws.nausys.com/CBMS-external/rest/yacht/${idMatch[1]}/pictures/main.jpg`;
            if (!formData.imageUrl) setFormData(prev => ({ ...prev, imageUrl: nausysImage }));
        }
    }
  };

  const openEdit = (yacht) => {
    setFormData({ name: yacht.name, link: yacht.link || '', detailsLink: yacht.detailsLink || '', imageUrl: yacht.imageUrl || '', price: yacht.price, charterPack: yacht.charterPack, extras: yacht.extras });
    setEditingId(yacht.id); setIsModalOpen(true);
  };

  const openNew = () => { resetForm(); setIsModalOpen(true); };
  const resetForm = () => { setFormData({ name: '', link: '', detailsLink: '', imageUrl: '', price: '', charterPack: '', extras: '' }); setEditingId(null); };
  const eurToCzk = (eur) => (eur * exchangeRate);
  const filteredYachts = useMemo(() => yachts.filter(y => y.name.toLowerCase().includes(searchTerm.toLowerCase())), [yachts, searchTerm]);

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center ocean-bg text-white gap-6">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-8 border-amber-500/30 rounded-full"></div>
        <div className="absolute inset-0 border-8 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
        <Anchor className="absolute inset-0 m-auto text-amber-500 animate-bounce" size={32}/>
      </div>
      <div className="text-amber-400 font-orbitron text-xl animate-pulse tracking-[0.3em]">AUTHENTICATING...</div>
    </div>
  );

  return (
    <div className={`min-h-screen ocean-bg text-slate-200 font-sans selection:bg-amber-500/30 selection:text-amber-200 pb-20 ${krakenTarget ? 'shaking-screen' : ''}`}>
      <GlobalStyles />
      <Bubbles />
      <Waves />

      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-8xl mx-auto px-6">
          <div className="flex justify-between h-24 items-center">
            <div className="flex items-center gap-4 group cursor-default">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500 rounded-full blur opacity-20 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative bg-slate-950 p-3 rounded-full border border-amber-500/30">
                  <Navigation className="text-amber-400 h-8 w-8 animate-[spin_10s_linear_infinite]" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-widest text-white font-cinzel">
                  CAPTAIN'S<span className="text-amber-500">DECK</span>
                </h1>
                <p className="text-[10px] font-bold text-amber-500/70 tracking-[0.3em] uppercase font-orbitron">Secure Fleet Protocol</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end glass-panel px-4 py-2 rounded-xl border-amber-500/20">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-500/70 uppercase tracking-wider mb-1 font-orbitron">
                   <TrendingUp size={12} />
                   Exchange Rate
                   <button onClick={fetchRate} className={`hover:text-white transition-colors ${isRateLoading ? 'animate-spin' : ''}`}>
                     <RefreshCw size={12} />
                   </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm font-orbitron">€1 =</span>
                  <input 
                    type="number" 
                    step="0.1"
                    disabled={!isCaptain}
                    className={`w-20 bg-transparent text-right text-xl font-bold text-amber-400 font-orbitron focus:outline-none ${!isCaptain ? 'opacity-70 cursor-default' : ''}`}
                    value={exchangeRate}
                    onChange={(e) => handleManualRateChange(e.target.value)}
                  />
                  <span className="text-amber-600 font-bold text-sm">CZK</span>
                </div>
              </div>

              <div className="h-12 w-px bg-white/10 mx-2 hidden md:block"></div>

              {isCaptain ? (
                <div className="flex gap-3">
                  <Button variant="primary" icon={Plus} onClick={openNew} className="shadow-amber-500/20">
                    Add Option
                  </Button>
                  <button 
                    onClick={handleLogout}
                    className="p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-red-500 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
                    title="Captain Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setIsAuthModalOpen(true); }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/50 hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 border border-slate-600 hover:border-amber-500 transition-all text-sm font-bold uppercase tracking-widest font-orbitron"
                >
                  <Lock size={14} /> Captain Access
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-8xl mx-auto px-6 py-12 space-y-10">
        <GlassCard className="p-6 md:p-8 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="flex-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 font-orbitron">
                        <Users size={14} />
                        Manifest (Guests)
                    </label>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 bg-slate-950/60 p-2 rounded-2xl border border-slate-700/50">
                            <button onClick={() => setPax(p => Math.max(1, p - 1))} className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-black transition-all text-slate-400">
                                <Minus size={20} />
                            </button>
                            <div className="w-20 text-center">
                                <span className="text-3xl font-black text-white font-orbitron">{pax}</span>
                            </div>
                            <button onClick={() => setPax(p => p + 1)} className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-black transition-all text-slate-400">
                                <UserPlus size={20} />
                            </button>
                        </div>
                        
                        <div className="hidden sm:block flex-1">
                             <input type="range" min="1" max="16" value={pax} onChange={(e) => setPax(parseInt(e.target.value))} className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400" />
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-1/3">
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 font-orbitron">
                        <Search size={14} />
                        Radar Search
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                             <Search className="h-5 w-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-12 pr-4 py-4 rounded-xl border border-slate-700 bg-slate-950/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-orbitron"
                            placeholder="Scan for vessel ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </GlassCard>

        <div className="rounded-3xl border border-white/10 shadow-2xl bg-slate-950/40 backdrop-blur-sm overflow-hidden">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-slate-900/80 border-b border-white/10">
                   <th className="px-6 py-6 text-xs font-black text-slate-400 uppercase tracking-wider w-48 text-center font-orbitron">Visual</th>
                   <th className="px-6 py-6 text-xs font-black text-slate-400 uppercase tracking-wider font-orbitron">Vessel Data</th>
                   <th className="px-6 py-6 text-right text-xs font-black text-slate-500 uppercase tracking-wider font-orbitron">Base Cost</th>
                   <th className="px-6 py-6 text-right text-xs font-black text-slate-500 uppercase tracking-wider font-orbitron">Log/Pack</th>
                   <th className="px-6 py-6 text-right text-xs font-black text-slate-500 uppercase tracking-wider font-orbitron">Extras</th>
                   <th className="px-6 py-6 text-right text-xs font-black text-amber-500 uppercase tracking-wider bg-amber-500/5 border-l border-white/5 font-orbitron">Total (EUR)</th>
                   <th className="px-6 py-6 text-center font-orbitron bg-cyan-950/20 border-l border-white/5">
                       <div className="flex flex-col items-center">
                           <span className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                               Split Cost
                           </span>
                       </div>
                  </th>
                  {isCaptain && <th className="px-6 py-6 text-right bg-slate-900/50 font-orbitron">Cmd</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredYachts.length === 0 ? (
                   <tr>
                     <td colSpan="11" className="px-6 py-32 text-center text-slate-600">
                       <Ship className="mx-auto h-24 w-24 text-slate-800 mb-6 opacity-50" />
                       <p className="text-2xl font-cinzel text-slate-500">Horizon Clear. No vessels detected.</p>
                       {isCaptain && <Button variant="secondary" onClick={openNew} className="mt-8">Deploy New Vessel</Button>}
                     </td>
                   </tr>
                ) : (
                  filteredYachts.map((yacht) => {
                    const isKrakenTarget = krakenTarget === yacht.id;
                    const totalEur = yacht.price + yacht.charterPack + yacht.extras;
                    const perPersonEur = totalEur / pax;
                    const perPersonCzk = eurToCzk(perPersonEur);
                    
                    if (isKrakenTarget) {
                      return (
                        <tr key={yacht.id} className="kraken-row-container h-64 row-warning">
                          <td colSpan={isCaptain ? 8 : 7} className="p-0 relative h-full overflow-visible">
                             {/* Tentacles Rising */}
                             <TentacleSVG className="absolute bottom-[-50px] left-[10%] w-[150px] h-[350px] z-30 animate-[kraken-rise_1.5s_ease-out_forwards_0.5s,tentacle-sway_3s_ease-in-out_infinite_2s]" />
                             <TentacleSVG className="absolute bottom-[-50px] right-[10%] w-[180px] h-[400px] z-30 animate-[kraken-rise_2s_ease-out_forwards_0.8s,tentacle-sway_4s_ease-in-out_infinite_reverse_2s]" flip />
                             <TentacleSVG className="absolute bottom-[-80px] left-[40%] w-[200px] h-[300px] z-20 animate-[kraken-rise_2.5s_ease-out_forwards_1s,tentacle-sway_5s_ease-in-out_infinite_3.5s]" />
                             
                             <div className="ink-cloud"></div>

                             {/* UI Layer: Victim Content vs Harpoon Button */}
                             <div className="w-full h-full relative">
                                 {/* Victim: Sinks into abyss */}
                                 <div className="victim-card h-full flex items-center justify-center opacity-50 grayscale">
                                     <div className="flex items-center gap-6 bg-slate-900/50 p-4 rounded-xl border border-red-900/50">
                                        <img src={yacht.imageUrl || ""} className="h-16 w-24 object-cover rounded opacity-50" />
                                        <div>
                                            <h3 className="text-red-500 font-cinzel text-2xl">{yacht.name}</h3>
                                            <p className="text-red-400/50 font-orbitron text-sm tracking-[0.5em]">SIGNAL LOST...</p>
                                        </div>
                                     </div>
                                 </div>

                                 {/* Harpoon: Rises and Stays Clickable */}
                                 <div className="harpoon-ui">
                                    <div className="flex flex-col items-center gap-2">
                                        <AlertTriangle size={40} className="text-red-500 animate-bounce" />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); releaseKraken(); }}
                                            className="bg-red-600 hover:bg-red-500 text-white font-black py-4 px-10 rounded-full shadow-[0_0_50px_rgba(220,38,38,1)] flex items-center gap-3 uppercase tracking-widest border-4 border-red-900 font-orbitron text-lg hover:scale-110 active:scale-95 transition-all cursor-pointer relative z-50"
                                        >
                                            <Crosshair size={24} className="animate-spin" /> FIRE HARPOON
                                        </button>
                                        <p className="text-red-400 font-mono text-xs animate-pulse">SYSTEM OVERRIDE REQUIRED</p>
                                    </div>
                                 </div>
                             </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={yacht.id} className="group hover:bg-white/[0.02] transition-colors relative">
                        <td className="px-6 py-4 text-center relative">
                           <div className="relative h-24 w-36 rounded-xl bg-slate-900 border border-white/10 mx-auto group-hover:border-amber-500/50 transition-all duration-500 overflow-hidden shadow-lg group-hover:shadow-amber-500/20 group-hover:scale-105">
                             {yacht.imageUrl ? (
                               <a href={yacht.imageUrl} target="_blank" rel="noreferrer" className="block w-full h-full">
                                 <img src={yacht.imageUrl} alt={yacht.name} className="h-full w-full object-cover hover:scale-110 transition-transform duration-700" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.nextSibling.style.display = 'flex'; }} />
                               </a>
                             ) : null}
                             <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-slate-700 pointer-events-none" style={{ display: yacht.imageUrl ? 'none' : 'flex' }}>
                                <Anchor size={32} />
                             </div>
                           </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="font-bold text-white text-lg truncate tracking-tight flex items-center gap-2 font-cinzel group-hover:text-amber-400 transition-colors">
                              {yacht.link ? (
                                <a href={yacht.link} target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                                  {yacht.name}
                                  <ExternalLink size={14} className="opacity-30 group-hover:opacity-100 text-amber-500" />
                                </a>
                              ) : yacht.name}
                            </div>
                            {yacht.detailsLink && (
                              <a href={yacht.detailsLink} target="_blank" rel="noreferrer" className="text-xs font-orbitron text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1 uppercase tracking-wider">
                                <Wand2 size={10}/> Technical Specs
                              </a>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-slate-400 text-right font-orbitron text-sm group-hover:text-white">{formatCurrency(yacht.price)}</td>
                        <td className="px-6 py-4 text-slate-400 text-right font-orbitron text-sm group-hover:text-white">{formatCurrency(yacht.charterPack)}</td>
                        <td className="px-6 py-4 text-slate-400 text-right font-orbitron text-sm group-hover:text-white">{formatCurrency(yacht.extras)}</td>
                        
                        <td className="px-6 py-4 text-right bg-amber-500/[0.02] border-l border-white/5 group-hover:bg-amber-500/10 transition-colors">
                            <div className="font-orbitron font-bold text-amber-400 text-lg drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                                {formatCurrency(totalEur)}
                            </div>
                        </td>

                        <td className="px-6 py-4 bg-cyan-950/10 border-l border-white/5 group-hover:bg-cyan-950/30 transition-colors">
                            <div className="flex flex-col items-center gap-1">
                                <div className="text-xs text-slate-400 font-orbitron">{formatCurrency(perPersonEur)} <span className="text-[9px] text-cyan-700">EUR</span></div>
                                <div className="text-lg font-bold text-cyan-300 font-orbitron bg-cyan-950/50 px-3 py-1 rounded border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                                    {formatCurrency(perPersonCzk, 'CZK')}
                                </div>
                            </div>
                        </td>

                        {isCaptain && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                              <Button variant="ghost" onClick={() => openEdit(yacht)} className="text-amber-400 hover:bg-amber-500/20"><Edit2 size={18} /></Button>
                              <Button variant="ghost" onClick={() => handleDelete(yacht.id)} className="text-red-400 hover:bg-red-500/20"><Trash2 size={18} /></Button>
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

      {/* Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Modify Specs" : "Commission Vessel"}>
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
             <div className="relative h-40 w-56 rounded-2xl bg-slate-950 border-2 border-white/10 flex-shrink-0 overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
                {formData.imageUrl ? (
                   <a href={formData.imageUrl} target="_blank" rel="noreferrer">
                     <img src={formData.imageUrl} className="h-full w-full object-cover" alt="Preview" onError={(e) => e.target.style.opacity = 0.3} />
                   </a>
                ) : (
                   <div className="h-full w-full flex items-center justify-center text-slate-700">
                      {isFetchingData ? <RefreshCw className="animate-spin text-amber-500" size={32} /> : <ImageIcon size={40} />}
                   </div>
                )}
             </div>
             <div className="flex-1 space-y-6 w-full">
                <Input 
                  label="Magic Link Import" 
                  placeholder="Paste Aaayacht/Nausys URL..."
                  value={formData.link} 
                  onChange={(v) => setFormData({...formData, link: v})}
                  onBlur={handleLinkBlur}
                  prefix={isFetchingData ? <RefreshCw className="animate-spin text-amber-500" size={16} /> : fetchError ? <AlertCircle className="text-red-500 animate-pulse" size={16} /> : <Wand2 size={16} className="text-amber-400" />}
                  disabled={isFetchingData}
                />
                <Input 
                  label="Vessel Designation" 
                  placeholder="e.g. Bavaria 46 'Cataleya'"
                  value={formData.name} 
                  onChange={(v) => setFormData({...formData, name: v})} 
                  disabled={isFetchingData}
                />
             </div>
          </div>

          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Technical Specs URL" placeholder="https://..." value={formData.detailsLink} onChange={(v) => setFormData({...formData, detailsLink: v})} prefix={<LinkIcon size={16} />} />
                <Input label="Image Source" placeholder="http://..." value={formData.imageUrl} onChange={(v) => setFormData({...formData, imageUrl: v})} prefix={<ImageIcon size={16} />} />
             </div>
          </div>

          <div className="bg-slate-950/50 p-6 rounded-2xl border border-amber-500/20 relative">
             <div className="absolute -top-3 left-4 bg-slate-900 px-2 text-xs font-bold text-amber-500 font-orbitron border border-amber-500/50 rounded">FINANCIALS (EUR)</div>
             <div className="grid grid-cols-3 gap-6">
               <Input label="Base Price" type="number" prefix="€" placeholder="0" value={formData.price} onChange={(v) => setFormData({...formData, price: v})} />
               <Input label="Logs / Pack" type="number" prefix="€" placeholder="0" value={formData.charterPack} onChange={(v) => setFormData({...formData, charterPack: v})} />
               <Input label="Extras" type="number" prefix="€" placeholder="0" value={formData.extras} onChange={(v) => setFormData({...formData, extras: v})} />
             </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Abort</Button>
            <Button variant="primary" onClick={handleSaveYacht} icon={Save} disabled={isFetchingData}>{editingId ? "Update Specs" : "Launch Vessel"}</Button>
          </div>
        </div>
      </Modal>

      {/* Auth Modal */}
      <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} title="Captain Authentication" size="sm">
        <form onSubmit={handleLogin} className="space-y-8 mt-4">
          {authError && <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center font-orbitron animate-pulse">{authError}</div>}
          <div className="space-y-6">
            <Input label="Command ID" type="email" placeholder="captain@deck.com" value={authEmail} onChange={setAuthEmail} prefix={<User size={16} />} />
            <Input label="Access Code" type="password" placeholder="••••••••" value={authPassword} onChange={setAuthPassword} prefix={<Lock size={16} />} />
          </div>
          <div className="pt-2"><Button variant="primary" className="w-full py-4 text-lg shadow-[0_0_30px_rgba(245,158,11,0.3)]" onClick={handleLogin}>Initialize</Button></div>
        </form>
      </Modal>
    </div>
  );
}