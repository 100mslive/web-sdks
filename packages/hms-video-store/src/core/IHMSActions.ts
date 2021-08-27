import {
  HMSConfig,
  HMSSimulcastLayer,
  HMSAudioTrackSettings,
  HMSVideoTrackSettings,
  HMSLogLevel,
} from '@100mslive/hms-video';
import { HMSPeerID, HMSRoleName, HMSTrackSource } from './schema';
import { HMSVideoPlugin } from '@100mslive/hms-video';
import { HMSRoleChangeRequest } from './selectors';

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
 *
 * @category Core
 */
export interface IHMSActions {
  preview(config: HMSConfig): Promise<void>;
  /**
   * join function can be used to join the room, if the room join is successful,
   * current details of participants and track details are populated in the store.
   *
   * @remarks
   * If join is called while an earlier join is in progress for the room id, it
   * is ignored
   *
   * @param config join config with room id, required for joining the room
   */
  join(config: HMSConfig): void;

  /**
   * This function can be used to leave the room, if the call is repeated it's ignored.
   */
  leave(): Promise<void>;

  /**
   * If you want to enable screenshare for the local peer this class can be called.
   * The store will be populated with the incoming track, and the subscriber(or
   * react component if our hook is used) will be notified/rerendered
   * @param enabled boolean
   * @param audioOnly boolean To publish only audio from screenshare
   */
  setScreenShareEnabled(enabled: boolean, audioOnly?: boolean): Promise<void>;

  /**
   * You can use the addTrack method to add an auxiliary track(canvas capture, electron screen-share, etc...)
   * This method adds the track to the local peer's list of auxiliary tracks and publishes it to make it available to remote peers.
   * @param track MediaStreamTrack - Track to be added
   * @param type HMSTrackSource - 'regular' | 'screen' | 'plugin' - Source of track - default: 'regular'
   */
  addTrack(track: MediaStreamTrack, type: HMSTrackSource): Promise<void>;

  /**
   * You can use the removeTrack method to remove an auxiliary track.
   * This method removes the track from the local peer's list of auxiliary tracks and unpublishes it.
   * @param trackId string - ID of the track to be removed
   */
  removeTrack(trackId: string): Promise<void>;

  /**
   * @deprecated The method should not be used
   * @see sendBroadcastMessage
   * Send a plain text message to all the other participants in the room.
   * @param message - string message to broadcast
   */
  sendMessage(message: string): void;

  /**
   * Send a plain text message to all the other participants in the room.
   * @param message - string message to broadcast
   * @param type - type of message eg: image, video etc. - optional defaults to chat
   */
  sendBroadcastMessage(message: string, type?: string): Promise<void>;
  /**
   *
   * @param message - string message to send
   * @param roles - roles to which to send the message
   * @param type - type of message eg: image, video etc. - optional defaults to chat
   */
  sendGroupMessage(message: string, roles: HMSRoleName[], type?: string): Promise<void>;
  /**
   *
   * @param message
   * @param peerID - id of the peer to which message has to be sent
   * @param type - type of message eg: image, video etc. - optional defaults to chat
   */
  sendDirectMessage(message: string, peerID: HMSPeerID, type?: string): Promise<void>;

  /**
   * If just readStatus argument is passed, the function will set read flag of every message
   * as the readStatus argument passed.
   * If both readStatus and messageId argument is passed, then just read flag of message
   * with passed messageId will be set as readStatus argument. if message with passed messageId is not
   * found in store, no change in store will take place.
   *
   * @param readStatus boolean value which you want to set as read flag for message/messages.
   * @param messageId message id whose read falg you want to set.
   */
  setMessageRead(readStatus: boolean, messageId?: string): void;

  /**
   * These functions can be used to mute/unmute the local peer's audio and video
   * @param enabled boolean
   */
  setLocalAudioEnabled(enabled: boolean): Promise<void>;

  /**
   * @see setLocalAudioEnabled
   */
  setLocalVideoEnabled(enabled: boolean): Promise<void>;

  /**
   * @param trackId string - ID of the track whose mute status needs to be set
   * @param enabled boolean - true when we want to unmute the track and false when we want to unmute it
   */
  setEnabledTrack(trackId: string, enabled: boolean): Promise<void>;

  /**
   * Change settings of the local peer's audio track
   * @param settings HMSAudioTrackSettings
   * ({ volume, codec, maxBitrate, deviceId, advanced })
   */
  setAudioSettings(settings: Partial<HMSAudioTrackSettings>): Promise<void>;
  /**
   * Change settings of the local peer's video track
   * @param settings HMSVideoTrackSettings
   * ({ width, height, codec, maxFramerate, maxBitrate, deviceId, advanced })
   */
  setVideoSettings(settings: Partial<HMSVideoTrackSettings>): Promise<void>;

  /**
   * If you're not using our Video Component you can use the below functions directly
   * to add/remove video from an element for a track ID. The benefit of using this
   * instead of removing the video yourself is that it'll also auto unsubscribe to
   * the stream coming from server saving significant bandwidth for the user.
   * @param trackID trackID as stored in the store for the peer
   * @param videoElement HTML native element where the video has to be shown
   */
  attachVideo(trackID: string, videoElement: HTMLVideoElement): Promise<void>;

  /**
   * @see attachVideo
   */
  detachVideo(trackID: string, videoElement: HTMLVideoElement): Promise<void>;

  /**
   * Set the output volume of audio tracks(overall/particular audio track)
   * @param value number between 0-100
   * @param trackId string If undefined sets the overall volume(of every audio track in the room); If valid - set the volume of particular audio track
   *
   */
  setVolume(value: number, trackId?: string): void;

  /**
   * Set the audio output(speaker) device
   * @param deviceId string deviceId of the audio output device
   */
  setAudioOutputDevice(deviceId: string): void;

  /**
   * set the quality of the selected videoTrack
   * @param trackId
   * @param layer
   */
  setPreferredLayer(trackId: string, layer: HMSSimulcastLayer): void;

  /**
   * Add or remove a video plugin from/to the local peer video track. Eg. Virtual Background, Face Filters etc.
   * Video plugins can be added/removed at any time after the join is successful.
   * pluginFrameRate is the rate at which the output plugin will do processing
   * @param plugin HMSVideoPlugin
   * @param pluginFrameRate number
   * @see HMSVideoPlugin
   */
  addPluginToVideoTrack(plugin: HMSVideoPlugin, pluginFrameRate?: number): Promise<void>;

  /**
   * @see addPluginToVideoTrack
   */
  removePluginFromVideoTrack(plugin: HMSVideoPlugin): Promise<void>;

  /**
   * Request for a role change of a remote peer. Can be forced.
   * @param forPeerId The remote peer id whose role needs to be changed
   * @param toRole The name of the new role.
   * @param [force] this being true would mean that user won't get a request to accept role change
   */
  changeRole(forPeerId: string, toRole: string, force?: boolean): Promise<void>;

  /**
   * Accept the role change request received
   * @param {HMSRoleChangeRequest} request The original request that was received
   */
  acceptChangeRole(request: HMSRoleChangeRequest): Promise<void>;

  /**
   * Reject pending role change request
   * @param {HMSRoleChangeRequest} request The original request that was received
   */
  rejectChangeRole(request: HMSRoleChangeRequest): void;

  /**
   * Change track state a remote peer's track
   * This can be used to mute/unmute a remote peer's track
   * @param forRemoteTrackID The track ID or array of track IDs for which you want to change the state
   * @param enabled `true` if you wish to enable(unmute permission is required) the track, `false` if you wish to disable(mute permission is required) the track
   */
  setRemoteTrackEnabled(forRemoteTrackID: string | string[], enabled: boolean): Promise<void>;

  /**
   * Method to be called with some UI interaction after autoplay error is received
   */
  unblockAudio: () => Promise<void>;

  /**
   * If you have the **endRoom** permission, you can end the room. That means everyone will be kicked out.
   * If lock is passed as true, the room cannot be used further.
   */
  endRoom: (lock: boolean, reason: string) => Promise<void>;

  /**
   * If you have **removeOthers** permission, you can remove a peer from the room.
   * @param peerID peerID of the peer to be removed from the remove
   * @param reason a string explaining why the peer is removed from the room.
   * This string could be used to notify the user before they're removed from the room
   * using the `REMOVED_FROM_ROOM` type of notification
   */
  removePeer(peerID: string, reason: string): Promise<void>;

  /**
   * Set the type of logs from the SDK you want to be logged in the browser console.
   *
   * Note that HMSLogLevel is decremental meaning,
   * - HMSLogLevel.VERBOSE(0) - will log every message from SDK.
   * - HMSLogLevel.DEBUG(1) - will log messages that are helpful in debugging, important info, warnings and errors.
   * - HMSLogLevel.INFO(2) - will log important info, warnings and errors.
   * - HMSLogLevel.WARN(3) - will log warnings and errors.
   * - HMSLogLevel.ERROR(4) - will log only errors.
   * - HMSLogLevel.NONE(5) - won't log anything.
   *
   * Usage: `hmsActions.setLogLevel(4)` or `hmsActions.setLogLevel(HMSlogLevel.ERROR)`.
   */
  setLogLevel(level: HMSLogLevel): void;
}
