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
  Trash2,
  MapPin,
  AlertTriangle
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
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
               {/* Image Column Header */}
               <th className="sticky left-0 z-20 bg-slate-900/95 backdrop-blur px-2 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-r border-white/10 text-center">
                <ImageIcon size={12} className="mx-auto"/>
              </th>

              <th className="px-3 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Vessel
              </th>
              <th className="px-2 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                <span className="flex items-center gap-0.5"><MapPin size={10}/>Marina</span>
              </th>
              <th className="px-2 py-3 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <Users size={10} className="mx-auto"/>
              </th>
              {/* Hide individual prices on mobile, show on lg+ */}
              <th className="px-2 py-3 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Price</th>
              <th className="px-2 py-3 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Pack</th>
              <th className="px-2 py-3 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Extras</th>
              <th className="px-2 py-3 text-right text-[10px] font-extrabold text-amber-500 uppercase tracking-wider bg-amber-500/5">
                 <span className="flex items-center justify-end gap-0.5"><DollarSign size={10}/>Total</span>
              </th>
              
              <th className="px-2 py-3 text-center bg-blue-500/5 border-l border-white/5">
                   <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center justify-center gap-0.5">
                       <Users size={10}/>/Guest
                   </span>
              </th>

              {/* Hide Actions column for Guests */}
              {isCaptain && <th className="px-3 py-3 text-right bg-slate-900/30"><span className="sr-only">Actions</span></th>}
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
                const isOverCapacity = yacht.maxGuests > 0 && pax > yacht.maxGuests;
                
                return (
                  <tr 
                    key={yacht.id} 
                    className={`group transition-colors ${
                      isSelected ? 'bg-amber-500/10 hover:bg-amber-500/20' : 
                      isOverCapacity ? 'bg-red-500/5 hover:bg-red-500/10 border-l-4 border-red-500/50' :
                      'hover:bg-white/[0.02]'
                    }`}
                  >
                    
                    {/* Clickable Image Column */}
                    <td className={`sticky left-0 z-10 border-r border-white/5 px-2 py-2 text-center ${
                      isSelected ? 'bg-slate-900/95 shadow-[4px_0_24px_-4px_rgba(245,158,11,0.2)]' : 
                      isOverCapacity ? 'bg-slate-900/95 shadow-[4px_0_12px_-4px_rgba(239,68,68,0.3)]' :
                      'bg-slate-900/95'
                    }`}>
                       <div className={`relative h-12 w-20 rounded-lg bg-slate-800 border mx-auto transition-all duration-300 overflow-hidden ${
                         isSelected ? 'border-amber-500 ring-2 ring-amber-500/20' : 
                         isOverCapacity ? 'border-red-500/50 ring-2 ring-red-500/20' :
                         'border-white/10 group-hover:border-amber-500/50'
                       }`}>
                         {isSelected && (
                            <div className="absolute top-1 right-1 z-20 bg-amber-500 text-slate-900 rounded-full p-0.5 shadow-lg">
                               <Check size={10} strokeWidth={4} />
                            </div>
                         )}
                         {isOverCapacity && (
                            <div className="absolute top-1 left-1 z-20 bg-red-500 text-white rounded-full p-0.5 shadow-lg">
                               <AlertTriangle size={10} strokeWidth={3} />
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
                            <Anchor size={20} />
                         </div>
                       </div>
                    </td>

                    {/* Info Column */}
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <div className="font-bold text-white text-sm truncate tracking-tight flex items-center gap-1">
                          {yacht.link ? (
                            <a href={yacht.link} target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1 truncate">
                              <span className="truncate">{yacht.name}</span>
                              <ExternalLink size={8} className="opacity-50 flex-shrink-0" />
                            </a>
                          ) : <span className="truncate">{yacht.name}</span>}
                        </div>
                        {yacht.detailsLink && (
                          <a href={yacht.detailsLink} target="_blank" rel="noreferrer" className="text-[10px] font-mono text-slate-500 hover:text-amber-300 transition-colors mt-0.5 flex items-center gap-1 hidden lg:flex">
                            Tech Specs
                          </a>
                        )}
                        {/* Show marina on mobile (when hidden in its own column) */}
                        {yacht.marina && (
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 lg:hidden">
                            <MapPin size={8} className="flex-shrink-0" />
                            <span className="truncate">{yacht.marina}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Marina - Hidden on mobile, shown on lg+ */}
                    <td className="px-2 py-2 text-slate-300 text-xs hidden lg:table-cell">
                      <span className="truncate block max-w-[120px]">{yacht.marina || <span className="text-slate-600 italic">—</span>}</span>
                    </td>
                    
                    {/* Max Guests */}
                    <td className="px-2 py-2 text-center">
                      {yacht.maxGuests ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-semibold text-[10px] ${
                            isOverCapacity 
                              ? 'bg-red-500/20 border border-red-500/50 text-red-300' 
                              : 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          }`}>
                            <Users size={10} />
                            {yacht.maxGuests}
                          </div>
                          {isOverCapacity && (
                            <span className="text-[9px] text-red-400 font-medium flex items-center gap-0.5">
                              <AlertTriangle size={8} />
                              Over
                            </span>
                          )}
                        </div>
                      ) : <span className="text-slate-600 italic text-xs">—</span>}
                    </td>
                    
                    {/* Individual prices - hidden until xl */}
                    <td className="px-2 py-2 text-slate-400 text-right font-mono text-xs group-hover:text-slate-200 transition-colors hidden xl:table-cell">{formatCurrency(yacht.price)}</td>
                    <td className="px-2 py-2 text-slate-400 text-right font-mono text-xs group-hover:text-slate-200 transition-colors hidden xl:table-cell">{formatCurrency(yacht.charterPack)}</td>
                    <td className="px-2 py-2 text-slate-400 text-right font-mono text-xs group-hover:text-slate-200 transition-colors hidden xl:table-cell">{formatCurrency(yacht.extras)}</td>
                    
                    {/* Total EUR */}
                    <td className="px-2 py-2 text-right bg-amber-500/[0.05]">
                        <div className="font-mono font-bold text-amber-400 text-sm shadow-amber-500/50 drop-shadow-sm">
                            {formatCurrency(totalEur)}
                        </div>
                    </td>

                    {/* Split Dynamic */}
                    <td className="px-2 py-2 bg-blue-500/[0.02] border-l border-white/5">
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="text-[9px] text-slate-400 font-mono hidden lg:block">{formatCurrency(perPersonEur)}</div>
                            <div className="text-sm font-black text-white font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/10 shadow-inner">
                                {formatCurrency(perPersonCzk, 'CZK')}
                            </div>
                        </div>
                    </td>

                    {/* Actions (Protected) */}
                    {isCaptain && (
                      <td className="px-2 py-2 text-right">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <div className="relative group/tooltip">
                            <Button 
                              variant={isSelected ? "primary" : "secondary"} 
                              className={`text-xs px-2 py-1 ${isSelected ? "bg-amber-500 text-white" : ""} ${isOverCapacity && !isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
                              onClick={() => !isOverCapacity && handleSelectYacht(yacht.id)}
                              disabled={isOverCapacity && !isSelected}
                            >
                               {isSelected ? "✓" : "Select"}
                            </Button>
                            {isOverCapacity && !isSelected && (
                              <div className="absolute bottom-full right-0 mb-2 px-2 py-1.5 bg-red-900/90 text-red-100 text-[10px] rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-red-500/30">
                                <div className="flex items-center gap-1">
                                  <AlertTriangle size={10} />
                                  <span>Over capacity ({yacht.maxGuests})</span>
                                </div>
                                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-900/90"></div>
                              </div>
                            )}
                          </div>
                          <Button variant="icon" onClick={() => openEdit(yacht)} className="p-1">
                              <Edit2 size={12} />
                          </Button>
                          <button 
                              onClick={() => handleDelete(yacht.id)}
                              className="p-1 rounded-full bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                          >
                              <Trash2 size={12} />
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
