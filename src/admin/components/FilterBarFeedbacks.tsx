// src/admin/components/FilterBarFeedbacks.tsx
import React, { useState } from 'react';

interface Props {
  storyId: string;
  status: string;
  starsGte: string; // '', '1'..'5'
  onChange: (next: { storyId?: string; status?: string; starsGte?: string }) => void;
}

export const FilterBarFeedbacks: React.FC<Props> = ({ storyId, status, starsGte, onChange }) => {
  const [storyIdInput, setStoryIdInput] = useState(storyId);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onChange({ storyId: storyIdInput });
    }
  };

  return (
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
      <input
        type="text"
        placeholder="Story ID… (Press Enter)"
        className="border rounded px-3 py-2 w-full md:w-48"
        value={storyIdInput}
        onChange={(e) => setStoryIdInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <select
        className="border rounded px-3 py-2"
        value={status}
        onChange={(e) => onChange({ status: e.target.value })}
      >
        <option value="">All status</option>
        <option value="visible">visible</option>
        <option value="hidden">hidden</option>
        <option value="flagged">flagged</option>
        <option value="deleted">deleted</option>
      </select>
      <input
        type="number"
        placeholder="Min stars"
        min="1"
        max="5"
        className="border rounded px-3 py-2 w-full md:w-32"
        value={starsGte}
        onChange={(e) => onChange({ starsGte: e.target.value })}
      />
    </div>
  );
};
