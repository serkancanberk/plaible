import { NavigateFunction } from 'react-router-dom';

/**
 * Shared navigation handler for Add Balance functionality
 * Provides consistent navigation to the packages page across all components
 * 
 * @param navigate - React Router navigate function
 * @param context - Optional context for logging (e.g., 'header', 'payment-prompt')
 */
export const handleAddBalanceNavigation = (
  navigate: NavigateFunction,
  context?: string
): void => {
  console.log('[PACKAGE_UI][NAVIGATION] User clicked Add Balance → Redirecting to /app/packages', {
    context: context || 'unknown',
    timestamp: new Date().toISOString()
  });
  
  navigate('/app/packages');
};

/**
 * Hook-based version for components that use useNavigate
 * Returns a function that can be called directly
 * 
 * @param context - Optional context for logging
 */
export const useAddBalanceNavigation = (context?: string) => {
  // This will be used by components that import useNavigate
  return (navigate: NavigateFunction) => handleAddBalanceNavigation(navigate, context);
};
