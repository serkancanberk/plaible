// src/admin/components/FilterBar.tsx
import React, { useState } from 'react';

type Props = {
  query: string;
  role: string;
  status: string;
  searchField: string;
  onChange: (next: { query?: string; role?: string; status?: string; searchField?: string }) => void;
};

export const FilterBar: React.FC<Props> = ({ query, role, status, searchField, onChange }) => {
  const [searchInput, setSearchInput] = useState(query);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onChange({ query: searchInput });
    }
  };

  return (
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
      <select
        className="border rounded px-3 py-2"
        value={searchField}
        onChange={(e) => onChange({ searchField: e.target.value })}
      >
        <option value="">All</option>
        <option value="email">Email</option>
        <option value="displayName">Display Name</option>
      </select>
      <input
        type="text"
        placeholder={`Search by ${searchField || 'email or display name'}… (Press Enter)`}
        className="border rounded px-3 py-2 w-full md:w-64"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <select
        className="border rounded px-3 py-2"
        value={role}
        onChange={(e) => onChange({ role: e.target.value })}
      >
        <option value="">All roles</option>
        <option value="admin">admin</option>
        <option value="moderator">moderator</option>
        <option value="user">user</option>
      </select>
      <select
        className="border rounded px-3 py-2"
        value={status}
        onChange={(e) => onChange({ status: e.target.value })}
      >
        <option value="">All status</option>
        <option value="active">active</option>
        <option value="disabled">disabled</option>
      </select>
    </div>
  );
};
