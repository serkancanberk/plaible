import React, { useEffect } from 'react';
import BaseModal from './BaseModal';
import PackageCard from '../PackageCard';
import { usePackages } from '../../../hooks/usePackages';

interface PackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PackagesModal: React.FC<PackagesModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { packages, loading, error } = usePackages();

  // Body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      console.log('[CREDITS_UI][MODAL] Opened');
    } else {
      document.body.style.overflow = '';
      console.log('[CREDITS_UI][MODAL] Closed');
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handlePurchase = (packageId: string) => {
    console.log(`[CREDITS_UI][MODAL] Purchase: ${packageId}`);
    
    // Close modal first
    onClose();
    
    // Navigate to payment route (placeholder for now)
    // TODO: Implement actual payment flow
    const paymentRoute = `/payment/stripe/${packageId}`;
    console.log(`[CREDITS_UI][MODAL] Navigating to: ${paymentRoute}`);
    
    // For now, navigate to the packages page as fallback
    window.location.href = '/app/packages';
  };

  return (
    <BaseModal
      open={isOpen}
      onClose={onClose}
      title="BUY CREDITS"
      subtitle="Choose a package to continue your story."
      variant="accent"
      className="w-full md:max-w-4xl lg:max-w-6xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-lg">
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
          : packages && packages.length > 0
            ? packages.map((packageData) => (
                <PackageCard
                  key={packageData._id}
                  package={packageData}
                  onPurchase={handlePurchase}
                />
              ))
            : (
                <div
                  role="status"
                  aria-live="polite"
                  className="col-span-full text-center font-mono text-label text-ui-muted"
                >
                  No packages available.
                </div>
              )}
      </div>

      {error && (
        <div className="mt-spacing-md col-span-full text-center text-alert font-mono">
          Failed to load packages.
        </div>
      )}
    </BaseModal>
  );
};

export default PackagesModal;
