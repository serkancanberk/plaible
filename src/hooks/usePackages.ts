import { useState, useEffect } from 'react';

export interface Package {
  _id: string;
  name: string;
  credits: number;
  price: number;
  bonus: number;
  description?: string;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  totalCredits: number;
  pricePerCredit: number;
  metadata: {
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UsePackagesReturn {
  packages: Package[];
  loading: boolean;
  error: string | null;
}

export const usePackages = (): UsePackagesReturn => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[PACKAGE_UI][FETCH] Fetching packages from /api/packages');
        
        const response = await fetch('/api/packages', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch packages: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.ok && data.packages) {
          setPackages(data.packages);
          console.log('[PACKAGE_UI][FETCH] Packages loaded successfully:', data.packages.length);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch packages';
        setError(errorMessage);
        console.error('[PACKAGE_UI][FETCH] Error fetching packages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  return { packages, loading, error };
};
