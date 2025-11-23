import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { 
  Plus, 
  Calendar, 
  Ship, 
  ArrowRight, 
  Trash2, 
  LogOut,
  Map
} from 'lucide-react';
import { auth, db, appId } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'artifacts', appId, 'trips'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedTrips = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTrips(loadedTrips);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateTrip = async () => {
    if (!newTripName.trim()) return;
    
    try {
      const tripData = {
        name: newTripName,
        createdAt: serverTimestamp(),
        status: 'planning',
        captainId: user.uid
      };
      
      if (startDate) tripData.startDate = new Date(startDate);
      if (endDate) tripData.endDate = new Date(endDate);
      
      const docRef = await addDoc(collection(db, 'artifacts', appId, 'trips'), tripData);
      setNewTripName('');
      setStartDate('');
      setEndDate('');
      setIsModalOpen(false);
      navigate(`/trip/${docRef.id}`);
    } catch (error) {
      console.error("Error creating trip:", error);
    }
  };

  const handleDeleteTrip = async (e, tripId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this trip? This cannot be undone.")) return;
    
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'trips', tripId));
    } catch (error) {
      console.error("Error deleting trip:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-[#0f172a] to-black text-slate-200 font-sans p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-widest text-white uppercase">
              Captain's<span className="text-amber-500">Deck</span>
            </h1>
            <p className="text-xs font-bold text-amber-500/70 tracking-[0.2em] uppercase mt-1">Mission Control</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-white">{user?.email || 'Captain'}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Logged In</div>
             </div>
             <Button variant="secondary" onClick={handleLogout} icon={LogOut}>Logout</Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
           <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>New Trip</Button>
        </div>

        {/* Trip Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             <div className="col-span-full flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
             </div>
          ) : trips.length === 0 ? (
             <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                <Map className="mx-auto h-16 w-16 text-slate-700 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Voyages Planned</h3>
                <p className="text-slate-500 mb-6">Chart a new course to get started.</p>
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>Create First Trip</Button>
             </div>
          ) : (
            trips.map(trip => (
              <div 
                key={trip.id}
                onClick={() => navigate(`/trip/${trip.id}`)}
                className="group relative bg-slate-900/40 backdrop-blur-md border border-white/10 hover:border-amber-500/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 overflow-hidden"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleDeleteTrip(e, trip.id)}
                      className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                    >
                       <Trash2 size={16} />
                    </button>
                 </div>

                 <div className="mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform">
                       <Ship size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">{trip.name}</h3>
                    {trip.startDate && trip.endDate ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-bold">
                         <Calendar size={12} />
                         {trip.startDate.toDate().toLocaleDateString()} - {trip.endDate.toDate().toLocaleDateString()}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider font-bold">
                         <Calendar size={12} />
                         Created: {trip.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                      </div>
                    )}
                 </div>
                 
                 <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                       {trip.status || 'Planning'}
                    </span>
                    <ArrowRight className="text-amber-500 transform group-hover:translate-x-1 transition-transform" size={20} />
                 </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Chart New Voyage"
        size="sm"
      >
         <div className="space-y-6">
            <Input 
              label="Trip Name"
              placeholder="e.g. Summer 2025 - Croatia"
              value={newTripName}
              onChange={setNewTripName}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Start Date"
                type="date"
                value={startDate}
                onChange={setStartDate}
              />
              <Input 
                label="End Date"
                type="date"
                value={endDate}
                onChange={setEndDate}
              />
            </div>
            <div className="flex justify-end gap-3">
               <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
               <Button variant="primary" onClick={handleCreateTrip}>Create Trip</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
}
