import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Trash2, DollarSign, User, Calendar, Wallet } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import GlassCard from '../ui/GlassCard';

export default function PaymentManager({ tripId, isCaptain, exchangeRate }) {
  const [payments, setPayments] = useState([]);
  const [newPayment, setNewPayment] = useState({
    guestName: '',
    amount: '',
    currency: 'EUR',
    type: 'deposit' // deposit, final, other
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    const q = query(
      collection(db, 'artifacts', appId, 'trips', tripId, 'payments'),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [tripId]);

  const handleAddPayment = async () => {
    if (!newPayment.guestName || !newPayment.amount) return;
    
    try {
      await addDoc(collection(db, 'artifacts', appId, 'trips', tripId, 'payments'), {
        ...newPayment,
        amount: parseFloat(newPayment.amount),
        date: serverTimestamp()
      });
      setNewPayment({ guestName: '', amount: '', currency: 'EUR', type: 'deposit' });
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding payment:", error);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!confirm("Delete this payment record?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'trips', tripId, 'payments', id));
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  const totalPaidEur = payments.reduce((acc, p) => {
    if (p.currency === 'EUR') return acc + p.amount;
    return acc + (p.amount / exchangeRate);
  }, 0);

  if (!isCaptain && payments.length === 0) return null;

  return (
    <GlassCard className="p-6 border-amber-500/20 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-black text-white flex items-center gap-3">
          <Wallet className="text-amber-500" />
          Payment Tracker
        </h3>
        {isCaptain && (
          <Button variant="primary" icon={Plus} onClick={() => setIsAdding(!isAdding)}>
            Record Payment
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
          <div className="text-xs text-emerald-400 uppercase font-bold tracking-wider mb-1">Total Collected (Est.)</div>
          <div className="text-2xl font-black text-white">{formatCurrency(totalPaidEur)}</div>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10 mb-6 animate-in fade-in slide-in-from-top-4">
          <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest mb-4">New Payment Record</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input 
              placeholder="Guest Name" 
              value={newPayment.guestName}
              onChange={(v) => setNewPayment({...newPayment, guestName: v})}
              prefix={<User size={14} />}
            />
            <Input 
              type="number"
              placeholder="Amount" 
              value={newPayment.amount}
              onChange={(v) => setNewPayment({...newPayment, amount: v})}
              prefix={<DollarSign size={14} />}
            />
            <div className="space-y-1.5">
               <select 
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50"
                  value={newPayment.currency}
                  onChange={(e) => setNewPayment({...newPayment, currency: e.target.value})}
               >
                  <option value="EUR">EUR (€)</option>
                  <option value="CZK">CZK (Kč)</option>
               </select>
            </div>
            <div className="space-y-1.5">
               <select 
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50"
                  value={newPayment.type}
                  onChange={(e) => setNewPayment({...newPayment, type: e.target.value})}
               >
                  <option value="deposit">Deposit</option>
                  <option value="final">Final Payment</option>
                  <option value="other">Other</option>
               </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddPayment}>Save Record</Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400 font-bold uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Date</th>
              {isCaptain && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {payments.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-slate-500 italic">No payments recorded yet.</td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{p.guestName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      p.type === 'deposit' ? 'bg-blue-500/20 text-blue-300' :
                      p.type === 'final' ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-slate-500/20 text-slate-300'
                    }`}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-300">
                    {p.amount.toLocaleString()} {p.currency}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 text-xs">
                    {p.date?.toDate().toLocaleDateString()}
                  </td>
                  {isCaptain && (
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleDeletePayment(p.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
