import { useMedia as useMediaOriginal } from 'react-use';
import { config as cssConfig } from '../../Theme';
import { getGlobalMobileOverride } from './mediaOverride';

/**
 * Custom useMedia hook that respects the global mobile override
 * This wrapper checks if there's a global override for mobile view
 * and returns that value instead of the actual media query result
 */
export const useMedia = (query: string): boolean => {
  const actualValue = useMediaOriginal(query);
  const override = getGlobalMobileOverride();

  // Check if this query matches one of our mobile breakpoints
  const isMobileQuery = query === cssConfig.media.md || query === cssConfig.media.sm;

  // If we have an override and this is a mobile query, use the override
  if (override !== undefined && isMobileQuery) {
    return override;
  }

  // Otherwise return the actual media query result
  return actualValue;
};
