import { useMedia as useMediaOriginal } from 'react-use';
import { getGlobalMobileOverride } from './mediaOverride';

/**
 * Custom useMedia hook that respects the global mobile override
 * This wrapper checks if there's a global override for mobile view
 * and returns that value instead of the actual media query result
 */
export const useMedia = (query: string): boolean => {
  const actualValue = useMediaOriginal(query);
  const override = getGlobalMobileOverride();

  // Check if this is a mobile-related media query
  // Common patterns: max-width: 768px, max-width: 640px, etc.
  const isMobileQuery =
    query.includes('max-width') && (query.includes('768px') || query.includes('640px') || query.includes('820px'));

  // If we have an override and this is a mobile query, use the override
  if (override !== undefined && isMobileQuery) {
    return override;
  }

  // Otherwise return the actual media query result
  return actualValue;
};
