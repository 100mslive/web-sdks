import { HMSReactiveStore, selectIsConnectedToRoom, selectTracksMap } from '../../packages/hms-video-store/src';
import { HMSSDKActions } from '../../packages/hms-video-store/src/core/hmsSDKStore/HMSSDKActions';
import { IHMSStoreReadOnly } from '../../packages/hms-video-store/src/core/IHMSStore';

let HMSStore;
let actions: HMSSDKActions;
let store: IHMSStoreReadOnly;
let initEndpoint;

let token;

describe('join api', () => {
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

  it('should throw error if no token', () => {
    try {
      actions.join({ userName: 'test', authToken: '', initEndpoint });
    } catch (error) {
      console.log(error.message);
      expect(error.message).to.include('Token is not in proper JWT format');
    }
  });

  describe('join with token', () => {
    afterEach(() => {
      if (actions) {
        return actions.leave();
      }
    });

    it('should update store state on join', () => {
      const start = Date.now();
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      cy.get('@onJoin')
        .should('be.calledOnce')
        .then(() => {
          expect(store.getState(selectIsConnectedToRoom)).to.be.true;
          cy.log(String(Date.now() - start));
        });
    });

    it('should call onTrackUpdate twice', () => {
      actions.join({ userName: 'test', authToken: token, initEndpoint });
      cy.get('@onTrackUpdate').should('be.calledTwice');
    });

    it('should get canvas stream on video disabled', () => {
      actions.join({
        userName: 'test',
        authToken: token,
        initEndpoint,
        settings: { isVideoMuted: true },
      });
      cy.get('@onTrackUpdate')
        .should('be.calledTwice')
        .then(() => {
          //@ts-ignore
          const sdkVideoTrack = actions.sdk.getLocalPeer().videoTrack?.nativeTrack;
          //@ts-ignore
          expect(sdkVideoTrack).to.be.instanceOf(CanvasCaptureMediaStreamTrack);
        });
    });

    it('should not create extra track on joing with mute on preview and join with enabled video', () => {
      //@ts-ignore
      cy.spy(actions, 'onPreview').as('onPreview');
      actions.preview({
        userName: 'test',
        authToken: token,
        initEndpoint,
        settings: { isVideoMuted: true },
      });
      let previewTrackIds;
      cy.get('@onPreview')
        .should('be.calledOnce')
        .then(() => {
          const tracks = store.getState(selectTracksMap);
          previewTrackIds = Object.keys(tracks);
          expect(previewTrackIds.length).to.equal(2);
          return actions.setLocalVideoEnabled(true);
        })
        .then(() => {
          actions.join({
            userName: 'test',
            authToken: token,
            initEndpoint,
          });
          return cy.get('@onTrackUpdate').should('be.calledTwice');
        })
        .then(() => {
          const tracks = Object.keys(store.getState(selectTracksMap));
          expect(tracks.length).to.equal(2);
          expect(tracks).to.include(previewTrackIds[0]);
          expect(tracks).to.include(previewTrackIds[1]);
        });
    });
  });
});
