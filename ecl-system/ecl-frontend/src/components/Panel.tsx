import React from 'react';
import './Panel.css';

interface PanelProps {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
  className?: string;
}

const Panel: React.FC<PanelProps> = ({ title, extra, children, noPadding, className }) => (
  <div className={`panel ${className || ''}`}>
    {(title || extra) && (
      <div className="panel-header">
        {title && <h2 className="panel-title">{title}</h2>}
        {extra && <div className="panel-extra">{extra}</div>}
      </div>
    )}
    <div className={noPadding ? 'panel-body-nopad' : 'panel-body'}>{children}</div>
  </div>
);

export default Panel;
