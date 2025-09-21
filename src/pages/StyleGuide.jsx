import React from 'react';
import PlaibleLogo from '../components/PlaibleLogo';

// Strict token lists (only configured/used tokens)
const textTokenStyles = {
  'text-hero': 'text-hero font-serif text-text-tertiary',
  'text-heading': 'text-heading font-sans text-text-tertiary',
  'text-subheading': 'text-subheading font-sans text-text-tertiary',
  'text-body': 'text-body font-sans text-text-tertiary',
  'text-label': 'text-label font-sans text-text-tertiary',
  'text-caption': 'text-caption font-sans text-text-tertiary',
};

const TEXT_COLORS = [
  { label: 'text-text-primary', textClass: 'text-text-primary', swatchClass: 'bg-text-primary', hex: '#595E6F' },
  { label: 'text-text-secondary', textClass: 'text-text-secondary', swatchClass: 'bg-text-secondary', hex: '#6E7794' },
  { label: 'text-text-tertiary', textClass: 'text-text-tertiary', swatchClass: 'bg-text-tertiary', hex: '#F4F0EC' },
  { label: 'text-accent', textClass: 'text-accent', swatchClass: 'bg-accent', hex: '#FFCC00' },
  { label: 'text-secondary', textClass: 'text-secondary', swatchClass: 'bg-secondary', hex: '#141416' },
  { label: 'text-success', textClass: 'text-success', swatchClass: 'bg-success', hex: '#D3FF34' },
  { label: 'text-alert', textClass: 'text-alert', swatchClass: 'bg-alert', hex: '#D23001' },
];

const BG_COLORS = [
  { label: 'bg-primary', className: 'bg-primary', hex: '#192233' },
  { label: 'bg-secondary', className: 'bg-secondary', hex: '#141416' },
  { label: 'bg-accent', className: 'bg-accent', hex: '#FFCC00' },
];

export default function StyleGuide() {
  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-8 space-y-10">
      <section className="space-y-3">
        <div className="text-body">Text Styles</div>
        <div className="space-y-2">
          {Object.entries(textTokenStyles).map(([token, className]) => (
            <div key={token} className={className}>
              {`This is ${token}`}
            </div>
          ))}
        </div>
      </section>

      <section className="my-12">
        <h2 className="text-heading mb-4">Plaible Logo Variants</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center"><PlaibleLogo variant="original" size="md" /></div>
          <div className="flex items-center"><PlaibleLogo variant="light" size="md" /></div>
          <div className="flex items-center"><PlaibleLogo variant="ai-original" size="md" /></div>
          <div className="flex items-center"><PlaibleLogo variant="ai-light" size="md" /></div>
        </div>
      </section>

      <section className="my-12">
        <h2 className="text-heading mb-4">Plaible Logo Sizes (sm / md / lg)</h2>
        <div className="flex flex-col gap-4">
          <PlaibleLogo size="sm" />
          <PlaibleLogo size="md" />
          <PlaibleLogo size="lg" accent />
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-body">Text Colors</div>
        <div className="space-y-2">
          {TEXT_COLORS.map((c) => (
            <div key={c.label} className="flex items-center justify-between gap-4">
              <div className={c.textClass}>{`${c.label} → ${c.hex}`}</div>
              <div className={`w-8 h-8 ${c.swatchClass}`} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-body">Background Colors</div>
        <div className="space-y-2">
          {BG_COLORS.map((c) => (
            <div key={c.label} className="flex items-center justify-between gap-4">
              <div className="text-body">{`${c.label} → ${c.hex}`}</div>
              <div className={`w-8 h-8 ${c.className}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


