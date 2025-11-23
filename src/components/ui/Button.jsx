import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = "", icon: Icon, disabled }) => {
  const baseStyles = "inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 border border-amber-400/20",
    secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/30 backdrop-blur-sm",
    danger: "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50",
    ghost: "text-slate-300 hover:text-white hover:bg-white/5",
    icon: "p-2 rounded-full bg-white/5 hover:bg-white/20 text-amber-400 hover:text-amber-200 transition-colors",
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} className={children ? "mr-2" : ""} />}
      {children}
    </button>
  );
};

export default Button;
