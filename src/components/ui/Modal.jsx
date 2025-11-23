import React from 'react';
import { Compass } from 'lucide-react';

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

export default Modal;
