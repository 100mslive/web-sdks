import { selectIsLocalAudioEnabled, selectIsLocalVideoEnabled } from '@100mslive/react-sdk';

/**
 * Media Session API allows for handling control actions on top of pip
 * https://web.dev/media-session/#video-conferencing-actions
 */
class SetupMediaSession {
  setup = (actions, store) => {
    this.actions = actions;
    this.store = store;
    this.initState();
    this.setUpHandlers();
  };

  initState = () => {
    const isMicActive = this.store.getState(selectIsLocalAudioEnabled);
    const isCamActive = this.store.getState(selectIsLocalVideoEnabled);
    navigator.mediaSession?.setMicrophoneActive?.(isMicActive);
    navigator.mediaSession?.setCameraActive?.(isCamActive);

    this.store.subscribe(isMicActive => {
      navigator.mediaSession?.setMicrophoneActive?.(isMicActive);
    }, selectIsLocalAudioEnabled);

    this.store.subscribe(isCamActive => {
      navigator.mediaSession?.setCameraActive?.(isCamActive);
    }, selectIsLocalVideoEnabled);
  };

  toggleMic = async () => {
    console.log('toggle mic clicked in pip');
    const current = this.store.getState(selectIsLocalAudioEnabled);
    await this.actions.setLocalAudioEnabled(!current);
  };

  toggleCam = async () => {
    console.log('toggle cam clicked in pip');
    const current = this.store.getState(selectIsLocalVideoEnabled);
    await this.actions.setLocalVideoEnabled(!current);
  };

  leave = () => {
    console.log('leave called from pip');
    this.actions.leave();
  };

  setUpHandlers = () => {
    if (!navigator.mediaSession) {
      return;
    }
    const handlers = {
      togglemicrophone: this.toggleMic,
      togglecamera: this.toggleCam,
      hangup: this.leave,
    };
    // set each handler separately - browsers throw a TypeError on actions they
    // don't recognise (Safari doesn't support 'hangup'), and one unsupported
    // action shouldn't drop the remaining handlers
    Object.entries(handlers).forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        console.warn(`media session action '${action}' is not supported`, err);
      }
    });
  };
}

export const MediaSession = new SetupMediaSession();
