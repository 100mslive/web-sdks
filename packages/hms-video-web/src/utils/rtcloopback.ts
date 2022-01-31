export async function processAudioThroughRTC(stream: MediaStream): Promise<MediaStream> {
  const offerOptions = {
    offerVideo: true,
    offerAudio: true,
    offerToReceiveAudio: false,
    offerToReceiveVideo: false,
  };
  const loopbackStream = new MediaStream(); // this is the stream you will read from for actual audio output

  // initialize the RTC connections
  const rtcConnection = new RTCPeerConnection();
  const rtcLoopbackConnection = new RTCPeerConnection();

  return new Promise(resolve => {
    let count = 0;
    (async () => {
      rtcConnection.onicecandidate = e => {
        e.candidate && rtcLoopbackConnection?.addIceCandidate(new RTCIceCandidate(e.candidate));
      };
      rtcLoopbackConnection.onicecandidate = e => {
        e.candidate && rtcConnection?.addIceCandidate(new RTCIceCandidate(e.candidate));
      };

      rtcLoopbackConnection.ontrack = e => {
        loopbackStream.addTrack(e.track);
        count--;
        if (count === 0) {
          resolve(loopbackStream);
        }
      };

      // setup the loopback
      count = stream.getTracks().length;
      stream.getTracks().forEach(track => {
        rtcConnection?.addTrack(track); // this track would be the processed stream coming out of Web Audio API destination node
      });

      const offer: RTCSessionDescriptionInit = await rtcConnection?.createOffer(offerOptions);
      await rtcConnection.setLocalDescription(offer);

      await rtcLoopbackConnection.setRemoteDescription(offer);
      const answer: RTCSessionDescriptionInit = await rtcLoopbackConnection.createAnswer();
      await rtcLoopbackConnection.setLocalDescription(answer);

      await rtcConnection.setRemoteDescription(answer);
    })();
  });
}
