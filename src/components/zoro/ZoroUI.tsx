import React from 'react';
import { LucideIcon } from 'lucide-react';

// Three Blade Signature Line Accent (Section 27)
export const ThreeBladeLines: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-1 ${className}`}>
    <span className="w-1.5 h-3.5 bg-zoro-emerald -skew-x-12 rounded-sm shadow-[0_0_8px_#00FF9C]" />
    <span className="w-1.5 h-4.5 bg-zoro-cyan -skew-x-12 rounded-sm shadow-[0_0_8px_#00D9FF]" />
    <span className="w-1.5 h-3.5 bg-zoro-gold -skew-x-12 rounded-sm shadow-[0_0_8px_#FFB000]" />
  </div>
);

// Reusable ZoroCard Container
export const ZoroCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}> = ({ children, className = '', onClick, hoverable = false }) => (
  <div
    onClick={onClick}
    className={`rounded-xl border border-zoro-border bg-zoro-panel p-4 transition-all duration-200 ${
      hoverable
        ? 'hover:border-zoro-emerald/40 hover:bg-zoro-panelElevated cursor-pointer hover:shadow-[0_0_15px_rgba(0,255,156,0.06)]'
        : ''
    } ${className}`}
  >
    {children}
  </div>
);

// Reusable ZoroStatus Pill / Indicator
export const ZoroStatus: React.FC<{
  status: 'ONLINE' | 'READY' | 'STANDBY' | 'WARNING' | 'OFFLINE' | 'ACTIVE' | 'CONNECTED';
  label?: string;
  className?: string;
}> = ({ status, label, className = '' }) => {
  const getStyles = () => {
    switch (status) {
      case 'ONLINE':
      case 'ACTIVE':
      case 'CONNECTED':
        return {
          dot: 'bg-zoro-emerald shadow-[0_0_6px_#00FF9C]',
          text: 'text-zoro-emerald',
          border: 'border-zoro-emerald/30 bg-zoro-emerald/10',
        };
      case 'READY':
        return {
          dot: 'bg-zoro-cyan shadow-[0_0_6px_#00D9FF]',
          text: 'text-zoro-cyan',
          border: 'border-zoro-cyan/30 bg-zoro-cyan/10',
        };
      case 'STANDBY':
        return {
          dot: 'bg-zoro-gold shadow-[0_0_6px_#FFB000]',
          text: 'text-zoro-gold',
          border: 'border-zoro-gold/30 bg-zoro-gold/10',
        };
      case 'WARNING':
        return {
          dot: 'bg-zoro-gold shadow-[0_0_6px_#FFB000]',
          text: 'text-zoro-gold',
          border: 'border-zoro-gold/30 bg-zoro-gold/10',
        };
      case 'OFFLINE':
      default:
        return {
          dot: 'bg-zoro-textMuted',
          text: 'text-zoro-textMuted',
          border: 'border-zoro-border bg-zoro-panelElevated',
        };
    }
  };

  const style = getStyles();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono tracking-wider ${style.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span className={style.text}>{label || status}</span>
    </div>
  );
};

// Reusable ZoroBadge
export const ZoroBadge: React.FC<{
  children: React.ReactNode;
  variant?: 'emerald' | 'cyan' | 'gold' | 'danger' | 'muted';
  className?: string;
}> = ({ children, variant = 'emerald', className = '' }) => {
  const variantStyles = {
    emerald: 'bg-zoro-emerald/10 text-zoro-emerald border-zoro-emerald/25',
    cyan: 'bg-zoro-cyan/10 text-zoro-cyan border-zoro-cyan/25',
    gold: 'bg-zoro-gold/10 text-zoro-gold border-zoro-gold/25',
    danger: 'bg-zoro-danger/10 text-zoro-danger border-zoro-danger/25',
    muted: 'bg-zoro-panelElevated text-zoro-textSecondary border-zoro-border',
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-mono border font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// Reusable ZoroButton
export const ZoroButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  size?: 'sm' | 'md' | 'lg';
}> = ({
  children,
  onClick,
  variant = 'primary',
  icon: Icon,
  disabled = false,
  className = '',
  type = 'button',
  size = 'md',
}) => {
  const base =
    'inline-flex items-center justify-center font-mono font-semibold rounded-lg transition-all duration-200 select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-xs gap-2',
    lg: 'px-4 py-2.5 text-sm gap-2',
  };

  const variants = {
    primary:
      'bg-zoro-emerald text-black border border-zoro-emerald hover:bg-zoro-emeraldDark shadow-[0_0_15px_rgba(0,255,156,0.25)]',
    secondary:
      'bg-zoro-cyan/15 text-zoro-cyan border border-zoro-cyan/40 hover:bg-zoro-cyan/25',
    outline:
      'bg-zoro-panel border border-zoro-border text-zoro-text hover:border-zoro-emerald/50 hover:bg-zoro-panelElevated',
    danger:
      'bg-zoro-danger/15 text-zoro-danger border border-zoro-danger/40 hover:bg-zoro-danger/25',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizeClasses[size]} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </button>
  );
};
