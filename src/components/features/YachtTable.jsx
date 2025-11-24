import React from 'react';
import { 
  Image as ImageIcon, 
  DollarSign, 
  Users, 
  Ship, 
  Check, 
  Anchor, 
  ExternalLink, 
  Edit2, 
  Trash2 
} from 'lucide-react';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';

export default function YachtTable({ 
  yachts, 
  pax, 
  tripData, 
  isCaptain, 
  eurToCzk, 
  handleSelectYacht, 
  openEdit, 
  handleDelete, 
  openNew 
}) {
  return (
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
            {yachts.length === 0 ? (
               <tr>
                 <td colSpan="11" className="px-6 py-20 text-center text-slate-500">
                   <Ship className="mx-auto h-16 w-16 text-slate-700 mb-4 animate-pulse" />
                   <p className="text-lg font-medium text-slate-400">No proposals created yet.</p>
                   {isCaptain && <Button variant="secondary" onClick={openNew} className="mt-4">Start a New Proposal</Button>}
                 </td>
               </tr>
            ) : (
              yachts.map((yacht) => {
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
  );
}
