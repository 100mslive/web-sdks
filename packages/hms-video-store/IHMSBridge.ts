import {
  HMSAudioTrackSettings,
  HMSVideoTrackSettings,
} from './hmsSDKBridge/sdkTypes';

/**
 * The below interface defines our SDK API Surface for taking room related actions.
 * It talks to our 100ms backend and handles error reconnections, state managements
 * and lots of other things so you don't have to. You can use this gateway with any
 * sort of UI to make connecting to our backend easier.
 * In case you use react, we also provide a HMSProvider class with very powerful hooks
 * and out of box components which you can use to setup your website in minutes. Our
 * components have in built integration with this interface and you won't have to worry
 * about passing props if you use them.
 *
 * @remarks
 * There is a one to one mapping between an instance of this class and a 100ms room,
 * in case you're creating multiple rooms please create new instance per room.
 */
export interface IHMSBridge {
  /**
   * join function can be used to join the room, if the room join is successful,
   * current details of participants and track details are populated in the store.
   *
   * @remarks
   * If join is called while an earlier join is in progress for the room id, it
   * is ignored
   *
   * @param args join config with room id, required for joining the room
   */
  join(...args: any[]): void;

  /**
   * This function can be used to leave the room, if the call is repeated it's ignored.
   */
  leave(): void;

  /**
   * If you want to enable screenshare for the local peer this class can be called.
   * The store will be populated with the incoming track, and the subscriber(or
   * react component if our hook is used) will be notified/rerendered
   * @param enabled boolean
   */
  setScreenShareEnabled(enabled: boolean): void;

  /**
   * Send a plain text message to all the other participants in the room.
   * @param message - string message to broadcast
   */
  sendMessage(message: string): void;

  /**
   * These functions can be used to mute/unmute the local peer's audio and video
   * @param enabled boolean
   */
  setLocalAudioEnabled(enabled: boolean): void;
  setLocalVideoEnabled(enabled: boolean): void;

  /**
   * Change settings of the local peer's audio track
   * @param settings HMSAudioTrackSettings
   * ({ volume, codec, maxBitrate, deviceId, advanced })
   * @privateRemarks TODO: Change to MediaStreamConstraints or define interface in sdk-components.
   */
  setAudioSettings(settings: HMSAudioTrackSettings): void;
  /**
   * Change settings of the local peer's video track
   * @param settings HMSVideoTrackSettings
   * ({ width, height, codec, maxFramerate, maxBitrate, deviceId, advanced })
   * @privateRemarks TODO: Change to MediaStreamConstraints or define interface in sdk-components.
   */
  setVideoSettings(settings: HMSVideoTrackSettings): void;

  /**
   * If you're not using our Video Component you can use the below functions directly
   * to add/remove video from an element for a track ID. The benefit of using this
   * instead of removing the video yourself is that it'll also auto unsubscribe to
   * the stream coming from server saving significant bandwidth for the user.
   * @param trackID trackID as stored in the store for the peer
   * @param videoElement HTML native element where the video has to be shown
   */
  attachVideo(trackID: string, videoElement: HTMLVideoElement): void;
  detachVideo(trackID: string, videoElement: HTMLVideoElement): void;
}

/**
 * If there is an error in any action, the notification will contain the details
 * about the error which will be an object following this interface.
 */
export interface HMSError {
  code: number;
  message: string;
}
