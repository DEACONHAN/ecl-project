import React from 'react';
import './GroupSelector.css';

interface GroupItem {
  groupId: string;
  groupName: string;
  groupCode?: string;
  count?: number;
}

interface GroupSelectorProps {
  groups: GroupItem[];
  selectedId?: string;
  onChange: (groupId: string) => void;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({ groups, selectedId, onChange }) => (
  <div className="group-selector">
    {groups.map((g) => (
      <button
        key={g.groupId}
        className={`group-chip ${selectedId === g.groupId ? 'active' : ''}`}
        onClick={() => onChange(g.groupId)}
      >
        {g.groupName}
        {g.count !== undefined && <span className="chip-count">{g.count}</span>}
      </button>
    ))}
  </div>
);

export default GroupSelector;
