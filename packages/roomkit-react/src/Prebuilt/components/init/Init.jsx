import { useEffect } from 'react';
import { useTheme } from '../../../';
import { FeatureFlagsInit } from '../../services/FeatureFlags';

const Init = () => {
  const { toggleTheme } = useTheme();

  useEffect(() => {
    window.toggleUiTheme = toggleTheme;
  }, [toggleTheme]);

  useEffect(() => {
    function resetHeight() {
      // reset the body height to that of the inner browser
      // The window.innerHeight property returns integer values. When the actual height is in decimal, window.innerHeight returns a larger value than the actual value. This can cause a scrollbar to appear on some screens.
      // Hence using window.visualViewport.height which returns a decimal value.
      document.body.style.height = `${window.visualViewport?.height || window.innerHeight}px`;
    }
    // reset the height whenever the window's resized
    window.addEventListener('resize', resetHeight);
    // called to initially set the height.
    resetHeight();
    return () => {
      window.removeEventListener('resize', resetHeight);
    };
  }, []);

  return <FeatureFlagsInit />;
};

export { Init };
