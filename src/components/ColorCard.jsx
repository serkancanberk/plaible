import React from 'react';

/**
 * ColorCard
 * Displays a color swatch and metadata for a Tailwind token.
 * Props:
 * - label: string (human-friendly label)
 * - token: string (e.g., "text-text-primary" or "bg-accent")
 * - hex: string (e.g., "#192233")
 */
export default function ColorCard({ label, token, hex }) {
  const swatchClass =
    typeof token === 'string' && token.startsWith('text-')
      ? token.replace(/^text-/, 'bg-')
      : token;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4">
      <div className={`w-16 aspect-square rounded-lg ${swatchClass}`} />
      <div className="flex flex-col gap-y-1">
        <div className="text-subheading font-sans font-semibold text-text-primary">{token}</div>
        <div className="text-body font-sans text-text-secondary">{label}</div>
        <div className="text-label font-mono text-text-secondary">{hex}</div>
      </div>
    </div>
  );
}


