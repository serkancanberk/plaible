import React from 'react';
import PackageCard from '../ui/PackageCard';
import { usePackages } from '../../hooks/usePackages';

type CreditsVariant = 'packages' | 'story-paused';

interface CreditsPurchaseSectionProps {
  variant: CreditsVariant;
  onPurchase: (packageId: string) => void;
  showHeaderBlock?: boolean; // default true
  headerTitle?: string;
  headerSubtitle?: string;
  align?: 'left' | 'center'; // default left
}

const defaultHeaders = {
  packages: {
    title: '🌕 Power Up Your Storyline',
    subtitle: 'Choose the right package and unlock your next chapter.',
  },
  'story-paused': {
    title: '🌒 Your chapter paused for now',
    subtitle:
      'Your next chapter is waiting to be written. Add some more credits to continue your story.',
  },
};

export const CreditsPurchaseSection: React.FC<CreditsPurchaseSectionProps> = ({
  variant,
  onPurchase,
  showHeaderBlock = true,
  headerTitle,
  headerSubtitle,
  align = 'left',
}) => {
  const { packages, loading, error } = usePackages();

  const title = headerTitle || defaultHeaders[variant].title;
  const subtitle = headerSubtitle || defaultHeaders[variant].subtitle;

  return (
    <section className="px-spacing-md py-spacing-2xl w-full">
      {showHeaderBlock && (
        <div className={`mb-spacing-md text-${align}`}>
          <h2 className="text-subheading font-serif text-accent">
            {title}
          </h2>
          <p className="text-body text-text-secondary mt-spacing-xs">
            {subtitle}
          </p>
        </div>
      )}

      <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl mt-spacing-2xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg auto-rows-fr mt-spacing-xl">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full rounded-card bg-white border border-ui-muted shadow-sm overflow-hidden animate-pulse"
                >
                  <div className="px-spacing-md pt-spacing-md">
                    <div className="h-6 w-3/4 bg-ui-muted rounded" />
                  </div>
                  <div className="px-spacing-md pt-spacing-md pb-spacing-md space-y-spacing-sm">
                    <div className="h-8 w-1/2 bg-ui-muted rounded" />
                    <div className="h-4 w-3/4 bg-ui-muted rounded" />
                    <div className="h-6 w-1/3 bg-ui-muted rounded" />
                    <div className="h-4 w-full bg-ui-muted rounded" />
                    <div className="h-10 w-full bg-ui-muted rounded-card" />
                  </div>
                </div>
              ))
            : packages?.length
            ? packages.map((pkg) => (
                <PackageCard
                  key={pkg._id}
                  package={pkg}
                  onPurchase={onPurchase}
                />
              ))
            : (
                <div
                  role="status"
                  aria-live="polite"
                  className="col-span-full text-left font-mono text-label text-ui-muted"
                >
                  No packages available.
                </div>
              )}
        </div>

        {error && (
          <div className="mt-spacing-md col-span-full text-left text-alert font-mono">
            Failed to load packages.
          </div>
        )}
      </div>
    </section>
  );
};
