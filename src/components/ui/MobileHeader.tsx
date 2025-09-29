import React, { useState } from 'react';
import PlaibleLogo from '../PlaibleLogo';
import NavItem from './NavItem';

type MobileHeaderItem = {
  label: string;
  onClick?: () => void;
};

type MobileHeaderProps = {
  items: MobileHeaderItem[];
  logoVariant?: 'light' | 'dark';
  bgClassName?: string;
};

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  items,
  logoVariant = 'light',
  bgClassName = 'bg-primary',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className={`border-b border-text-secondary/30 ${bgClassName}`}>
      <div className="flex items-center justify-between px-spacing-md pt-spacing-md pb-spacing-md">
        <div className="text-subheading font-sans">
          <PlaibleLogo variant={logoVariant} size="sm" />
        </div>
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsMenuOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md p-spacing-xs hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <svg
            className={`h-6 w-6 text-text-tertiary transition-transform ${isMenuOpen ? 'rotate-90' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>
      <div
        id="mobile-menu"
        className={`overflow-hidden transition-[max-height] duration-300 ${isMenuOpen ? 'max-h-96' : 'max-h-0'}`}
      >
        <nav className={bgClassName}>
          <ul className="mt-spacing-md space-y-spacing-xs px-spacing-md pb-spacing-md max-w-md mx-auto [&_a]:text-text-tertiary [&_button]:text-text-tertiary [&_a:hover]:text-accent [&_button:hover]:text-accent">
            {items.map((item, index) => (
              <li key={index}>
                <NavItem
                  variant="text"
                  label={item.label}
                  onClick={() => {
                    item.onClick?.();
                    setIsMenuOpen(false);
                  }}
                />
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};
