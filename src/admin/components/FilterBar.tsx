// src/admin/components/FilterBar.tsx
import React from 'react';

type Props = {
  query: string;
  role: string;
  status: string;
  onChange: (next: { query?: string; role?: string; status?: string }) => void;
};

export const FilterBar: React.FC<Props> = ({ query, role, status, onChange }) => {
  return (
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
      <input
        type="text"
        placeholder="Search by email or display name…"
        className="border rounded px-3 py-2 w-full md:w-64"
        value={query}
        onChange={(e) => onChange({ query: e.target.value })}
      />
      <select
        className="border rounded px-3 py-2"
        value={role}
        onChange={(e) => onChange({ role: e.target.value })}
      >
        <option value="">All roles</option>
        <option value="admin">admin</option>
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
        <option value="deleted">deleted</option>
      </select>
    </div>
  );
};
