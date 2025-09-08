// src/admin/components/FilterBarStories.tsx
import React from 'react';

interface Props {
  query: string;
  isActive: string; // '', 'true', 'false'
  onChange: (next: { query?: string; isActive?: string }) => void;
}

export const FilterBarStories: React.FC<Props> = ({ query, isActive, onChange }) => {
  return (
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
      <input
        type="text"
        placeholder="Search by title or slug…"
        className="border rounded px-3 py-2 w-full md:w-64"
        value={query}
        onChange={(e) => onChange({ query: e.target.value })}
      />
      <select
        className="border rounded px-3 py-2"
        value={isActive}
        onChange={(e) => onChange({ isActive: e.target.value })}
      >
        <option value="">All status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
    </div>
  );
};
