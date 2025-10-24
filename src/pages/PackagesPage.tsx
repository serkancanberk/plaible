import React from 'react';
import { CreditsPurchaseSection } from '../components/credits/CreditsPurchaseSection';

export const PackagesPage: React.FC = () => {
  const handlePurchase = (packageId: string) => {
    console.log('[PACKAGE_UI][PURCHASE] Package selected:', packageId);
    // TODO: Implement purchase flow (Stripe/PayPal integration)
  };

  return (
    <CreditsPurchaseSection 
      variant="packages"
      onPurchase={handlePurchase}
    />
  );
};
