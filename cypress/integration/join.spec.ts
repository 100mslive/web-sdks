import { selectTracksMap } from '../../packages/hms-video-store/src';
import { CypressPeer } from '../support/peer';

let localPeer: CypressPeer;
let token: string;

describe('join api', () => {
  it('should throw error if no token', () => {
    const emptyTokenPeer = new CypressPeer('');
    emptyTokenPeer.join().catch(error => {
      expect(error.message).to.include('Token is not in proper JWT format');
    });
  });

  describe('join with token', () => {
    before(() => {
      cy.getToken().then(authToken => {
        token = authToken;
      });
    });

    beforeEach(() => {
      localPeer = new CypressPeer(token);
    });

    afterEach(() => {
      localPeer.leave();
    });

    it('should update store state on join', () => {
      const start = Date.now();
      cy.wrap(localPeer.join()).then(() => {
        expect(localPeer.isConnected()).to.be.true;
        cy.log(String(Date.now() - start));
      });
    });

    it('should get 2 local tracks', () => {
      cy.wrap(localPeer.join()).then(() => {
        expect(localPeer.audioTrack).to.exist;
        expect(localPeer.videoTrack).to.exist;
      });
    });

    it('should get canvas stream on video disabled', () => {
      cy.wrap(localPeer.join({ isVideoMuted: true })).then(() => {
        expect(localPeer.audioTrack).to.exist;
        expect(localPeer.videoTrack).to.exist;
        const sdkVideoTrack = localPeer.sdkPeer.videoTrack.nativeTrack;
        expect(sdkVideoTrack).to.be.instanceOf(CanvasCaptureMediaStreamTrack);
      });
    });

    it('should not create extra track on joing with mute on preview and join with enabled video', () => {
      let previewTrackIds;
      cy.wrap(localPeer.preview({ isVideoMuted: true }))
        .then(() => {
          expect(localPeer.isInPreview()).to.be.true;
          const tracks = localPeer.store.getState(selectTracksMap);
          previewTrackIds = Object.keys(tracks);
          expect(previewTrackIds.length).to.equal(2);
          return localPeer.actions.setLocalVideoEnabled(true);
        })
        .then(() => {
          cy.wrap(localPeer.join()).then(() => {
            const tracks = Object.keys(localPeer.store.getState(selectTracksMap));
            expect(tracks.length).to.equal(2);
            expect(tracks).to.include(previewTrackIds[0]);
            expect(tracks).to.include(previewTrackIds[1]);
          });
        });
    });
  });
});
