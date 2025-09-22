import React from 'react';
import PlaibleLogo from '../components/PlaibleLogo';
import C2AButton from '../components/C2AButton';
import ColorCard from '../components/ColorCard';
import WhatPeoplePlayingCardPreview from '../styleguide/WhatPeoplePlayingCardPreview';
import { UI_BG_TOKENS } from './tokens';

// Strict token lists (only configured/used tokens)
const textTokenStyles = {
  'text-hero': 'text-hero font-sans text-text-tertiary',
  'text-heading': 'text-heading font-sans text-text-tertiary',
  'text-subheading': 'text-subheading font-sans text-text-tertiary',
  'text-body': 'text-body font-sans text-text-tertiary',
  'text-label': 'text-label font-sans text-text-tertiary',
  'text-caption': 'text-caption font-sans text-text-tertiary',
};

// Parallel mono-style text tokens using Geist Mono with existing sizes
const monoTextTokenStyles = {
  'mono-hero': 'text-hero font-mono text-text-tertiary',
  'mono-heading': 'text-heading font-mono text-text-tertiary',
  'mono-subheading': 'text-subheading font-mono text-text-tertiary',
  'mono-body': 'text-body font-mono text-text-tertiary',
  'mono-label': 'text-label font-mono text-text-tertiary',
  'mono-caption': 'text-caption font-mono text-text-tertiary',
};

// Parallel serif-style text tokens using Cormorant Garamond with existing sizes
const serifTextTokenStyles = {
  'serif-hero': 'text-hero font-serif text-text-tertiary',
  'serif-heading': 'text-heading font-serif text-text-tertiary',
  'serif-subheading': 'text-subheading font-serif text-text-tertiary',
  'serif-body': 'text-body font-serif text-text-tertiary',
  'serif-label': 'text-label font-serif text-text-tertiary',
  'serif-caption': 'text-caption font-serif text-text-tertiary',
};

const textColors = [
  { token: 'text-text-primary', label: 'Primary', hex: '#192233' },
  { token: 'text-text-secondary', label: 'Secondary', hex: '#6E7794' },
  { token: 'text-text-tertiary', label: 'Tertiary', hex: '#F4F0EC' },
  { token: 'text-accent', label: 'Accent', hex: '#FFCC00' },
  { token: 'text-success', label: 'Success', hex: '#D3FF34' },
  { token: 'text-alert', label: 'Alert', hex: '#D23001' },
];

const bgColors = [
  { token: 'bg-primary', label: 'Primary', hex: '#192233' },
  { token: 'bg-secondary', label: 'Secondary', hex: '#141416' },
  { token: 'bg-accent', label: 'Accent', hex: '#FFCC00' },
];

export default function StyleGuide() {
  return (
    <div className={`min-h-screen w-full max-w-5xl mx-auto p-8 space-y-10 ${UI_BG_TOKENS.muted}`}>
              <h2 className="text-heading text-text-secondary mb-4">Text Styles</h2>
      <section id="text-styles" className="space-y-3">
        <div className="text-subheading text-text-secondary">Geist Sans Text Styles</div>
        <div className="space-y-2">
          {Object.entries(textTokenStyles).map(([token, className]) => (
            <div key={token} className={className}>
              {`This is ${token}`}
            </div>
          ))}
        </div>
      </section>

      <section id="mono-text-styles" className="space-y-3">
        <div className="text-subheading text-text-secondary">Geist Mono Text Styles</div>
        <div className="space-y-2">
          {Object.entries(monoTextTokenStyles).map(([token, className]) => (
            <div key={token} className={className}>
              {`This is ${token}`}
            </div>
          ))}
        </div>
      </section>

      <section id="serif-text-styles" className="space-y-3">
        <div className="text-subheading text-text-secondary">Cormorant Garamond Text Styles</div>
        <div className="space-y-2">
          {Object.entries(serifTextTokenStyles).map(([token, className]) => (
            <div key={token} className={className}>
              {`This is ${token}`}
            </div>
          ))}
        </div>
      </section>

      <section id="color-styles" className="space-y-3 mt-10">
        <h2 className="text-heading text-text-secondary mb-4">Text Colors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {textColors.map((color) => (
            <ColorCard key={color.token} {...color} />
          ))}
        </div>
      </section>

      <section id="other-styles" className="space-y-3 mt-10">
        <h2 className="text-heading text-text-secondary mb-4">Background Colors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {bgColors.map((color) => (
            <ColorCard key={color.token} {...color} />
          ))}
        </div>
      </section>

      <section id="components" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">Plaible Logo Variants</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center"><PlaibleLogo variant="original" size="sm" /></div>
          <div className="flex items-center"><PlaibleLogo variant="light" size="sm" /></div>
          <div className="flex items-center"><PlaibleLogo variant="ai-original" size="sm" /></div>
          <div className="flex items-center"><PlaibleLogo variant="ai-light" size="sm" /></div>
        </div>
      </section>

      <section id="what-people-playing-card" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">What People Playing Card</h2>
        <WhatPeoplePlayingCardPreview />
      </section>

      <section id="cta-buttons" className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">CTA Buttons</h2>
        <div className="flex flex-wrap items-center gap-4">
          <C2AButton variant="subheading">CTA</C2AButton>
          <C2AButton variant="body">CTA</C2AButton>
        </div>
      </section>

      <section className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">Plaible Logo Sizes (sm / md / lg)</h2>
        <div className="flex flex-col gap-4">
          <PlaibleLogo size="sm" />
          <PlaibleLogo size="md" />
          <PlaibleLogo size="lg" accent />
        </div>
      </section>


    </div>
  );
}


