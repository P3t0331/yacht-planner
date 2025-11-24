import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, CheckCircle } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';

export default function PaymentQrSection({ tripData, isCaptain, handleConfirmTrip, eurToCzk }) {
  const [qrCurrency, setQrCurrency] = useState('EUR'); // 'EUR' or 'CZK'

  if (!tripData?.selectedYachtId) return null;

  return (
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
  );
}
