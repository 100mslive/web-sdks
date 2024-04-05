/*
 * ErrorFactory.ts
 *
 * Created by codegen
 * Copyright © 2021 100ms. All rights reserved.
 */

import { ErrorCodes } from './ErrorCodes';
import { HMSAction } from './HMSAction';
import { HMSException } from './HMSException';
import { HMSSignalMethod } from '../signal/jsonrpc/models';

const terminalActions: (HMSSignalMethod | HMSAction)[] = [
  HMSSignalMethod.JOIN,
  HMSSignalMethod.OFFER,
  HMSSignalMethod.ANSWER,
  HMSSignalMethod.TRICKLE,
  HMSSignalMethod.SERVER_ERROR,
  HMSAction.JOIN,
];

export const ErrorFactory = {
  WebSocketConnectionErrors: {
    FailedToConnect(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.WebSocketConnectionErrors.FAILED_TO_CONNECT,
        'WebsocketFailedToConnect',
        action,
        `[WS]: ${description}`,
        `[WS]: ${description}`,
      );
    },

    WebSocketConnectionLost(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.WebSocketConnectionErrors.WEBSOCKET_CONNECTION_LOST,
        'WebSocketConnectionLost',
        action,
        `Network connection lost`,
        description,
      );
    },

    AbnormalClose(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.WebSocketConnectionErrors.ABNORMAL_CLOSE,
        'WebSocketAbnormalClose',
        action,
        `Websocket closed abnormally`,
        description,
      );
    },
  },

  APIErrors: {
    ServerErrors(code: number, action: HMSAction, description = '', isTerminal = true) {
      return new HMSException(
        code,
        'ServerErrors',
        action,
        `[${action}]: Server error ${description}`,
        description,
        isTerminal,
      );
    },

    EndpointUnreachable(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.APIErrors.ENDPOINT_UNREACHABLE,
        'EndpointUnreachable',
        action,
        `Endpoint is not reachable - ${description}`,
        description,
      );
    },

    InvalidTokenFormat(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.APIErrors.INVALID_TOKEN_FORMAT,
        'InvalidTokenFormat',
        action,
        `Token is not in proper JWT format - ${description}`,
        description,
        true,
      );
    },

    InitConfigNotAvailable(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.APIErrors.INIT_CONFIG_NOT_AVAILABLE,
        'InitError',
        action,
        `[INIT]: ${description}`,
        `[INIT]: ${description}`,
      );
    },
  },

  TracksErrors: {
    GenericTrack(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.TracksErrors.GENERIC_TRACK,
        'GenericTrack',
        action,
        `[TRACK]: ${description}`,
        `[TRACK]: ${description}`,
      );
    },

    CantAccessCaptureDevice(action: HMSAction, deviceInfo: string, description = '') {
      return new HMSException(
        ErrorCodes.TracksErrors.CANT_ACCESS_CAPTURE_DEVICE,
        'CantAccessCaptureDevice',
        action,
        `User denied permission to access capture device - ${deviceInfo}`,
        description,
      );
    },

    DeviceNotAvailable(action: HMSAction, deviceInfo: string, description = '') {
      return new HMSException(
        ErrorCodes.TracksErrors.DEVICE_NOT_AVAILABLE,
        'DeviceNotAvailable',
        action,
        `[TRACK]: Capture device is no longer available - ${deviceInfo}`,
        description,
      );
    },

    DeviceInUse(action: HMSAction, deviceInfo: string, description = '') {
      return new HMSException(
        ErrorCodes.TracksErrors.DEVICE_IN_USE,
        'DeviceInUse',
        action,
        `[TRACK]: Capture device is in use by another application - ${deviceInfo}`,
        description,
      );
    },

    DeviceLostMidway(action: HMSAction, deviceInfo: string, description = '') {
      return new HMSException(
        ErrorCodes.TracksErrors.DEVICE_LOST_MIDWAY,
        'DeviceLostMidway',
        action,
        `Lost access to capture device midway - ${deviceInfo}`,
        description,
      );
    },

    NothingToReturn(
      action: HMSAction,
      description = '',
      message = `There is no media to return. Please select either video or audio or both.`,
    ) {
      return new HMSException(
        ErrorCodes.TracksErrors.NOTHING_TO_RETURN,
        'NothingToReturn',
        action,
        message,
        description,
      );
    },

    InvalidVideoSettings(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.TracksErrors.INVALID_VIDEO_SETTINGS,
        'InvalidVideoSettings',
        action,
        `Cannot enable simulcast when no video settings are provided`,
        description,
      );
    },

    AutoplayBlocked(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.TracksErrors.AUTOPLAY_ERROR,
        'AutoplayBlocked',
        action,
        "Autoplay blocked because the user didn't interact with the document first",
        description,
      );
    },

    CodecChangeNotPermitted(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.TracksErrors.CODEC_CHANGE_NOT_PERMITTED,
        'CodecChangeNotPermitted',
        action,
        `Codec can't be changed mid call.`,
        description,
      );
    },

    OverConstrained(action: HMSAction, deviceInfo: string, description = '') {
      return new HMSException(
        ErrorCodes.TracksErrors.OVER_CONSTRAINED,
        'OverConstrained',
        action,
        `[TRACK]: Requested constraints cannot be satisfied with the device hardware - ${deviceInfo}`,
        description,
      );
    },

    NoAudioDetected(action: HMSAction, description = 'Please check the mic or use another audio input') {
      return new HMSException(
        ErrorCodes.TracksErrors.NO_AUDIO_DETECTED,
        'NoAudioDetected',
        action,
        'No audio input detected from microphone',
        description,
      );
    },

    SystemDeniedPermission(action: HMSAction, deviceInfo: string, description = '') {
      return new HMSException(
        ErrorCodes.TracksErrors.SYSTEM_DENIED_PERMISSION,
        'SystemDeniedPermission',
        action,
        `Operating System denied permission to access capture device - ${deviceInfo}`,
        description,
      );
    },

    CurrentTabNotShared() {
      return new HMSException(
        ErrorCodes.TracksErrors.CURRENT_TAB_NOT_SHARED,
        'CurrentTabNotShared',
        HMSAction.TRACK,
        'The app requires you to share the current tab',
        'You must screen share the current tab in order to proceed',
      );
    },

    AudioPlaybackError(description: string) {
      return new HMSException(
        ErrorCodes.TracksErrors.AUDIO_PLAYBACK_ERROR,
        'Audio playback error',
        HMSAction.TRACK,
        description,
        description,
      );
    },

    SelectedDeviceMissing(deviceType: string) {
      return new HMSException(
        ErrorCodes.TracksErrors.SELECTED_DEVICE_MISSING,
        'SelectedDeviceMissing',
        HMSAction.TRACK,
        `Could not detect selected ${deviceType} device`,
        `Please check connection to the ${deviceType} device`,
        false,
      );
    },
  },

  WebrtcErrors: {
    CreateOfferFailed(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.WebrtcErrors.CREATE_OFFER_FAILED,
        'CreateOfferFailed',
        action,
        `[${action.toString()}]: Failed to create offer. `,
        description,
      );
    },

    CreateAnswerFailed(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.WebrtcErrors.CREATE_ANSWER_FAILED,
        'CreateAnswerFailed',
        action,
        `[${action.toString()}]: Failed to create answer. `,
        description,
      );
    },

    SetLocalDescriptionFailed(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.WebrtcErrors.SET_LOCAL_DESCRIPTION_FAILED,
        'SetLocalDescriptionFailed',
        action,
        `[${action.toString()}]: Failed to set offer. `,
        description,
      );
    },

    SetRemoteDescriptionFailed(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.WebrtcErrors.SET_REMOTE_DESCRIPTION_FAILED,
        'SetRemoteDescriptionFailed',
        action,
        `[${action.toString()}]: Failed to set answer. `,
        description,
        true,
      );
    },

    ICEFailure(action: HMSAction, description = '', isTerminal = false) {
      return new HMSException(
        ErrorCodes.WebrtcErrors.ICE_FAILURE,
        'ICEFailure',
        action,
        `[${action.toString()}]: Ice connection state FAILED`,
        description,
        isTerminal,
      );
    },

    ICEDisconnected(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.WebrtcErrors.ICE_DISCONNECTED,
        'ICEDisconnected',
        action,
        `[${action.toString()}]: Ice connection state DISCONNECTED`,
        description,
      );
    },

    StatsFailed(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.WebrtcErrors.STATS_FAILED,
        'StatsFailed',
        action,
        `Failed to WebRTC get stats - ${description}`,
        description,
      );
    },
  },

  WebsocketMethodErrors: {
    ServerErrors(code: number, action: HMSAction | HMSSignalMethod, description: string) {
      return new HMSException(code, 'ServerErrors', action, description, description, terminalActions.includes(action));
    },

    AlreadyJoined(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.WebsocketMethodErrors.ALREADY_JOINED,
        'AlreadyJoined',
        action,
        `[JOIN]: You have already joined this room.`,
        description,
      );
    },

    CannotJoinPreviewInProgress(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.WebsocketMethodErrors.CANNOT_JOIN_PREVIEW_IN_PROGRESS,
        'CannotJoinPreviewInProgress',
        action,
        `[JOIN]: Cannot join if preview is in progress`,
        description,
      );
    },
  },

  GenericErrors: {
    NotConnected(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.GenericErrors.NOT_CONNECTED,
        'NotConnected',
        action,
        `Client is not connected`,
        description,
      );
    },

    Signalling(action: HMSAction, description: string) {
      return new HMSException(
        ErrorCodes.GenericErrors.SIGNALLING,
        'Signalling',
        action,
        `Unknown signalling error: ${action.toString()} ${description} `,
        description,
      );
    },

    Unknown(action: HMSAction, description: string) {
      return new HMSException(
        ErrorCodes.GenericErrors.UNKNOWN,
        'Unknown',
        action,
        `Unknown exception: ${description}`,
        description,
      );
    },

    NotReady(action: HMSAction, description = '') {
      return new HMSException(ErrorCodes.GenericErrors.NOT_READY, 'NotReady', action, description, description);
    },

    JsonParsingFailed(action: HMSAction, jsonMessage: string, description = '') {
      return new HMSException(
        ErrorCodes.GenericErrors.JSON_PARSING_FAILED,
        'JsonParsingFailed',
        action,
        `Failed to parse JSON message - ${jsonMessage}`,
        description,
      );
    },

    TrackMetadataMissing(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.GenericErrors.TRACK_METADATA_MISSING,
        'TrackMetadataMissing',
        action,
        `Track Metadata Missing`,
        description,
      );
    },

    RTCTrackMissing(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.GenericErrors.RTC_TRACK_MISSING,
        'RTCTrackMissing',
        action,
        `RTC Track missing`,
        description,
      );
    },

    PeerMetadataMissing(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.GenericErrors.PEER_METADATA_MISSING,
        'PeerMetadataMissing',
        action,
        `Peer Metadata Missing`,
        description,
      );
    },

    ValidationFailed(message: string, entity?: any) {
      return new HMSException(
        ErrorCodes.GenericErrors.VALIDATION_FAILED,
        'ValidationFailed',
        HMSAction.VALIDATION,
        message,
        entity ? JSON.stringify(entity) : '',
      );
    },

    InvalidRole(action: HMSAction, description: string) {
      return new HMSException(
        ErrorCodes.GenericErrors.INVALID_ROLE,
        'InvalidRole',
        action,
        `Invalid role. Join with valid role`,
        description,
        true,
      );
    },

    PreviewAlreadyInProgress(action: HMSAction, description = '') {
      return new HMSException(
        ErrorCodes.GenericErrors.PREVIEW_IN_PROGRESS,
        'PreviewAlreadyInProgress',
        action,
        `[Preview]: Cannot join if preview is in progress`,
        description,
      );
    },

    LocalStorageAccessDenied(description = 'Access to localStorage has been denied') {
      return new HMSException(
        ErrorCodes.GenericErrors.LOCAL_STORAGE_ACCESS_DENIED,
        'LocalStorageAccessDenied',
        HMSAction.NONE,
        `LocalStorageAccessDenied`,
        description,
      );
    },

    MissingMediaDevices() {
      return new HMSException(
        ErrorCodes.GenericErrors.MISSING_MEDIADEVICES,
        'MissingMediaDevices',
        HMSAction.JOIN,
        `navigator.mediaDevices is undefined. 100ms SDK won't work on this website as WebRTC is not supported on HTTP endpoints(missing navigator.mediaDevices). Please ensure you're using the SDK either on localhost or a valid HTTPS endpoint.`,
        '',
        true,
      );
    },

    MissingRTCPeerConnection() {
      return new HMSException(
        ErrorCodes.GenericErrors.MISSING_RTCPEERCONNECTION,
        'MissingRTCPeerConnection',
        HMSAction.JOIN,
        `RTCPeerConnection which is a core requirement for WebRTC call was not found, this could be due to an unsupported browser or browser extensions blocking WebRTC`,
        '',
        true,
      );
    },
  },

  MediaPluginErrors: {
    PlatformNotSupported(action: HMSAction, description = '') {
      return new HMSException(
        7001,
        'PlatformNotSupported',
        action,
        'Check HMS Docs to see the list of supported platforms',
        description,
      );
    },

    InitFailed(action: HMSAction, description = '') {
      return new HMSException(7002, 'InitFailed', action, 'Plugin init failed', description);
    },

    ProcessingFailed(action: HMSAction, description = '') {
      return new HMSException(7003, 'ProcessingFailed', action, 'Plugin processing failed', description);
    },

    AddAlreadyInProgress(action: HMSAction, description = '') {
      return new HMSException(7004, 'AddAlreadyInProgress', action, 'Plugin add already in progress', description);
    },

    DeviceNotSupported(action: HMSAction, description = '') {
      return new HMSException(
        7005,
        'DeviceNotSupported',
        action,
        'Check HMS Docs to see the list of supported devices',
        description,
      );
    },
  },

  PlaylistErrors: {
    NoEntryToPlay(action: HMSAction, description: string) {
      return new HMSException(
        ErrorCodes.PlaylistErrors.NO_ENTRY_TO_PLAY,
        'NoEntryToPlay',
        action,
        'Reached end of playlist',
        description,
      );
    },
    NoEntryPlaying(action: HMSAction, description: string) {
      return new HMSException(
        ErrorCodes.PlaylistErrors.NO_ENTRY_IS_PLAYING,
        'NoEntryIsPlaying',
        action,
        'No entry is playing at this time',
        description,
      );
    },
  },
};
