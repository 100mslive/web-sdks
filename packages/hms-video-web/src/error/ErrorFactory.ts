/*
 * ErrorFactory.ts
 *
 * Created by codegen
 * Copyright © 2021 100ms. All rights reserved.
 */

import HMSException from './HMSException';

export enum HMSAction {
  TRACK = 'TRACK',
  INIT = 'INIT',
  PUBLISH = 'PUBLISH',
  UNPUBLISH = 'UNPUBLISH',
  JOIN = 'JOIN',
  SUBSCRIBE = 'SUBSCRIBE',
  DATA_CHANNEL_SEND = 'DATA_CHANNEL_SEND',
}

export const ErrorFactory = {
  WebSocketConnectionErrors: {
    GenericConnect(action: HMSAction, description: string = '') {
      return new HMSException(1000, 'GenericConnect', action.toString(), 'Something went wrong', description);
    },

    WebSocketConnectionLost(action: HMSAction, description: string = '') {
      return new HMSException(
        1003,
        'WebSocketConnectionLost',
        action.toString(),
        'Network connection lost ',
        description,
      );
    },
  },

  InitAPIErrors: {
    ServerErrors(action: HMSAction, description: string = '') {
      return new HMSException(2000, 'ServerErrors', action.toString(), '[INIT]: Server error', description);
    },

    HTTPConnectionLost(action: HMSAction, description: string = '') {
      return new HMSException(2001, 'HTTPConnectionLost', action.toString(), '[INIT]: Network error', description);
    },

    HTTPError(code: number, action: HMSAction, description: string = '') {
      return new HMSException(2400 + code, 'HTTPError', action.toString(), 'Bad Request', description);
    },

    InvalidEndpointURL(action: HMSAction, description: string = '') {
      return new HMSException(2002, 'InvalidEndpointURL', action.toString(), 'Endpoint URL is invalid', description);
    },

    EndpointUnreachable(action: HMSAction, description: string = '') {
      return new HMSException(
        2003,
        'EndpointUnreachable',
        action.toString(),
        'Endpoint is not reachable.',
        description,
      );
    },

    InvalidTokenFormat(action: HMSAction, description: string = '') {
      return new HMSException(
        2004,
        'InvalidTokenFormat',
        action.toString(),
        'Token is not in proper JWT format',
        description,
      );
    },
  },

  TracksErrors: {
    GenericTrack(action: HMSAction, description: string = '') {
      return new HMSException(3000, 'GenericTrack', action.toString(), '[PUBLISH]: Something went wrong', description);
    },

    CantAccessCaptureDevice(action: HMSAction, deviceInfo: string, description: string = '') {
      return new HMSException(
        3001,
        'CantAccessCaptureDevice',
        action.toString(),
        '[PUBLISH]: No permission to access capture device - {device_type}'.replace('{device_type}', deviceInfo),
        description,
      );
    },

    DeviceNotAvailable(action: HMSAction, description: string = '') {
      return new HMSException(
        3002,
        'DeviceNotAvailable',
        action.toString(),
        '[PUBLISH]: Capture device is no longer available',
        description,
      );
    },

    DeviceInUse(action: HMSAction, description: string = '') {
      return new HMSException(
        3003,
        'DeviceInUse',
        action.toString(),
        '[PUBLISH]: Capture device is in use by another application',
        description,
      );
    },

    DeviceLostMidway(action: HMSAction, description: string = '') {
      return new HMSException(
        3008,
        'DeviceLostMidway',
        action.toString(),
        'Lost access to capture device midway',
        description,
      );
    },

    NothingToReturn(action: HMSAction, description: string = '') {
      return new HMSException(
        3005,
        'NothingToReturn',
        action.toString(),
        'There is no media to return. Please select either video or audio or both.',
        description,
      );
    },

    InvalidVideoSettings(action: HMSAction, description: string = '') {
      return new HMSException(
        3006,
        'InvalidVideoSettings',
        action.toString(),
        'Cannot enable simulcast when no video settings are provided',
        description,
      );
    },

    CodecChangeNotPermitted(action: HMSAction, description: string = '') {
      return new HMSException(
        3007,
        'CodecChangeNotPermitted',
        action.toString(),
        "Codec can't be changed mid call.",
        description,
      );
    },
  },

  WebrtcErrors: {
    CreateOfferFailed(action: HMSAction, description: string = '') {
      return new HMSException(
        4001,
        'CreateOfferFailed',
        action.toString(),
        '[{action}]: Failed to create offer. '.replace('{action}', action.toString()),
        description,
      );
    },

    CreateAnswerFailed(action: HMSAction, description: string = '') {
      return new HMSException(
        4002,
        'CreateAnswerFailed',
        action.toString(),
        '[{action}]: Failed to create answer. '.replace('{action}', action.toString()),
        description,
      );
    },

    SetLocalDescriptionFailed(action: HMSAction, description: string = '') {
      return new HMSException(
        4003,
        'SetLocalDescriptionFailed',
        action.toString(),
        '[{action}]: Failed to set offer. '.replace('{action}', action.toString()),
        description,
      );
    },

    SetRemoteDescriptionFailed(action: HMSAction, description: string = '') {
      return new HMSException(
        4004,
        'SetRemoteDescriptionFailed',
        action.toString(),
        '[{action}]: Failed to set answer. '.replace('{action}', action.toString()),
        description,
      );
    },

    ICEFailure(action: HMSAction, description: string = '') {
      return new HMSException(
        4005,
        'ICEFailure',
        action.toString(),
        '[{action}]: Ice connection state FAILED'.replace('{action}', action.toString()),
        description,
      );
    },
  },

  JoinErrors: {
    ServerErrors(code: number, action: HMSAction, description: string) {
      return new HMSException(
        5000 + code,
        'ServerErrors',
        action.toString(),
        '[JOIN]: {server_error}'.replace('{server_error}', description),
        description,
      );
    },

    AlreadyJoined(action: HMSAction, description: string = '') {
      return new HMSException(
        5001,
        'AlreadyJoined',
        action.toString(),
        '[JOIN]: You have already joined this room.',
        description,
      );
    },
  },

  GenericErrors: {
    NotConnected(action: HMSAction, description: string = '') {
      return new HMSException(6000, 'NotConnected', action.toString(), 'Client is not connected', description);
    },

    Signalling(action: HMSAction, description: string) {
      return new HMSException(
        6001,
        'Signalling',
        action.toString(),
        'Unknown signalling error: {action} {error_info} '
          .replace('{action}', action.toString())
          .replace('{error_info}', description),
        description,
      );
    },

    Unknown(action: HMSAction, description: string) {
      return new HMSException(
        6002,
        'Unknown',
        action.toString(),
        'Unknown exception: {error_info}'.replace('{error_info}', description),
        description,
      );
    },

    NotReady(action: HMSAction, description: string = '') {
      return new HMSException(6003, 'NotReady', action.toString(), 'WebRTC engine is not ready yet', description);
    },

    JsonParsingFailed(action: HMSAction, jsonMessage: string, description: string = '') {
      return new HMSException(
        6004,
        'JsonParsingFailed',
        action.toString(),
        'Failed to parse JSON message - {json_message}'.replace('{json_message}', jsonMessage),
        description,
      );
    },
  },
};
