import {
  HMSReactiveStore,
  selectIsInPreview,
  selectLocalVideoTrackID,
  selectRoomState,
} from '../../packages/hms-video-store/src';
import { HMSSDKActions } from '../../packages/hms-video-store/src/core/hmsSDKStore/HMSSDKActions';
import { IHMSStoreReadOnly } from '../../packages/hms-video-store/src/core/IHMSStore';

let HMSStore;
let actions: HMSSDKActions;
let store: IHMSStoreReadOnly;
let initEndpoint;

let token;

describe('preview api', () => {
  before(() => {
    cy.getToken().then(authToken => {
      token = authToken;
    });
  });
  beforeEach(() => {
    HMSStore = new HMSReactiveStore();
    actions = HMSStore.getHMSActions();
    store = HMSStore.getStore();
    initEndpoint = Cypress.env('CYPRESS_INIT_ENDPOINT');
    //@ts-ignore
    cy.spy(actions, 'onPreview').as('onPreview');
  });
  it('should throw error if no token', () => {
    actions
      .preview({ userName: 'test', authToken: '', initEndpoint })
      .then(() => {})
      .catch(error => {
        expect(error.message).to.include('Token is not in proper JWT format');
      });
  });

  it('should update store on success', () => {
    actions.preview({ userName: 'test', authToken: token, initEndpoint }).then(() => {
      expect(store.getState(selectIsInPreview)).to.equal(true);
    });
    expect(store.getState(selectRoomState)).to.equal('Connecting');
    cy.get('@onPreview')
      .should('be.calledOnce')
      .then(() => {
        expect(store.getState(selectIsInPreview)).to.equal(true);
      });
  });

  it('should not update local video trackid in store on disable/enable', () => {
    actions.preview({ userName: 'test', authToken: token, initEndpoint });
    cy.get('@onPreview')
      .should('be.calledOnce')
      .then(async () => {
        const localVideoTrackID = store.getState(selectLocalVideoTrackID);
        //@ts-ignore
        const sdkVideoTrack = actions.sdk.getLocalPeer().videoTrack?.nativeTrack.id;
        await actions.setLocalVideoEnabled(false);
        //@ts-ignore
        const sdkVideoTrackAfterDisabled = actions.sdk.getLocalPeer().videoTrack?.nativeTrack?.id;
        expect(sdkVideoTrackAfterDisabled).to.not.equal(sdkVideoTrack);
        await actions.setLocalVideoEnabled(true);
        const trackId = store.getState(selectLocalVideoTrackID);
        expect(localVideoTrackID).to.equal(trackId);
      });
  });
});
