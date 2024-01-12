import { enableOpusDtx, getSdpTrackIdForMid } from './session-description';

class DummyDescription {
  itype: RTCSdpType;
  isdp: string;

  constructor(dict: any) {
    this.itype = dict.type;
    this.isdp = dict.sdp;
  }
  get type() {
    return this.itype;
  }
  get sdp() {
    return this.isdp;
  }
}

const mid1 = '1';
const trackId1 = '{cc07406a-2fb2-c942-8bf9-4a88d8f68417}';
const mid2 = '2';
const trackId2 = '{9fbef725-faa7-0646-b27f-ec3e405032b1}';

const offer: RTCSessionDescriptionInit = new DummyDescription({
  type: 'offer',
  sdp: `v=0\r\no=mozilla...THIS_IS_SDPARTA-89.0.1 3711968519937002308 1 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 8B:9A:E5:83:CD:16:77:37:17:A1:85:90:91:C9:E1:A3:E1:32:88:D4:F7:EC:6D:A8:14:EF:AF:F9:77:4F:EE:3A\r\na=ice-options:trickle\r\na=msid-semantic: WMS *\r\na=group:BUNDLE 0 1 2\r\nm=application 62949 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 65.1.146.205\r\na=setup:actpass\r\na=mid:0\r\na=sendrecv\r\na=ice-ufrag:c9682623\r\na=ice-pwd:92542c9fc2c8ae125374814de8bdb4b1\r\na=candidate:0 1 UDP 2122252543 6fd9e3f2-c774-9b4d-8df9-cc6ebb0bbd89.local 62108 typ host\r\na=candidate:4 1 TCP 2105524479 6fd9e3f2-c774-9b4d-8df9-cc6ebb0bbd89.local 9 typ host tcptype active\r\na=candidate:1 1 UDP 1686052863 49.205.119.198 5966 typ srflx raddr 0.0.0.0 rport 0\r\na=candidate:3 1 UDP 92216831 65.1.146.205 62949 typ relay raddr 65.1.146.205 rport 62949\r\na=end-of-candidates\r\na=sctp-port:5000\r\na=max-message-size:1073741823\r\nm=audio 9 UDP/TLS/RTP/SAVPF 109 9 0 8 101\r\nc=IN IP4 0.0.0.0\r\na=rtpmap:109 opus/48000/2\r\na=rtpmap:9 G722/8000/1\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:101 telephone-event/8000/1\r\na=fmtp:109 maxplaybackrate=48000;stereo=1;useinbandfec=1\r\na=fmtp:101 0-15\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=extmap:2/recvonly urn:ietf:params:rtp-hdrext:csrc-audio-level\r\na=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=setup:actpass\r\na=mid:${mid1}\r\na=msid:{e7af19b4-fef7-724c-9c8b-512a70e209fa} ${trackId1}\r\na=sendonly\r\na=ice-ufrag:c9682623\r\na=ice-pwd:92542c9fc2c8ae125374814de8bdb4b1\r\na=ssrc:3201730939 cname:{74f09978-9871-0e40-a6f4-8603e3dfe3cd}\r\na=rtcp-mux\r\nm=video 9 UDP/TLS/RTP/SAVPF 120 124 121 125 126 127 97 98\r\nc=IN IP4 0.0.0.0\r\na=rtpmap:120 VP8/90000\r\na=rtpmap:124 rtx/90000\r\na=rtpmap:121 VP9/90000\r\na=rtpmap:125 rtx/90000\r\na=rtpmap:126 H264/90000\r\na=rtpmap:127 rtx/90000\r\na=rtpmap:97 H264/90000\r\na=rtpmap:98 rtx/90000\r\na=fmtp:126 profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1\r\na=fmtp:97 profile-level-id=42e01f;level-asymmetry-allowed=1\r\na=fmtp:120 max-fs=12288;max-fr=60\r\na=fmtp:124 apt=120\r\na=fmtp:121 max-fs=12288;max-fr=60\r\na=fmtp:125 apt=121\r\na=fmtp:127 apt=126\r\na=fmtp:98 apt=97\r\na=rtcp-fb:120 nack\r\na=rtcp-fb:120 nack pli\r\na=rtcp-fb:120 ccm fir\r\na=rtcp-fb:120 goog-remb\r\na=rtcp-fb:120 transport-cc\r\na=rtcp-fb:121 nack\r\na=rtcp-fb:121 nack pli\r\na=rtcp-fb:121 ccm fir\r\na=rtcp-fb:121 goog-remb\r\na=rtcp-fb:121 transport-cc\r\na=rtcp-fb:126 nack\r\na=rtcp-fb:126 nack pli\r\na=rtcp-fb:126 ccm fir\r\na=rtcp-fb:126 goog-remb\r\na=rtcp-fb:126 transport-cc\r\na=rtcp-fb:97 nack\r\na=rtcp-fb:97 nack pli\r\na=rtcp-fb:97 ccm fir\r\na=rtcp-fb:97 goog-remb\r\na=rtcp-fb:97 transport-cc\r\na=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:4 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:5 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:6/recvonly http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r\na=extmap:7 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=setup:actpass\r\na=mid:${mid2}\r\na=msid:{e7af19b4-fef7-724c-9c8b-512a70e209fa} ${trackId2}\r\na=sendonly\r\na=ice-ufrag:c9682623\r\na=ice-pwd:92542c9fc2c8ae125374814de8bdb4b1\r\na=ssrc:2408697731 cname:{74f09978-9871-0e40-a6f4-8603e3dfe3cd}\r\na=ssrc:4009957286 cname:{74f09978-9871-0e40-a6f4-8603e3dfe3cd}\r\na=ssrc-group:FID 2408697731 4009957286\r\na=rtcp-mux\r\na=rtcp-rsize\r\n`,
});

describe('enable Opus Dtx', () => {
  const offerWithOpusDtx = enableOpusDtx(offer);

  it('should add usedtx=1 if it is not present in the sdp', () => {
    expect(offerWithOpusDtx.type).toBeDefined();
    expect(offerWithOpusDtx.sdp).toBeDefined();
    expect(offerWithOpusDtx.type).toEqual(offer.type);
    expect(offerWithOpusDtx.sdp).toContain('usedtx=1');
  });

  it('calling enableOpusDtx multiple times should return the same value', () => {
    expect(enableOpusDtx(offerWithOpusDtx)).toEqual(offerWithOpusDtx);
  });
});

describe('parse track ID from SDP', () => {
  it('should fetch trackId for corresponding mid from SDP', () => {
    expect(getSdpTrackIdForMid(offer, mid1)).toBe(trackId1);
    expect(getSdpTrackIdForMid(offer, mid2)).toBe(trackId2);
  });
});
