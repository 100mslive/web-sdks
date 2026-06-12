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

  /**
   * register the handler against the first action name the browser supports.
   * Browsers throw a TypeError on action names they don't recognise, and the
   * same action can go by different names (Chrome calls the leave action
   * 'hangup', Safari exposes it as 'stop').
   */
  trySetActionHandler = (actionAliases, handler) => {
    for (const action of actionAliases) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
        return;
      } catch (err) {
        // unsupported alias, try the next one
      }
    }
    console.warn(`media session action '${actionAliases.join("'/'")}' is not supported`);
  };

  setUpHandlers = () => {
    if (!navigator.mediaSession) {
      return;
    }
    this.trySetActionHandler(['togglemicrophone'], this.toggleMic);
    this.trySetActionHandler(['togglecamera'], this.toggleCam);
    this.trySetActionHandler(['hangup', 'stop'], this.leave);
  };
}

export const MediaSession = new SetupMediaSession();
