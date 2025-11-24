import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Image as ImageIcon, 
  AlertCircle, 
  Wand2, 
  Link as LinkIcon, 
  DollarSign, 
  Save,
  Anchor,
  Users
} from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function YachtFormModal({ 
  isOpen, 
  onClose, 
  editingId, 
  initialData, 
  handleSaveYacht, 
  fetchAaayachtData, 
  isFetchingData, 
  fetchError 
}) {
  const [formData, setFormData] = useState({
    name: '',
    link: '',
    detailsLink: '',
    imageUrl: '',
    price: '',
    charterPack: '',
    extras: '',
    marina: '',
    maxGuests: ''
  });

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({ name: '', link: '', detailsLink: '', imageUrl: '', price: '', charterPack: '', extras: '', marina: '', maxGuests: '' });
        }
    }
  }, [isOpen, initialData]);

  const handleLinkBlur = (e) => {
    const url = e.target.value;
    if (!url) return;

    if (url.includes('aaayacht.cz')) {
        fetchAaayachtData(url, setFormData);
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

  const onSave = async () => {
      const success = await handleSaveYacht(formData, editingId);
      if (success) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Marina/Port" 
                  placeholder="e.g. Split, Croatia"
                  value={formData.marina} 
                  onChange={(v) => setFormData({...formData, marina: v})} 
                  prefix={<Anchor size={14} />}
                  disabled={isFetchingData}
                />
                <Input 
                  label="Max Guests" 
                  type="number"
                  placeholder="e.g. 8"
                  value={formData.maxGuests} 
                  onChange={(v) => setFormData({...formData, maxGuests: v})} 
                  prefix={<Users size={14} />}
                  disabled={isFetchingData}
                />
              </div>
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
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onSave} icon={Save} disabled={isFetchingData}>
            {editingId ? "Update Proposal" : "Add to Deck"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
