import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false, ...props }: ButtonProps) => {
  const baseStyle = "px-5 py-3.5 rounded-full font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[#86E2B5] text-teal-950 hover:bg-[#75D1A4] shadow-sm transform hover:-translate-y-0.5",
    secondary: "bg-[#DCE4FF] text-blue-900 hover:bg-[#C8D4FF] shadow-sm",
    danger: "bg-[#FF8FA3] text-white hover:bg-[#FF7A92] shadow-sm",
    outline: "bg-transparent border-2 border-[#D5CAFA] text-slate-700 hover:bg-[#EFE9FB] shadow-sm",
    ghost: "bg-transparent text-slate-600 hover:bg-[#EFE9FB]"
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};