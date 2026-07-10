import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  badge?: string;
}

export default function PageHeader({ title, subtitle, icon, action, badge }: PageHeaderProps) {
  return (
    <div className="page-header animate-fade-in-up">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="page-header-icon">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-header-title">{title}</h1>
            {badge && <span className="page-header-badge">{badge}</span>}
          </div>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
