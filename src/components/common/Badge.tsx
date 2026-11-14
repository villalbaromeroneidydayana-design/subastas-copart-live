import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-blue-900/60 text-blue-300 border-blue-700/50',
    success: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60',
    warning: 'bg-amber-950/80 text-amber-300 border-amber-600/60',
    danger: 'bg-rose-950/80 text-rose-300 border-rose-600/60',
    info: 'bg-cyan-950/80 text-cyan-300 border-cyan-600/60',
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 tracking-wider font-semibold uppercase',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border shadow-sm ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

