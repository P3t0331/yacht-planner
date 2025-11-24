import React, { useState, useEffect } from 'react';
import { Users, CreditCard, Save } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function TripSettingsModal({ 
  isOpen, 
  onClose, 
  tripData, 
  handleSaveSettings 
}) {
  const [tripSettings, setTripSettings] = useState({
    confirmedGuests: '',
    captainIbanEur: '',
    captainIbanCzk: '',
    depositAmount: '',
    finalPaymentAmount: ''
  });

  useEffect(() => {
    if (tripData) {
      setTripSettings({
         confirmedGuests: tripData.confirmedGuests || '',
         captainIbanEur: tripData.captainIbanEur || '',
         captainIbanCzk: tripData.captainIbanCzk || '',
         depositAmount: tripData.depositAmount || '',
         finalPaymentAmount: tripData.finalPaymentAmount || ''
      });
    }
  }, [tripData]);

  const onSave = () => {
      handleSaveSettings(tripSettings);
      onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
             <Button variant="secondary" onClick={onClose}>Cancel</Button>
             <Button variant="primary" onClick={onSave} icon={Save}>Save Settings</Button>
          </div>
       </div>
    </Modal>
  );
}
