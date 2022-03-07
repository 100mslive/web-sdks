import { Accessor, createEffect, createSignal } from 'solid-js';
import { HMSNotificationTypes } from '@100mslive/hms-video-store';
import { useHMSActions, useHMSNotifications } from '../primitives/HmsRoomProvider';

export interface useAutoplayErrorResult {
  /*
   * Autoplay error message
   */
  error: Accessor<string>;
  /**
   * call this method on a UI element click to unblock the blocked audio autoplay.
   */
  unblockAudio: () => Promise<void>;
  /**
   * Call this method to reset(hide) the UI that is rendered when there was an error
   */
  resetError: () => void;
}

/**
 * Use this hook to show a UI(modal or a toast) when autoplay is blocked by browser and allow the user to
 * unblock the browser autoplay block
 * @returns {useAutoplayErrorResult}
 */
export const useAutoplayError = (): useAutoplayErrorResult => {
  const notification = useHMSNotifications(HMSNotificationTypes.ERROR);
  const [error, setError] = createSignal('');
  const actions = useHMSActions();

  const unblockAudio = async () => {
    await actions.unblockAudio();
  };

  createEffect(() => {
    if (notification()?.data.code === 3008) {
      setError(notification()?.data.message);
    }
  });

  return { error, unblockAudio, resetError: () => setError('') };
};
