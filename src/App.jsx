import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './config/firebase';
import YachtManager from './YachtManager';
import Dashboard from './components/features/Dashboard';
import Modal from './components/ui/Modal';
import Input from './components/ui/Input';
import Button from './components/ui/Button';
import { Lock, User } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={user && !user.isAnonymous ? <Dashboard user={user} /> : <LoginPage />} />
        <Route path="/trip/:tripId" element={<YachtManager />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-[#0f172a] to-black flex items-center justify-center p-4">
       <div className="w-full max-w-md">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-8 shadow-2xl">
             <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-white uppercase tracking-widest">
                  Captain's<span className="text-amber-500">Deck</span>
                </h1>
                <p className="text-xs font-bold text-amber-500/60 tracking-[0.3em] uppercase mt-2">Restricted Access</p>
             </div>

             <form onSubmit={handleLogin} className="space-y-6">
                {error && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-xl text-center border border-red-500/20">{error}</div>}
                <Input 
                  label="Captain's Email" 
                  prefix={<User size={14}/>} 
                  value={email} 
                  onChange={setEmail} 
                  type="email"
                />
                <Input 
                  label="Password" 
                  prefix={<Lock size={14}/>} 
                  value={password} 
                  onChange={setPassword} 
                  type="password"
                />
                <Button variant="primary" className="w-full py-4 text-lg" onClick={handleLogin}>Enter Bridge</Button>
             </form>
          </div>
       </div>
    </div>
  );
}

export default App;