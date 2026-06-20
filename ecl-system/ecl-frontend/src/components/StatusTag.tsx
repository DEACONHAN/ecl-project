import React from 'react';
import './StatusTag.css';

interface StatusTagProps {
  status: 'DRAFT' | 'PUBLISHED' | 'EFFECTIVE' | 'EXPIRED';
  children?: React.ReactNode;
}

const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  EFFECTIVE: '已生效',
  EXPIRED: '已失效',
};

const StatusTag: React.FC<StatusTagProps> = ({ status, children }) => (
  <span className={`status-tag st-${status.toLowerCase()}`}>
    {children || statusLabels[status] || status}
  </span>
);

export default StatusTag;
