import React from 'react';
import C2AButton from '../C2AButton';
import { Package } from '../../hooks/usePackages';

export interface PackageCardProps {
  package: Package;
  onPurchase?: (packageId: string) => void;
  className?: string;
}

export default function PackageCard({
  package: packageData,
  onPurchase,
  className,
}: PackageCardProps) {
  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase(packageData._id);
    }
  };

  return (
    <div className={[
      'block bg-primary text-text-tertiary rounded-card shadow-card overflow-hidden',
      'border border-transparent',
      'transition-opacity duration-200 ease-out hover:opacity-90',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent',
      'flex flex-col justify-between h-full min-h-card',
      className,
    ].filter(Boolean).join(' ')}>
      
      {/* Media section with inner padding (empty for PackageCard) */}
      <div className="px-spacing-md pt-spacing-md">
        {/* Popular badge positioned in media section */}
        {packageData.isPopular && (
          <div className="relative">
            <span className="inline-flex items-center px-spacing-sm py-spacing-xs bg-accent text-white text-caption font-mono rounded-full">
              ⭐ Most Popular
            </span>
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="flex-grow flex flex-col justify-between px-spacing-md pt-spacing-md">
        {/* Title + Meta (tight grouping) */}
        <div className="flex flex-col gap-spacing-2xs">
          <h3 className="font-serif text-subheading text-accent">{packageData.name}</h3>
          <div className="text-hero font-bold text-accent">
            {packageData.credits}
            <span className="text-body text-text-secondary ml-spacing-xs">credits</span>
          </div>
        </div>

        {/* Description (single line) + More link (separate line) */}
        {packageData.description && (
          <div className="mt-spacing-md">
            <p className="font-mono text-caption text-text-tertiary/90 line-clamp-1">{packageData.description}</p>
            <span className="inline-block mt-spacing-xs text-accent text-caption underline underline-offset-4 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent">
              More
            </span>
          </div>
        )}

        {/* Meta row */}
        <div className="mt-spacing-md flex items-center gap-spacing-lg text-caption font-mono text-accent mb-spacing-md">
          {/* Bonus display */}
          {packageData.bonus > 0 && (
            <span className="inline-flex items-center gap-spacing-xs" title="Bonus credits">
              <span aria-hidden="true">🎁</span>
              <span className="sr-only">Bonus:</span>
              <span className="text-text-tertiary">+{packageData.bonus} bonus</span>
            </span>
          )}
          
          {/* Total credits */}
          <span className="inline-flex items-center gap-spacing-xs" title="Total credits">
            <span aria-hidden="true">💎</span>
            <span className="sr-only">Total:</span>
            <span className="text-text-tertiary">{packageData.totalCredits}</span>
          </span>
          
          {/* Price per credit */}
          <span className="inline-flex items-center gap-spacing-xs" title="Price per credit">
            <span aria-hidden="true">💰</span>
            <span className="sr-only">Per credit:</span>
            <span className="text-text-tertiary">${packageData.pricePerCredit.toFixed(3)}</span>
          </span>
        </div>
      </div>

      {/* CTA section at bottom, full width */}
      <div className="mt-auto px-spacing-md pb-spacing-md">
        <C2AButton
          variant="primary"
          typography="caption"
          fullWidth
          onClick={handlePurchase}
        >
          Buy Now
        </C2AButton>
      </div>
    </div>
  );
}
