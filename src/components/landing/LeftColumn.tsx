import React from 'react';

interface LeftColumnProps {
  className?: string;
}

const LeftColumn: React.FC<LeftColumnProps> = ({ className = '' }) => {
  const ctaItems = [
    { label: 'START TO PLAY NOW', href: '#' },
    { label: 'Get the app (Soon)', href: '#' },
    { label: 'Pay as you go', href: '#' },
    { label: 'Keep in touch', href: '#' },
    { label: 'Check legal stuffs', href: '#' }
  ];

  return (
    <div className={`bg-accent-gold text-neutral-dark h-screen flex flex-col justify-between px-8 py-10 ${className}`}>
      {/* Top Content */}
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌚</span>
          <h1 className="font-display font-bold text-3xl lg:text-4xl">Plaible</h1>
        </div>

        {/* Main Headline */}
        <h2 className="font-display font-bold text-3xl lg:text-5xl leading-tight">
          Live your own epic stories.
        </h2>

        {/* Body Text */}
        <div className="max-w-[320px] space-y-4">
          <p className="font-sans text-base leading-relaxed text-neutral-dark">
            Every word you type shapes and grows the story into a living world by your imagination and Plaible's storyrunner AI.
          </p>
          <p className="font-sans text-base leading-relaxed text-neutral-dark">
            Forge the tale only you can dream up.
          </p>
        </div>

        {/* CTA Navigation */}
        <nav className="flex flex-col gap-3">
          {ctaItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="text-neutral-dark font-mono uppercase tracking-wide hover:underline focus-visible:ring-2 focus-visible:ring-neutral-dark/50 focus-visible:outline-none transition-colors duration-200 flex items-center justify-between group"
            >
              <span>{item.label}</span>
              <span className="text-sm group-hover:translate-x-1 transition-transform duration-200">→</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <p className="text-sm text-neutral-dark/70">© Plaible.com 2025</p>
      </div>
    </div>
  );
};

export default LeftColumn;
