import { HMSReactiveStore, selectLocalPeer } from '../../packages/hms-video-store/src';
import { HMSSDKActions } from '../../packages/hms-video-store/src/core/hmsSDKStore/HMSSDKActions';
import { IHMSStoreReadOnly } from '../../packages/hms-video-store/src/core/IHMSStore';

let HMSStore;
let actions: HMSSDKActions;
let store: IHMSStoreReadOnly;
let initEndpoint;

let token;

describe('add/remove track api', () => {
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
    cy.spy(actions, 'onJoin').as('onJoin');
    //@ts-ignore
    cy.spy(actions, 'onTrackUpdate').as('onTrackUpdate');
  });

  describe('Add/Remove Track', () => {
    afterEach(() => {
      if (actions) {
        return actions.leave();
      }
    });

    it('should add/remove a track to aux track on addTrack', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      //@ts-ignore
      cy.localTracksAdded(actions.sdk.getLocalPeer())
        .then(() => {
          return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        })
        .then(stream => {
          const videoTrack = stream.getVideoTracks()[0];
          actions.addTrack(videoTrack).then(() => {
            const localPeer = store.getState(selectLocalPeer);
            expect(localPeer.auxiliaryTracks[0]).to.equal(videoTrack.id);
            expect(localPeer.videoTrack).to.not.equal(videoTrack.id);
            actions.removeTrack(videoTrack.id).then(() => {
              const localPeer = store.getState(selectLocalPeer);
              expect(localPeer.auxiliaryTracks.length).to.equal(0);
              expect(localPeer.videoTrack).to.not.equal(undefined);
            });
          });
        });
    });
  });
});
