import type { ReactNode } from 'react';

interface ContentPanelProps {
  title?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function ContentPanel({
  title,
  subtitle,
  action,
  children,
  className = '',
  noPadding = false,
}: ContentPanelProps) {
  return (
    <div className={`content-panel ${className}`}>
      {(title || action) && (
        <div className="content-panel-header">
          <div>
            {title && <h3 className="content-panel-title">{title}</h3>}
            {subtitle && <p className="content-panel-subtitle">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'content-panel-body'}>{children}</div>
    </div>
  );
}
