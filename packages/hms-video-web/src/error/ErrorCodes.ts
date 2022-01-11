/*
 * ErrorCodes.ts
 *
 * Created by codegen
 * Copyright © 2021 100ms. All rights reserved.
 */

export const ErrorCodes = {
  WebSocketConnectionErrors: {
    // Error connecting to ws or init config not available
    GENERIC_CONNECT: 1000,

    // Network connection lost
    WEBSOCKET_CONNECTION_LOST: 1003,
  },

  InitAPIErrors: {
    // [INIT]: Server error
    SERVER_ERRORS: 2000,
    //init config not available
    INIT_CONFIG_NOT_AVAILABLE: 2002,

    // Endpoint is not reachable.
    ENDPOINT_UNREACHABLE: 2003,

    // Token is not in proper JWT format
    INVALID_TOKEN_FORMAT: 2004,
  },

  TracksErrors: {
    // [PUBLISH]: Error with getusermedia request
    GENERIC_TRACK: 3000,

    // [PUBLISH]: No permission to access capture device - {device_type}
    CANT_ACCESS_CAPTURE_DEVICE: 3001,

    // [PUBLISH]: Capture device is no longer available - {device_type}
    DEVICE_NOT_AVAILABLE: 3002,

    // [PUBLISH]: Capture device is in use by another application - {device_type}
    DEVICE_IN_USE: 3003,

    // Lost access to capture device midway - {device_type}
    DEVICE_LOST_MIDWAY: 3008,

    // There is no media to return. Please select either video or audio or both.
    NOTHING_TO_RETURN: 3005,

    // Cannot enable simulcast when no video settings are provided
    INVALID_VIDEO_SETTINGS: 3006,

    // Codec can't be changed mid call.
    CODEC_CHANGE_NOT_PERMITTED: 3007,

    // When the browser throws autoplay exception if something is played before interacting
    AUTOPLAY_ERROR: 3008,

    // Over constrained error - device hardware unable to satisfy requested constraints
    OVER_CONSTRAINED: 3009,
  },

  WebrtcErrors: {
    // [{action}]: Failed to create offer.
    CREATE_OFFER_FAILED: 4001,

    // [{action}]: Failed to create answer.
    CREATE_ANSWER_FAILED: 4002,

    // [{action}]: Failed to set offer.
    SET_LOCAL_DESCRIPTION_FAILED: 4003,

    // [{action}]: Failed to set answer.
    SET_REMOTE_DESCRIPTION_FAILED: 4004,

    // [{action}]: Ice connection state FAILED
    ICE_FAILURE: 4005,
  },

  WebsocketMethodErrors: {
    // [JOIN]: {server_error}
    SERVER_ERRORS: 5000,

    // [JOIN]: You have already joined this room.
    ALREADY_JOINED: 5001,

    // [JOIN]: Cannot join if preview is in progress
    CANNOT_JOIN_PREVIEW_IN_PROGRESS: 5002,
  },

  GenericErrors: {
    // Client is not connected
    NOT_CONNECTED: 6000,

    // Unknown signalling error: {action} {error_info}
    SIGNALLING: 6001,

    // Unknown exception: {error_info}
    UNKNOWN: 6002,

    // WebRTC engine is not ready yet
    NOT_READY: 6003,

    // Failed to parse JSON message - {json_message}
    JSON_PARSING_FAILED: 6004,

    // Track Metadata Missing
    TRACK_METADATA_MISSING: 6005,

    // RTC Track missing
    RTC_TRACK_MISSING: 6006,

    // Peer Metadata Missing
    PEER_METADATA_MISSING: 6007,

    // Joined with invalid role
    INVALID_ROLE: 6008,

    PREVIEW_IN_PROGRESS: 6009,

    MISSING_MEDIADEVICES: 6010,
  },

  PlaylistErrors: {
    NO_ENTRY_TO_PLAY: 8001,
    NO_ENTRY_IS_PLAYING: 8002,
  },
};
