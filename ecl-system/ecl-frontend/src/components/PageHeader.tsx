import React from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, extra }) => (
  <div className="page-header">
    <div className="page-header-left">
      <h1 className="page-header-title">{title}</h1>
      {subtitle && <div className="page-header-sub">{subtitle}</div>}
    </div>
    {extra && <div className="page-header-extra">{extra}</div>}
  </div>
);

export default PageHeader;
