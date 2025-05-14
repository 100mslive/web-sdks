import { HMSDiagnosticsInterface } from './diagnostics/interfaces';
import { TranscriptionConfig } from './interfaces/transcription-config';
import { FindPeerByNameRequestParams } from './signal/interfaces';
import { HMSSessionFeedback } from './end-call-feedback';
import {
  HLSConfig,
  HLSTimedMetadata,
  HMSAudioPlugin,
  HMSAudioTrackSettings,
  HMSConfig,
  HMSInteractivityCenter as IHMSInteractivityCenter,
  HMSLogLevel,
  HMSMediaStreamPlugin,
  HMSMidCallPreviewConfig,
  HMSPlaylistSettings,
  HMSPluginSupportResult,
  HMSPreferredSimulcastLayer,
  HMSPreviewConfig,
  HMSScreenShareConfig,
  HMSTrack,
  HMSVideoPlugin,
  HMSVideoTrackSettings,
  RTMPRecordingConfig,
  StopHLSConfig,
  TokenRequest,
  TokenRequestOptions,
} from './internal';
import {
  DebugInfo,
  HMSChangeMultiTrackStateParams,
  HMSGenericTypes,
  HMSMessageID,
  HMSPeer,
  HMSPeerID,
  HMSPeerListIterator,
  HMSPeerListIteratorOptions,
  HMSRoleName,
  HMSTrackID,
  HMSTrackSource,
  IHMSPlaylistActions,
  IHMSSessionStoreActions,
} from './schema';
import { HMSRoleChangeRequest } from './selectors';
import { HMSStats } from './webrtc-stats';

/**
 * The below interface defines our SDK API Surface for taking room related actions.
 * It talks to our 100ms backend and handles error reconnections, state managements
 * and lots of other things so you don't have to. You can use this gateway with any
 * sort of UI to make connecting to our backend easier.
 * In case you use React, we also provide a HMSProvider class with very powerful hooks
 * and out of box components which you can use to set up your website in minutes. Our
 * components have in built integration with this interface, and you won't have to worry
 * about passing props if you use them.
 *
 * @remarks
 * There is a one to one mapping between an instance of this class and a 100ms room,
 * in case you're creating multiple rooms please create new instance per room.
 *
 * @category Core
 */
export interface IHMSActions<T extends HMSGenericTypes = { sessionStore: Record<string, any> }> {
  /**
   * Preview function can be used to preview the camera and microphone before joining the room.
   * This function is useful when you want to check and/or modify the camera and microphone settings before joining the Room.
   * @param config preview config with camera and microphone devices
   * @returns Promise<void> - resolves when the preview is successful
   */
  preview(config: HMSMidCallPreviewConfig | HMSPreviewConfig): Promise<void>;

  /**
   * join function can be used to join the room, if the room join is successful,
   * current details of participants and track details are populated in the store.
   *
   * @remarks
   * If join is called while an earlier join is in progress for the room id, it
   * is ignored
   *
   * @param config join config with room id, required for joining the room
   * @returns Promise<void> - resolves when the room is joined
   */
  join(config: HMSConfig): Promise<void>;

  /**
   * This function can be used to leave the room, if the call is repeated it's ignored.
   * This function also cleans up the store and removes all the tracks and participants.
   * @returns Promise<void> - resolves when the room is left
   */
  leave(): Promise<void>;

  /**
   * stop tracks fetched during midcall preview and general cleanup
   * @returns Promise<void> - resolves when the tracks are stopped
   */
  cancelMidCallPreview(): Promise<void>;

  /**
   * If you want to enable screenshare for the local peer this class can be called.
   * The store will be populated with the incoming track, and the subscriber(or
   * react component if our hook is used) will be notified/rerendered
   * @param enabled boolean - true to enable screenshare, false to disable
   * @param config check the config object for details about the fields
   * @returns Promise<void> - resolves when the screenshare is enabled
   */
  setScreenShareEnabled(enabled: boolean, config?: HMSScreenShareConfig): Promise<void>;

  /**
   * You can use the addTrack method to add an auxiliary track(canvas capture, electron screen-share, etc...)
   * This method adds the track to the local peer's list of auxiliary tracks and publishes it to make it available to remote peers.
   * @param track MediaStreamTrack - Track to be added
   * @param type HMSTrackSource - 'regular' | 'screen' | 'plugin' - Source of track - default: 'regular'
   * @returns Promise<void> - resolves when the track is added
   */
  addTrack(track: MediaStreamTrack, type: HMSTrackSource): Promise<void>;

  /**
   * You can use the removeTrack method to remove an auxiliary track.
   * This method removes the track from the local peer's list of auxiliary tracks and unpublishes it.
   * @param trackId string - ID of the track to be removed
   * @returns Promise<void> - resolves when the track is removed
   */
  removeTrack(trackId: HMSTrackID): Promise<void>;

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
   * @param type - type of message. For example: image, video etc. - optional defaults to chat
   * @returns Promise<void> - resolves when the message is sent
   */
  sendBroadcastMessage(message: string, type?: string): Promise<void>;
  /**
   *
   * @param message - string message to send
   * @param roles - roles to which to send the message
   * @param type - type of message. For example: image, video etc. - optional defaults to chat
   * @returns Promise<void> - resolves when the message is sent
   */
  sendGroupMessage(message: string, roles: HMSRoleName[], type?: string): Promise<void>;
  /**
   *
   * @param message
   * @param peerID - id of the peer to which message has to be sent
   * @param type - type of message. For example: image, video etc. - optional defaults to chat
   * @returns Promise<void> - resolves when the message is sent
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
   * @param messageId message id whose read flag you want to set.
   */
  setMessageRead(readStatus: boolean, messageId?: HMSMessageID): void;

  /**
   * This function can be used to enable/disable(unmute/mute) local audio track
   * @param enabled boolean - true to unmute, false to mute
   * @returns Promise<void> - resolves when the audio is enabled
   */
  setLocalAudioEnabled(enabled: boolean): Promise<void>;

  /**
   * This function can be used to enable/disable(unmute/mute) local video track
   * @param enabled boolean - true to unmute, false to mute
   * @returns Promise<void> - resolves when the video is enabled
   */
  setLocalVideoEnabled(enabled: boolean): Promise<void>;

  /**
   * @param trackId string - ID of the track whose mute status needs to be set
   * @param enabled boolean - true when we want to unmute the track and false when we want to unmute it
   * @returns Promise<void> - resolves when the track is enabled
   */
  setEnabledTrack(trackId: HMSTrackID, enabled: boolean): Promise<void>;

  /**
   * Change settings of the local peer's audio track
   * @param settings HMSAudioTrackSettings
   * `({ volume, codec, maxBitrate, deviceId, advanced })`
   */
  setAudioSettings(settings: Partial<HMSAudioTrackSettings>): Promise<void>;

  /**
   * Change settings of the local peer's video track
   * @param settings HMSVideoTrackSettings
   * `({ width, height, codec, maxFramerate, maxBitrate, deviceId, advanced, facingMode })`
   */
  setVideoSettings(settings: Partial<HMSVideoTrackSettings>): Promise<void>;

  /**
   * Toggle the camera between front and back if the both the camera's exist
   * @returns Promise<void> - resolves when the camera is toggled
   */
  switchCamera(): Promise<void>;

  /**
   * You can use the attach and detach video function
   * to add/remove video from an element for a track ID. The benefit of using this
   * instead of removing the video yourself is that it'll also auto unsubscribe to
   * the stream coming from server saving significant bandwidth for the user.
   * @param localTrackID trackID as stored in the store for the peer
   * @param videoElement HTML native element where the video has to be shown
   * @returns Promise<void> - resolves when the video is attached
   */
  attachVideo(localTrackID: HMSTrackID, videoElement: HTMLVideoElement): Promise<void>;

  /**
   * @see attachVideo
   */
  detachVideo(localTrackID: HMSTrackID, videoElement: HTMLVideoElement): Promise<void>;

  /**
   * Set the output volume of audio tracks(overall/particular audio track)
   * @param value number between 0-100
   * @param trackId string If undefined sets the overall volume(of every audio track in the room); If valid - set the volume of particular audio track
   * @returns Promise<void> - resolves when the volume is set
   */
  setVolume(value: number, trackId?: HMSTrackID): Promise<void>;

  /**
   * Set the audio output(speaker) device
   * @param deviceId string deviceId of the audio output device
   * @returns Promise<void> - resolves when the audio output device is set
   */
  setAudioOutputDevice(deviceId: string): Promise<void>;

  refreshDevices(): Promise<void>;

  /**
   * set the quality of the selected videoTrack for simulcast.
   * @param trackId HMSTrackID - trackId of the video track
   * @param layer HMSSimulcastLayer - layer to be set
   * @returns Promise<void> - resolves when the layer is set
   */
  setPreferredLayer(trackId: HMSTrackID, layer: HMSPreferredSimulcastLayer): Promise<void>;

  /**
   * Add or remove a video plugin from/to the local peer video track. Eg. Virtual Background, Face Filters etc.
   * Video plugins can be added/removed at any time after the video track is available.
   * pluginFrameRate is the rate at which the output plugin will do processing
   * @param plugin HMSVideoPlugin
   * @param pluginFrameRate number
   * @see HMSVideoPlugin
   */
  addPluginToVideoTrack(plugin: HMSVideoPlugin, pluginFrameRate?: number): Promise<void>;

  /**
   * Add  video plugins to the local peer video stream. Eg. Virtual Background, Face Filters etc.
   * Video plugins can be added/removed at any time after the video track is available.
   * @see HMSMediaStreamPlugin
   * @param plugins
   */
  addPluginsToVideoStream(plugins: HMSMediaStreamPlugin[]): Promise<void>;

  /**
   * Remove video plugins to the local peer video stream. Eg. Virtual Background, Face Filters etc.
   * Video plugins can be added/removed at any time after the video track is available.
   * @see HMSMediaStreamPlugin
   * @param plugins
   */
  removePluginsFromVideoStream(plugins: HMSMediaStreamPlugin[]): Promise<void>;

  /**
   * To check the support of the plugin, based on browser, os and audio devices
   * @param plugin HMSVideoPlugin
   * @see HMSPluginSupportResult
   */
  validateVideoPluginSupport(plugin: HMSVideoPlugin): HMSPluginSupportResult;

  /**
   * Add or remove a audio plugin from/to the local peer audio track. Eg. gain filter, noise suppression etc.
   * Audio plugins can be added/removed at any time after the audio track is available
   * @param plugin HMSAudioPlugin
   * @see HMSAudioPlugin
   */
  addPluginToAudioTrack(plugin: HMSAudioPlugin): Promise<void>;

  /**
   * To check the support of the plugin, based on browser, os and audio devices
   * @param plugin HMSAudioPlugin
   * @see HMSPluginSupportResult
   */
  validateAudioPluginSupport(plugin: HMSAudioPlugin): HMSPluginSupportResult;

  /**
   * @see addPluginToVideoTrack
   */
  removePluginFromVideoTrack(plugin: HMSVideoPlugin): Promise<void>;

  /**
   * @see addPluginToAudioTrack
   */
  removePluginFromAudioTrack(plugin: HMSAudioPlugin): Promise<void>;

  /**
   * Request for a role change of a remote peer. Can be forced.
   * @deprecated Use `changeRoleOfPeer`
   * @param forPeerId The remote peer id whose role needs to be changed
   * @param toRole The name of the new role.
   * @param [force] this being true would mean that user won't get a request to accept role change
   */
  changeRole(forPeerId: HMSPeerID, toRole: HMSRoleName, force?: boolean): Promise<void>;

  /**
   * Request for a role change of a remote peer. Can be forced.
   * @param forPeerId The remote peer id whose role needs to be changed
   * @param toRole The name of the new role.
   * @param [force] this being true would mean that user won't get a request to accept role change
   * @returns Promise<void> - resolves when the role is changed
   */
  changeRoleOfPeer(forPeerId: HMSPeerID, toRole: HMSRoleName, force?: boolean): Promise<void>;

  /**
   * Request for a role change of a remote peer. Can be forced.
   * @param roles List of roles whose role needs to be changed
   * @param toRole The name of the new role.
   * @returns Promise<void> - resolves when the role is changed
   */
  changeRoleOfPeersWithRoles(roles: HMSRoleName[], toRole: HMSRoleName): Promise<void>;

  /**
   * Accept the role change request received
   * @param {HMSRoleChangeRequest} request The original request that was received
   * @returns Promise<void> - resolves when the role is accepted
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
   * @returns Promise<void> - resolves when the track state is changed
   */
  setRemoteTrackEnabled(forRemoteTrackID: HMSTrackID | HMSTrackID[], enabled: boolean): Promise<void>;

  /**
   * Use this to mute/unmute multiple tracks by source, role or type
   * @param {HMSChangeMultiTrackStateParams} params
   * @returns Promise<void> - resolves when the track state is changed
   */
  setRemoteTracksEnabled(params: HMSChangeMultiTrackStateParams): Promise<void>;

  /**
   * Method to be called with some UI interaction after autoplay error is received
   * Most browsers have limitations where an audio can not be played if there was no user interaction.
   * SDK throws an autoplay error in this case, this method can be called after an UI interaction
   * to resolve the autoplay error
   * @returns Promise<void> - resolves when the autoplay error is resolved
   */
  unblockAudio: () => Promise<void>;

  /**
   * If you have the **endRoom** permission, you can end the room. That means everyone will be kicked out.
   * If lock is passed as true, the room cannot be used further.
   * @param lock boolean - true to lock the room
   * @param reason string - reason for ending the room
   * @returns Promise<void> - resolves when the room is ended
   */
  endRoom: (lock: boolean, reason: string) => Promise<void>;

  /**
   * After leave send feedback to backend for call quality purpose.
   * @param feedback HMSSessionFeedback - feedback object
   * @param eventEndpoint string - endpoint to send feedback
   * @returns Promise<void> - resolves when the feedback is submitted
   */
  submitSessionFeedback(feedback: HMSSessionFeedback, eventEndpoint?: string): Promise<void>;

  /**
   * If you have **removeOthers** permission, you can remove a peer from the room.
   * @param peerID peerID of the peer to be removed from the room
   * @param reason a string explaining why the peer is removed from the room.
   * This string could be used to notify the user before they're removed from the room
   * using the `REMOVED_FROM_ROOM` type of notification
   * @returns Promise<void> - resolves when the peer is removed
   */
  removePeer(peerID: HMSPeerID, reason: string): Promise<void>;

  /**
   * If you want to start RTMP streaming or recording.
   * @param params.meetingURL This is the meeting url which is opened in a headless chrome instance for streaming and recording.
   * Make sure this url leads the joiner straight to the room without any preview screen or requiring additional clicks.
   * @param params.RTMPURLs The list of ingest URLs where the call as visible in the meeting url should be streamed.
   * Optional, when not specified the method is used to just start the recording.
   * @param params.record If you want to start the recording or not.
   * @returns Promise<void> - resolves when the RTMP streaming and recording is started
   */
  startRTMPOrRecording(params: RTMPRecordingConfig): Promise<void>;

  /**
   * If you want to stop both RTMP streaming and recording.
   * @returns Promise<void> - resolves when the RTMP streaming and recording is stopped
   */
  stopRTMPAndRecording(): Promise<void>;

  /**
   * If you have configured HLS streaming from dashboard, no params are required.
   * otherwise @param params.variants.meetingURL This is the meeting url which is opened in a headless chrome instance for generating the HLS feed.
   * Make sure this url leads the joiner straight to the room without any preview screen or requiring additional clicks.
   * Note that streaming of only one url is currently supported and only the first variant passed will be honored.
   * @param params HLSConfig - HLSConfig object with the required fields
   * @returns Promise<void> - resolves when the HLS streaming is started
   */
  startHLSStreaming(params?: HLSConfig): Promise<void>;
  /**
   * If you want to stop HLS streaming. The passed in arguments is not considered at the moment, and everything related to HLS is stopped.
   * @param params HLSConfig - HLSConfig object with the required fields
   * @returns Promise<void> - resolves when the HLS streaming is stopped
   */
  stopHLSStreaming(params?: StopHLSConfig): Promise<void>;

  /**
   * If you want to start transcriptions(Closed Caption).
   * @param params.mode This is the mode which represent the type of transcription. Currently we have Caption mode only
   */
  startTranscription(params: TranscriptionConfig): Promise<void>;

  /**
   * If you want to stop transcriptions(Closed Caption).
   * @param params.mode This is the mode which represent the type of transcription you want to stop. Currently we have Caption mode only
   */
  stopTranscription(params: TranscriptionConfig): Promise<void>;

  /**
   * Used to define date range metadata in a media playlist.
   * This api adds EXT-X-DATERANGE tags to the media playlist.
   * It is useful for defining timed metadata for interstitial regions such as advertisements,
   * but can be used to define any timed metadata needed by your stream.
   * ```js
   * const metadataList = `[{
   *    payload: "some string 1",
   *    duration: 2
   *   },
   *   {
   *    payload: "some string 2",
   *    duration: 3
   * }]`
   * sendHLSTimedMetadata(metadataList);
   * ```
   */
  sendHLSTimedMetadata(metadataList: HLSTimedMetadata[]): Promise<void>;

  /**
   * If you want to update the name of peer.
   */
  changeName(name: string): Promise<void>;

  /**
   * If you want to update the metadata of local peer. If an object is passed, it should be serializable using
   * JSON.stringify.
   */
  changeMetadata(metadata: string | any): Promise<void>;

  /**
   * If you want to update the metadata of the session. If an object is passed, it should be serializable using
   * JSON.stringify.
   *
   * Session metadata is available to every peer in the room and is persisted throughout a session
   * till the last peer leaves a room
   *
   * @deprecated use `actions.sessionStore.set` instead
   */
  setSessionMetadata(metadata: any): Promise<void>;

  /**
   * Fetch the current room metadata from the server and populate it in store
   *
   * @deprecated use `actions.sessionStore.observe` instead
   */
  populateSessionMetadata(): Promise<void>;

  /**
   * Set the type of logs from the SDK you want to be logged in the browser console.
   *
   * Note that HMSLogLevel is decremental meaning,
   * - HMSLogLevel.VERBOSE(0) - will log every message from SDK.
   * - HMSLogLevel.DEBUG(1) - will log messages that are helpful in debugging, important info, warnings and errors.
   * - HMSLogLevel.INFO(2) - will log important info, warnings and errors.
   * - HMSLogLevel.WARN(3) - will log warnings and errors.
   * - HMSLogLevel.ERROR(4) - will log only errors.
   * - HMSLogLevel.NONE(5) - won't log anything(Not recommended).
   *
   * Usage: `hmsActions.setLogLevel(4)` or `hmsActions.setLogLevel(HMSlogLevel.ERROR)`.
   */
  setLogLevel(level: HMSLogLevel): void;

  /**
   * ignore messages with this type for storing in store. You can use this to have a clear segregation between
   * chat messages(you would want to persist for the duration of the call) and one off custom events(emoji reactions,
   * stop screenshare, moderator messages, etc.). You can also use this to store messages on your own side if some additional
   * processing is required(the default type is "chat").
   * Notifications for the ignored messages will still be sent, it'll only not be put in the store.
   * @param msgTypes list of messages types to ignore for storing
   * @param replace (default is false) whether to replace the list of ignored messages. Types are appended to the existing
   * list by default so you can call this method from different places and all will hold.
   */
  ignoreMessageTypes(msgTypes: string[], replace?: boolean): void;

  /**
   * audio Playlist contains all actions that can be performed on the audio playlist
   * This will be available after joining the room
   */
  audioPlaylist: IHMSPlaylistActions;
  /**
   * video Playlist contains all actions that can be performed on the video playlist
   * This will be available after joining the room
   */
  videoPlaylist: IHMSPlaylistActions;

  /**
   * @param data full app data object. use this to initialise app data in store.
   * App Data is a small space in the store for UI to keep a few non updating
   * global state fields for easy reference across UI.
   * Note that if the fields are updating at high frequency or there
   * are too many of them, it's recommended to have another UI side store
   * to avoid performance issues.
   */
  initAppData(data: Record<string, any>): void;
  /**
   * use it for updating a particular property in the appdata
   * @param key
   *          a string. Does not check for existence. If the key is already not
   *          a property of the appData, it is added.
   * @param value
   *          value to set for the key.
   * @param merge
   *          set it to true if you want to merge the appdata.
   *          - Always replaces the value for a given key if this parameter is
   *            not explicitly set to true.
   *          - Always replaces if the value is anything other
   *            than a plain object (i.e) JSON.parse()able.
   *          - If set to true on non-plain objects, this is ignored.
   * @example
   * assume appData is initially
   *  `{
   *     mySettings: {
   *       setting1: 'val1',
   *       setting2: 'val2',
   *     },
   *     mySettings2: 43,
   *     mySettings3: false,
   *   };`
   *
   * after calling,
   * `setAppData("mySettings", {setting1:'val1-edit', setting3:'val3'}, true);`
   * it becomes
   *  `{
   *     mySettings: {
   *       setting1: 'val1-edit',
   *       setting2: 'val2',
   *       setting3: 'val3',
   *     },
   *     mySettings2: 43,
   *     mySettings3: false,
   *   };`
   *
   * Note: This is not suitable for keeping large data or data which updates
   * at a high frequency, it is recommended to use app side store for those
   * cases.
   **/
  setAppData(key: string, value: Record<string | number, any>, merge?: boolean): void;
  setAppData(key: string, value: any): void;

  /**
   * @param trackId
   * pass the trackId from store (for instance, peer.audioTrack) for which you want the native MediaStreamTrack instance.
   * Be cautious when using this and modifying the underlying MediastreamTrack.
   * Note: In case of local peer, the native audio track will change the first time it is unmuted.
   * In case of video track, the native track changes everytime you mute/unmute.
   * Be cautious when using this. This will not be needed unless you want to do some extra processing on the audio/video tracks.
   * We recommend using our plugins for the same instead
   */
  getNativeTrackById(trackId: string): MediaStreamTrack | undefined;

  /**
   * Get the track object by trackId
   * @param trackId string - ID of the track
   * @returns HMSTrack | undefined - track object
   */
  getTrackById(trackId: string): HMSTrack | undefined;

  /**
   * Get the auth token for the room code. This is useful when you want to join a room using a room code.
   * @param tokenRequest - token request object
   * @param tokenRequestOptions - token request options
   */
  getAuthTokenByRoomCode(tokenRequest: TokenRequest, tokenRequestOptions?: TokenRequestOptions): Promise<string>;

  /**
   * enable sending audio speaker data to beam
   * @returns Promise<void> - resolves when the speaker data is enabled
   */
  enableBeamSpeakerLabelsLogging(): Promise<void>;

  /**
   * actions that can be performed on the real-time key-value store
   *
   * Values in the session store are available to every peer in the room(who have observed the relevant keys) and
   * is persisted throughout a session till the last peer leaves a room(cleared after the last peer leaves the room)
   */
  sessionStore: IHMSSessionStoreActions<T['sessionStore']>;

  /**
   * interactivityCenter contains all actions that can be performed on the interactivity center
   * This will be available after joining the room
   */
  interactivityCenter: IHMSInteractivityCenter;

  /**
   * raise hand for local peer
   * @returns Promise<void> - resolves when the hand is raised
   */
  raiseLocalPeerHand(): Promise<void>;

  /**
   * lower hand for local peer
   * @returns Promise<void> - resolves when the hand is lowered
   */
  lowerLocalPeerHand(): Promise<void>;

  /**
   * raise hand for remote peer
   * @param peerId string - ID of the peer
   * @returns Promise<void> - resolves when the hand is raised
   */
  raiseRemotePeerHand(peerId: string): Promise<void>;

  /**
   * lower hand for remote peer
   * @param peerId string - ID of the peer
   * @returns Promise<void> - resolves when the hand is lowered
   */
  lowerRemotePeerHand(peerId: string): Promise<void>;

  /**
   * get the list of peers in the room
   * @see https://www.100ms.live/docs/react-native/v2/how-to-guides/interact-with-room/peer/large-room
   * @param options HMSPeerListIteratorOptions - options for the peer list iterator
   * @returns HMSPeerListIterator - iterator for the peer list
   */
  getPeerListIterator(options?: HMSPeerListIteratorOptions): HMSPeerListIterator;

  /**
   * get the peer object by peerId
   * @param peerId string - ID of the peer
   * @returns Promise<HMSPeer | undefined> - resolves with the peer object
   */
  getPeer(peerId: string): Promise<HMSPeer | undefined>;
  findPeerByName(options: FindPeerByNameRequestParams): Promise<{ offset: number; eof?: boolean; peers: HMSPeer[] }>;
  /**
   * Method to override the default settings for playlist tracks
   * @param {HMSPlaylistSettings} settings
   */
  setPlaylistSettings(settings: HMSPlaylistSettings): void;

  /**
   * Method to initialize diagnostics. Should only be called after joining.
   */
  initDiagnostics(): HMSDiagnosticsInterface;

  /**
   * @internal
   * Method to get enabled flags and endpoints. Should only be called after joining.
   */
  getDebugInfo(): DebugInfo | undefined;

  /**
   * @internal
   * Method to check if received bitrate is 0 for all remote peers or whether the room has whiteboard/quiz running. To be used by beam.
   */
  hasActiveElements(hmsStats: HMSStats): boolean;

  /**
   * An optional delay to add between earpiece and speakerphone selection
   * Call this after preview or join is successful
   * @param delay in ms
   */
  autoSelectAudioOutput(delay?: number): Promise<void>;
}
