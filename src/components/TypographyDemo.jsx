import React from 'react';

const sample = 'The quick brown fox jumps over the lazy dog 0123456789';

export const TypographyDemo = () => {
  return (
    <div className="p-card space-y-6">
      <div>
        <h2 className="text-heading font-sans">Geist Sans</h2>
        <p className="font-sans text-body text-text-primary">{sample}</p>
      </div>
      <div>
        <h2 className="text-subheading font-mono">Geist Mono</h2>
        <p className="font-mono text-body text-text-secondary">{sample}</p>
      </div>
      <div>
        <h2 className="text-subheading font-serif">Cormorant Garamond</h2>
        <p className="font-serif text-body text-text-tertiary">{sample}</p>
      </div>
    </div>
  );
};

export default TypographyDemo;


