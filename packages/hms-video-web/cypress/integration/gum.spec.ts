describe('simple gum test', () => {
  it('should get user media', () => {
    cy.window().then(async window => {
      const constraints = { audio: true, video: true };
      const stream = await window.navigator.mediaDevices.getUserMedia(constraints);
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      expect(videoTrack).to.not.be.undefined;
      expect(audioTrack).to.not.be.undefined;
      console.log('test log1');
      console.log('add test log1');
    });
  });

  it('should match 1 to 1', () => {
    expect(1).to.equal(1);
  });
});
