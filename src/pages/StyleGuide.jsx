import React from 'react';
import PlaibleLogo from '../components/PlaibleLogo';
import { TEXT_TOKENS, BG_TOKENS, UI_BG_TOKENS } from './tokens';

// Strict token lists (only configured/used tokens)
const textTokenStyles = {
  'text-hero': 'text-hero font-serif text-text-tertiary',
  'text-heading': 'text-heading font-sans text-text-tertiary',
  'text-subheading': 'text-subheading font-sans text-text-tertiary',
  'text-body': 'text-body font-sans text-text-tertiary',
  'text-label': 'text-label font-sans text-text-tertiary',
  'text-caption': 'text-caption font-sans text-text-tertiary',
};

const TEXT_COLORS = TEXT_TOKENS;
const BG_COLORS = BG_TOKENS;

export default function StyleGuide() {
  return (
    <div className={`min-h-screen w-full max-w-5xl mx-auto p-8 space-y-10 ${UI_BG_TOKENS.muted}`}>
      <section id="text-styles" className="space-y-3">
        <div className="text-body">Text Styles</div>
        <div className="space-y-2">
          {Object.entries(textTokenStyles).map(([token, className]) => (
            <div key={token} className={className}>
              {`This is ${token}`}
            </div>
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

      <section className="my-12">
        <h2 className="text-heading text-text-secondary mb-4">Plaible Logo Sizes (sm / md / lg)</h2>
        <div className="flex flex-col gap-4">
          <PlaibleLogo size="sm" />
          <PlaibleLogo size="md" />
          <PlaibleLogo size="lg" accent />
        </div>
      </section>

      <section id="color-styles" className="space-y-3">
        <div className="text-body text-text-secondary">Text Colors</div>
        <div className={`p-4 rounded-md`}>
          <div className="space-y-2">
            {TEXT_COLORS.map((c) => (
              <div key={c.label} className="flex items-center justify-between gap-4">
                <div className={c.textClass}>{c.label}</div>
                <div className={`w-8 h-8 ${c.swatchClass}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="other-styles" className="space-y-3">
        <div className="text-body text-text-secondary">Background Colors</div>
        <div className={`p-4 rounded-md`}>
          <div className="space-y-2">
            {BG_COLORS.map((c) => (
              <div key={c.label} className="flex items-center justify-between gap-4">
                <div className="text-body">{c.label}</div>
                <div className={`w-8 h-8 ${c.className}`} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}


