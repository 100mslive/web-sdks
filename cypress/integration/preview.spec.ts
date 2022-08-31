import { selectLocalVideoTrackID, selectRoomState } from '@100mslive/hms-video-store';
import { CypressPeer } from '../support/peer';

let localPeer: CypressPeer;
let token: string;

describe('preview api', () => {
  before(() => {
    cy.getToken().then(authToken => {
      token = authToken;
    });
  });

  beforeEach(() => {
    if (localPeer) {
      localPeer.leave();
    }

    localPeer = new CypressPeer(token);
  });

  it('should throw error if no token', () => {
    const emptyTokenPeer = new CypressPeer('');
    emptyTokenPeer.preview().catch(error => {
      expect(error.message).to.include('Token is not in proper JWT format');
    });
  });

  it('should update store on success', () => {
    const previewPromise = new Promise<void>(resolve => {
      localPeer.preview().then(() => resolve());
      expect(localPeer.store.getState(selectRoomState)).to.equal('Connecting');
    });
    cy.wrap(previewPromise).then(() => {
      expect(localPeer.isInPreview()).to.be.true;
    });
  });

  it('should not update local video trackid in store on disable/enable', () => {
    cy.wrap(localPeer.preview()).then(async () => {
      expect(localPeer.isInPreview()).to.be.true;
      const store = localPeer.store;
      const actions = localPeer.actions;
      const sdkPeer = localPeer.sdkPeer;

      const localVideoTrackID = store.getState(selectLocalVideoTrackID);
      const sdkVideoTrack = sdkPeer.videoTrack?.nativeTrack.id;
      await actions.setLocalVideoEnabled(false);

      const sdkVideoTrackAfterDisabled = sdkPeer.videoTrack?.nativeTrack?.id;
      expect(sdkVideoTrackAfterDisabled).to.not.equal(sdkVideoTrack);

      await actions.setLocalVideoEnabled(true);
      const trackId = store.getState(selectLocalVideoTrackID);
      return expect(localVideoTrackID).to.equal(trackId);
    });
  });
});
