/*
 * HMSErrors.ts
 *
 * Created by codegen
 * Copyright © 2021 100ms. All rights reserved.
 */

export interface CodeMessage {
  code: number;
  messageTemplate: string;
  requiresAction: boolean;
  requiresErrorInfo: boolean;
}

const HMSErrors = {
  /* Connection Errors */

  // Generic error
  GenericConnect: {
    code: 1000,
    messageTemplate: `Something went wrong`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // Auth token is missing
  MissingToken: {
    code: 1001,
    messageTemplate: `Auth token is missing`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // Token is not in proper JWT format
  InvalidTokenFormat: {
    code: 1002,
    messageTemplate: `This auth token format is not supported`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // Token is missing room id parameter
  TokenMissingRoomId: {
    code: 1003,
    messageTemplate: `Auth token is missing room id field`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // SDK cannot establish websocket connection
  NetworkUnavailable: {
    code: 1004,
    messageTemplate: `Could not connect. Please check your internet connection and try again`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // Token is not authorised/expired
  TokenNotAuthorised: {
    code: 1005,
    messageTemplate: `Auth token is not valid`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // Endpoint url is malformed
  InvalidEndpointUrl: {
    code: 1006,
    messageTemplate: `Endpoint URL is invalid`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // Endpoint is not responding
  EndpointUnreachable: {
    code: 1007,
    messageTemplate: `Endpoint is not reachable`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // Signalling websocket connection failed / RTC Peer connection failed
  ConnectionLost: {
    code: 1008,
    messageTemplate: `Connection to server is lost. {error_info}`,
    requiresAction: false,
    requiresErrorInfo: true,
  },
  /* Local Stream Errors */

  // Generic error
  GenericStream: {
    code: 2000,
    messageTemplate: `Something went wrong`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // Both publish audio/video is off nothing to return
  NothingToReturn: {
    code: 2001,
    messageTemplate: `There is no media to return. Please select either video or audio or both`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // Trying to change codec on the fly
  CodecChangeNotPermitted: {
    code: 2002,
    messageTemplate: `Codec can't be changed mid call`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // Trying to change publish video/audio mid call
  PublishSettingsCantBeChanged: {
    code: 2003,
    messageTemplate: `Publish options can't be changed mid call`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // User denied permission to access capture device
  CantAccessCaptureDevice: {
    code: 2004,
    messageTemplate: `No permission to access capture device`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // WEB: Capture device is no longer available (usb cam is not connected)
  DeviceNotAvailable: {
    code: 2005,
    messageTemplate: `Capture device is no longer available`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // WEB: Capture device is in use by another application
  DeviceInUse: {
    code: 2006,
    messageTemplate: `Capture device is in use by another application`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  /* Room Join/Leave Errors */

  // Generic error
  GenericJoin: {
    code: 3000,
    messageTemplate: `Something went wrong`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // Unknown room id
  UnkownRoom: {
    code: 3001,
    messageTemplate: `This room id is not recongnised.`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // Already joined
  AlreadyJoined: {
    code: 3002,
    messageTemplate: `You have already joined this room.`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // Max room participants reached
  RoomParticipantLimitReached: {
    code: 3004,
    messageTemplate: `You can't join this room because it is already full.`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  /* Room Actions Errors */

  // Generic error
  GenericAction: {
    code: 4100,
    messageTemplate: `[{action}]: Something went wrong`,
    requiresAction: true,
    requiresErrorInfo: false,
  },
  // Has not joined the room
  NotInTheRoom: {
    code: 4101,
    messageTemplate: `[{action}]: You need to join the room before you can publish.`,
    requiresAction: true,
    requiresErrorInfo: false,
  },
  // Malformed server response (i.e sdp missing)
  InvalidServerResponse: {
    code: 4102,
    messageTemplate: `[{action}]: Unknown server response. {error_info} `,
    requiresAction: true,
    requiresErrorInfo: true,
  },
  // Failed to establish RTCPeerConnection
  PeerConnectionFailed: {
    code: 4103,
    messageTemplate: `[{action}]: Could not establish a peer connection. {error_info} `,
    requiresAction: true,
    requiresErrorInfo: true,
  },
  // Can't unpublish a stream that is not published
  UnpublishCalledBeforePublish: {
    code: 4104,
    messageTemplate: `Can't unpublish a stream that is not published`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  /* Generic Errors */

  // Not connected
  NotConnected: {
    code: 5000,
    messageTemplate: `Client is not connected`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
  // Generic signalling error. I.e server is returning error response to some command but the SDK doesn't know how to handle.
  Signalling: {
    code: 5001,
    messageTemplate: `Unknown signalling error: {action} {error_info} `,
    requiresAction: true,
    requiresErrorInfo: true,
  },
  // Generic SDK error. Some unforseen exception happened.
  Unknown: {
    code: 5002,
    messageTemplate: `Unknown exception: {error_info}`,
    requiresAction: false,
    requiresErrorInfo: true,
  },
  // Webrtc stack not initialised yet
  NotReady: {
    code: 5003,
    messageTemplate: `WebRTC engine is not ready yet`,
    requiresAction: false,
    requiresErrorInfo: false,
  },
};

export default HMSErrors;
