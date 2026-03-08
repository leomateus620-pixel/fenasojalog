import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
  to?: string;
}

const iconBg = {
  default: 'bg-muted/60',
  primary: 'bg-primary/12',
  accent: 'bg-accent/12',
  success: 'bg-success/12',
  warning: 'bg-warning/12',
};

const iconColor = {
  default: 'text-muted-foreground',
  primary: 'text-primary',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
};

export default function StatCard({ label, value, icon, trend, variant = 'default', to }: StatCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'liquid-glass-card rounded-2xl p-4 transition-all',
        to && 'cursor-pointer active:scale-[0.97]',
      )}
      onClick={to ? () => navigate(to) : undefined}
      tabIndex={to ? 0 : undefined}
      role={to ? 'link' : undefined}
      aria-label={to ? `${label}: ${value}` : undefined}
      onKeyDown={(e) => { if (to && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); navigate(to); } }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {trend && <p className="mt-0.5 text-[10px] text-muted-foreground">{trend}</p>}
        </div>
        <div className={cn('rounded-xl p-2', iconBg[variant])}>
          <div className={iconColor[variant]}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
