import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  icon?: ReactNode;
  accent?: 'blue' | 'gold' | 'green' | 'purple' | 'rose';
  trend?: string;
  trendUp?: boolean;
  delay?: number;
}

const accentMap = {
  blue: {
    borderColor: '#1a7ff5',
    iconBg: 'linear-gradient(135deg, #33a1ff 0%, #1468e1 100%)',
    chipBg: '#eff6ff',
    chipColor: '#1468e1',
  },
  gold: {
    borderColor: '#d4a853',
    iconBg: 'linear-gradient(135deg, #e8c468 0%, #b8892e 100%)',
    chipBg: '#fffbeb',
    chipColor: '#b8892e',
  },
  green: {
    borderColor: '#10b981',
    iconBg: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
    chipBg: '#ecfdf5',
    chipColor: '#059669',
  },
  purple: {
    borderColor: '#8b5cf6',
    iconBg: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
    chipBg: '#f5f3ff',
    chipColor: '#7c3aed',
  },
  rose: {
    borderColor: '#f43f5e',
    iconBg: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
    chipBg: '#fff1f2',
    chipColor: '#e11d48',
  },
};

export default function StatCard({
  title,
  value,
  suffix,
  icon,
  accent = 'blue',
  trend,
  trendUp = true,
  delay = 0,
}: StatCardProps) {
  const colors = accentMap[accent];
  return (
    <div
      className="kpi-card border-l-4 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, opacity: 0, borderLeftColor: colors.borderColor }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">{title}</p>
          <p className="text-[2rem] font-extrabold text-slate-900 m-0 leading-none tracking-tight">
            {value}
            {suffix && <span className="text-base font-semibold text-slate-400 ml-1.5">{suffix}</span>}
          </p>
          {trend && (
            <span
              className="inline-flex items-center mt-3 px-2 py-0.5 rounded-md text-xs font-semibold"
              style={{ background: colors.chipBg, color: colors.chipColor }}
            >
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>
        {icon && (
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: colors.iconBg, color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
