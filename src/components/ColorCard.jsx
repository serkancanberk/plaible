import React from 'react';

/**
 * ColorCard
 * Displays a color swatch and metadata for a Tailwind token.
 * Props:
 * - label: string (human-friendly label)
 * - token: string (e.g., "text-text-primary" or "bg-accent")
 * - hex: string (e.g., "#192233")
 */

// Mapping for text color tokens to their corresponding background colors
const TEXT_COLOR_MAP = {
  "text-text-primary": "bg-[#192233]",
  "text-text-secondary": "bg-[#6E7794]",
  "text-text-tertiary": "bg-[#F4F0EC]",
  "text-accent": "bg-[#FFCC00]",
  "text-success": "bg-[#D3FF34]",
  "text-alert": "bg-[#D23001]"
};

export default function ColorCard({ label, token, hex }) {
  const isBackgroundToken = token.startsWith('bg-');
  const isTextToken = token.startsWith('text-');

  // Determine the swatch class based on token type
  const getSwatchClass = () => {
    if (isBackgroundToken) {
      return token; // Use bg-* class directly for background tokens
    }
    if (isTextToken) {
      return TEXT_COLOR_MAP[token] || 'bg-gray-200'; // Map text tokens to background colors
    }
    return 'bg-gray-200'; // Fallback
  };

  const swatchClass = getSwatchClass();

  return (
    <div className="flex items-center space-x-3 p-4 rounded-card border border-ui-muted">
      {/* Color swatch */}
      <div className={`h-8 w-8 rounded-md ${swatchClass}`} />

      {/* Labels */}
      <div>
        <div className="text-body font-medium">{token}</div>
        <div className="text-caption text-text-secondary">
          {label}<br />{hex}
        </div>
      </div>
    </div>
  );
}


