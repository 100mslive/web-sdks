import { HMSPeerStats, HMSStatsStore, HMSTrackStats } from '../..';

export let localPeerStats: HMSPeerStats;
export let localVideoTrackStats: HMSTrackStats;
export let localAudioTrackStats: HMSTrackStats;
export let remoteVideoTrackStats: HMSTrackStats;
export let remoteAudioTrackStats: HMSTrackStats;

export const makeFakeInternalsStore = (): HMSStatsStore => {
  const fakeInternalsStore = {
    localPeer: {
      id: '1',
      videoTrack: '101',
      audioTrack: '102',
    },
    peerStats: {
      '1': {
        publish: {
          id: 'RTCIceCandidatePair_A0fSQWW9_PhswlWnB',
          timestamp: 1639819837327.096,
          type: 'candidate-pair',
          transportId: 'RTCTransport_0_1',
          localCandidateId: 'RTCIceCandidate_A0fSQWW9',
          remoteCandidateId: 'RTCIceCandidate_PhswlWnB',
          state: 'succeeded',
          priority: 7241540809789538000,
          nominated: true,
          writable: true,
          packetsSent: 6138,
          packetsReceived: 0,
          bytesSent: 3024747,
          bytesReceived: 0,
          totalRoundTripTime: 3.273,
          currentRoundTripTime: 0.255,
          availableOutgoingBitrate: 98148,
          requestsReceived: 2,
          requestsSent: 2,
          responsesReceived: 36,
          responsesSent: 2,
          consentRequestsSent: 37,
          packetsDiscardedOnSend: 0,
          bytesDiscardedOnSend: 0,
          bitrate: 98081.35079179265,
        },
        subscribe: {
          id: 'RTCIceCandidatePair_FHF2+YRh_VYCacrMy',
          timestamp: 1639819837327.776,
          type: 'candidate-pair',
          transportId: 'RTCTransport_0_1',
          localCandidateId: 'RTCIceCandidate_FHF2+YRh',
          remoteCandidateId: 'RTCIceCandidate_VYCacrMy',
          state: 'succeeded',
          priority: 7241540809789538000,
          nominated: true,
          writable: true,
          packetsSent: 299,
          packetsReceived: 3730,
          bytesSent: 20876,
          bytesReceived: 1708890,
          totalRoundTripTime: 2.645,
          currentRoundTripTime: 0.253,
          availableOutgoingBitrate: 300000,
          availableIncomingBitrate: 20312,
          requestsReceived: 4,
          requestsSent: 1,
          responsesReceived: 36,
          responsesSent: 4,
          consentRequestsSent: 36,
          packetsDiscardedOnSend: 0,
          bytesDiscardedOnSend: 0,
          bitrate: 61413.33232196812,
          jitter: 0.026000000000000002,
          packetsLost: 17,
          packetsLostRate: 0.003,
        },
      },
    },
    localTrackStats: {
      '102': [
        {
          id: 'RTCOutboundRTPAudioStream_3315216604',
          timestamp: 1639819837327.096,
          type: 'outbound-rtp',
          trackIdentifier: '194a1971-a82e-4f68-8239-363f525ffdf4',
          mediaSourceId: 'RTCAudioSource_4',
          remoteSource: false,
          ended: false,
          detached: false,
          kind: 'audio',
          echoReturnLoss: -28.17002296447754,
          echoReturnLossEnhancement: 0.35933688282966614,
          ssrc: 3315216604,
          trackId: 'RTCMediaStreamTrack_sender_4',
          transportId: 'RTCTransport_0_1',
          codecId: 'RTCCodec_2_Outbound_111',
          mediaType: 'audio',
          remoteId: 'RTCRemoteInboundRtpAudioStream_3315216604',
          packetsSent: 2497,
          retransmittedPacketsSent: 0,
          bytesSent: 178681,
          headerBytesSent: 49940,
          retransmittedBytesSent: 0,
          nackCount: 0,
          peerID: '3ea41bd8-1940-46c8-b274-14c3d7a62954',
          peerName: 'Eswar1',
          bitrate: 11131.663584055108,
        },
      ],
      '101': [
        {
          id: 'RTCOutboundRTPVideoStream_1213825938',
          timestamp: 1639819837327.096,
          type: 'outbound-rtp',
          trackIdentifier: 'ffaf10ca-284a-42e2-afd4-4deb3cd2d928',
          mediaSourceId: 'RTCVideoSource_3',
          remoteSource: false,
          ended: false,
          detached: false,
          kind: 'video',
          frameWidth: 360,
          frameHeight: 270,
          framesSent: 2244,
          hugeFramesSent: 11,
          ssrc: 1213825938,
          trackId: 'RTCMediaStreamTrack_sender_3',
          transportId: 'RTCTransport_0_1',
          codecId: 'RTCCodec_1_Outbound_96',
          mediaType: 'video',
          remoteId: 'RTCRemoteInboundRtpVideoStream_1213825938',
          packetsSent: 3541,
          retransmittedPacketsSent: 16,
          bytesSent: 2653360,
          headerBytesSent: 75436,
          retransmittedBytesSent: 11612,
          framesEncoded: 2244,
          keyFramesEncoded: 8,
          totalEncodeTime: 5.084,
          totalEncodedBytesTarget: 0,
          framesPerSecond: 24,
          totalPacketSendDelay: 88.564,
          qualityLimitationReason: 'bandwidth',
          qualityLimitationDurations: {
            other: 0,
            cpu: 0,
            bandwidth: 23338,
            none: 58116,
          },
          qualityLimitationResolutionChanges: 0,
          encoderImplementation: 'libvpx',
          firCount: 0,
          pliCount: 10,
          nackCount: 14,
          qpSum: 80673,
          peerID: '1',
          peerName: 'Eswar1',
          bitrate: 75156.65778440071,
        },
      ],
    },
    remoteTrackStats: {
      '103': {
        id: 'RTCInboundRTPVideoStream_1148593599',
        timestamp: 1639819837327.776,
        type: 'inbound-rtp',
        trackIdentifier: '964e6077-88c9-4fcc-ad46-c962fba11412',
        remoteSource: true,
        ended: false,
        detached: false,
        kind: 'video',
        jitterBufferDelay: 71.844,
        jitterBufferEmittedCount: 1116,
        frameWidth: 240,
        frameHeight: 180,
        framesReceived: 1154,
        framesDecoded: 1117,
        framesDropped: 23,
        ssrc: 1148593599,
        trackId: 'RTCMediaStreamTrack_receiver_7',
        transportId: 'RTCTransport_0_1',
        codecId: 'RTCCodec_3_Inbound_96',
        mediaType: 'video',
        jitter: 0.02,
        packetsLost: 4,
        packetsReceived: 1735,
        bytesReceived: 1282424,
        headerBytesReceived: 34784,
        lastPacketReceivedTimestamp: 1639819837287,
        framesPerSecond: 28,
        keyFramesDecoded: 8,
        totalDecodeTime: 0.356,
        totalInterFrameDelay: 45.59400000000011,
        totalSquaredInterFrameDelay: 4.047144000000005,
        decoderImplementation: 'libvpx',
        firCount: 0,
        pliCount: 1,
        nackCount: 36,
        qpSum: 44990,
        peerID: '89e0ea26-015d-4849-a11e-990c1f09ae9b',
        peerName: 'Eswar2',
        bitrate: 26520.298780624187,
        estimatedPlayoutTimestamp: 3848808637866,
      },
      '104': {
        id: 'RTCInboundRTPAudioStream_667999047',
        timestamp: 1639819837327.776,
        type: 'inbound-rtp',
        trackIdentifier: 'a3331956-cde1-4bfe-bcd0-ba26d02554cf',
        remoteSource: true,
        ended: false,
        detached: false,
        kind: 'audio',
        jitterBufferDelay: 205833.6,
        jitterBufferEmittedCount: 1279680,
        audioLevel: 0.09167760246589557,
        totalAudioEnergy: 0.06381711440588567,
        totalSamplesReceived: 2194880,
        totalSamplesDuration: 45.759999999999465,
        concealedSamples: 13560,
        silentConcealedSamples: 280,
        concealmentEvents: 18,
        insertedSamplesForDeceleration: 3840,
        removedSamplesForAcceleration: 2721,
        ssrc: 667999047,
        trackId: 'RTCMediaStreamTrack_receiver_8',
        transportId: 'RTCTransport_0_1',
        codecId: 'RTCCodec_4_Inbound_111',
        mediaType: 'audio',
        jitter: 0.006,
        packetsLost: 13,
        packetsDiscarded: 0,
        packetsReceived: 1352,
        fecPacketsReceived: 103,
        fecPacketsDiscarded: 103,
        bytesReceived: 93084,
        headerBytesReceived: 27040,
        lastPacketReceivedTimestamp: 1639819837315,
        peerID: '89e0ea26-015d-4849-a11e-990c1f09ae9b',
        peerName: 'Eswar2',
        bitrate: 17151.758268153764,
        remoteId: 'RTCRemoteOutboundRTPAudioStream_667999047',
        estimatedPlayoutTimestamp: 3848808636606,
      },
    },
    publishStats: {
      type: 'publish',
      packetsLost: 19,
      jitter: 0.008170833333333334,
    },
    subscribeStats: {
      type: 'subscribe',
      packetsLost: 17,
      jitter: 0.026000000000000002,
    },
  };

  localPeerStats = fakeInternalsStore.peerStats['1'] as HMSPeerStats;
  localVideoTrackStats = fakeInternalsStore.localTrackStats['101'][0] as HMSTrackStats;
  localAudioTrackStats = fakeInternalsStore.localTrackStats['102'][0] as HMSTrackStats;
  remoteVideoTrackStats = fakeInternalsStore.remoteTrackStats['103'] as HMSTrackStats;
  remoteAudioTrackStats = fakeInternalsStore.remoteTrackStats['104'] as HMSTrackStats;

  return fakeInternalsStore as HMSStatsStore;
};
