import { useEffect } from 'react';
import { useHMSActions } from '@100mslive/react-sdk';
import { FeatureFlags } from '../../services/FeatureFlags';
import { useIsHeadless } from '../AppData/useUISettings';

export function BeamSpeakerLabelsLogging() {
  const hmsActions = useHMSActions();
  const isHeadless = useIsHeadless();

  useEffect(() => {
    if (FeatureFlags.enableBeamSpeakersLogging && isHeadless) {
      hmsActions.enableBeamSpeakerLabelsLogging();
    }
  }, [hmsActions, isHeadless]);
  return null;
}
