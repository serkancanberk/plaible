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
      'flex flex-col justify-between h-full min-h-card w-full',
      className,
    ].filter(Boolean).join(' ')}>
      
      {/* Content section */}
      <div className="flex-grow flex flex-col justify-between px-spacing-md pt-spacing-md">
        {/* Title + Most Popular (inline) + Amount + Price (tight grouping) */}
        <div className="flex flex-col gap-spacing-2xs">
          <div className="flex items-center gap-spacing-xs">
            <h3 className="font-serif text-heading text-accent">{packageData.name}</h3>
            {packageData.isPopular && (
              <span className=" text-caption font-sans inline-flex items-center px-spacing-xs py-spacing-xs bg-secondary text-accent/75 rounded-card">
                ⭐ Most Popular
              </span>
            )}
          </div>
          <div className="font-mono text-hero text-accent">
            {packageData.credits}
            <span className="font-mono text-subheading text-text-accent ml-spacing-xs">credits</span>
          </div>
          <div className="font-sans font-regular text-body text-ui-muted">
            ${packageData.price.toFixed(2)}
          </div>
        </div>

        {/* Description (multi-line, no truncation) */}
        {packageData.description && (
          <div className="mt-spacing-md">
            <p className="font-sans text-body text-ui-muted whitespace-normal">{packageData.description}</p>
          </div>
        )}

        {/* Meta section - vertical stacked */}
        <div className="font-sans text-body text-ui-muted mb-spacing-lg mt-spacing-md flex flex-col gap-spacing-sm">
          {/* Bonus display */}
          {packageData.bonus > 0 && (
            <span className="inline-flex items-center gap-spacing-xs" title="Bonus credits">
              <span aria-hidden="true">🎁</span>
              <span className="sr-only">Bonus:</span>
              <span>+{packageData.bonus} free credits</span>
            </span>
          )}
          
          {/* Total credits */}
          <span className="inline-flex items-center gap-spacing-xs" title="Total credits">
            <span aria-hidden="true">💎</span>
            <span className="sr-only">Total:</span>
            <span className="font-sans font-bold text-body text-accent">Get {packageData.totalCredits} total credits</span>
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
