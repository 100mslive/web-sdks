/**
 * This module provides a centralized way to override media queries
 * for forcing mobile/desktop views without modifying all components
 */

// Store the override value globally
let globalMobileOverride: boolean | undefined = undefined;

export const setGlobalMobileOverride = (isMobile?: boolean) => {
  globalMobileOverride = isMobile;
};

export const getGlobalMobileOverride = () => {
  return globalMobileOverride;
};

/**
 * Wrapper for useMedia that checks global override first
 * This is a much simpler approach than context everywhere
 */
export const createMediaHook = (originalUseMedia: (query: string) => boolean) => {
  return (query: string): boolean => {
    const override = getGlobalMobileOverride();

    if (override === undefined) {
      return originalUseMedia(query);
    }

    // Check if this is a mobile-related query
    const isMobileQuery = query.includes('max-width') && (query.includes('768') || query.includes('640'));

    if (isMobileQuery) {
      return override;
    }

    // Landscape query
    if (query.includes('orientation: landscape')) {
      return override && originalUseMedia('(orientation: landscape)');
    }

    return originalUseMedia(query);
  };
};
