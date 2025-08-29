import { getGlobalMobileOverride } from './mediaOverride';

/**
 * Helper function to conditionally apply mobile CSS styles
 * This ensures CSS properties are applied when isMobile is forced
 * @param mobileStyles - The styles to apply for mobile view
 * @returns Object with mobile styles applied if override is set
 */
export const getMobileStyles = (mobileStyles: Record<string, any>) => {
  const override = getGlobalMobileOverride();
  return override ? mobileStyles : {};
};

/**
 * Helper to merge mobile styles with media query styles
 * @param baseStyles - The base styles object
 * @param mobileStyles - The styles to apply for mobile
 * @returns Merged styles object
 */
export const withMobileStyles = (baseStyles: Record<string, any>, mobileStyles: Record<string, any>) => {
  const override = getGlobalMobileOverride();
  if (override) {
    return {
      ...baseStyles,
      ...mobileStyles,
      '@md': mobileStyles, // Keep media query for actual mobile devices
    };
  }
  return {
    ...baseStyles,
    '@md': mobileStyles,
  };
};
