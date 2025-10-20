import React from 'react';
import PackageCard from '../components/ui/PackageCard';
import { usePackages } from '../hooks/usePackages';

export const PackagesPage: React.FC = () => {
  const { packages, loading, error } = usePackages();

  const handlePurchase = (packageId: string) => {
    console.log('[PACKAGE_UI][PURCHASE] Package selected:', packageId);
    // TODO: Implement purchase flow (Stripe/PayPal integration)
  };

  return (
    <>
      {/* Package grid */}
      <section className="px-spacing-md py-spacing-lg">
        <div className="mx-auto w-full md:max-w-3xl lg:max-w-5xl mt-spacing-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-xl justify-items-center">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-full max-w-[300px] rounded-card bg-white border border-ui-muted shadow-sm overflow-hidden animate-pulse">
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
                  <div role="status" aria-live="polite" className="col-span-full text-center font-mono text-label text-ui-muted">
                    No packages available.
                  </div>
                )}
          </div>
          {error ? (
            <div className="mt-spacing-md col-span-full text-center text-alert font-mono">
              Failed to load packages.
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
};
