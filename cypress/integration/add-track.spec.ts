import {
  HMSReactiveStore,
  selectIsConnectedToRoom,
  selectLocalPeer,
  selectRemotePeers,
} from '../../packages/hms-video-store/src';
import { HMSSDKActions } from '../../packages/hms-video-store/src/core/hmsSDKStore/HMSSDKActions';
import { IHMSStoreReadOnly } from '../../packages/hms-video-store/src/core/IHMSStore';

let HMSStore, HMSStore1;
let actions: HMSSDKActions;
let actions1: HMSSDKActions;
let store: IHMSStoreReadOnly;
let store1: IHMSStoreReadOnly;
let initEndpoint;

let token;

const getTrack = () => {
  return navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(stream => {
    return stream.getVideoTracks()[0];
  });
};

describe('add/remove track api', () => {
  before(() => {
    cy.getToken().then(authToken => {
      token = authToken;
    });
  });

  beforeEach(() => {
    HMSStore = new HMSReactiveStore();
    actions = HMSStore.getActions();
    store = HMSStore.getStore();
    HMSStore1 = new HMSReactiveStore();
    store1 = HMSStore1.getStore();
    actions1 = HMSStore1.getActions();
    initEndpoint = Cypress.env('CYPRESS_INIT_ENDPOINT');
    //@ts-ignore
    cy.spy(actions, 'onJoin').as('onJoin');
    //@ts-ignore
    cy.spy(actions, 'onTrackUpdate').as('onTrackUpdate');

    //@ts-ignore
    cy.spy(actions1, 'onJoin').as('onJoin1');
    //@ts-ignore
    cy.spy(actions1, 'onTrackUpdate').as('onTrackUpdate1');
  });

  afterEach(() => {
    if (actions) {
      actions.leave();
    }
    if (actions1) {
      actions1.leave();
    }
  });

  it('both peers should join', () => {
    const start = Date.now();
    actions.join({ userName: 'test', authToken: token, initEndpoint });
    cy.get('@onJoin')
      .should('be.calledOnce')
      .then(() => {
        expect(store.getState(selectIsConnectedToRoom)).to.equal(true);
        cy.log(String(Date.now() - start));
      });

    actions1.join({ userName: 'test1', authToken: token, initEndpoint });
    cy.get('@onJoin1')
      .should('be.calledOnce')
      .then(() => {
        expect(store1.getState(selectIsConnectedToRoom)).to.equal(true);
        cy.log(String(Date.now() - start));
      });
  });

  it('should add/remove a track to aux track on addTrack for localPeer', () => {
    actions.join({ userName: 'test', authToken: token, initEndpoint }).then(() => {
      cy.get('@onTrackUpdate')
        .should('be.calledTwice')
        .then(() => getTrack())
        .then((videoTrack: MediaStreamTrack) => {
          actions.addTrack(videoTrack);
          cy.get('@onTrackUpdate')
            .should('be.calledThrice')
            .then(() => {
              const localPeer = store.getState(selectLocalPeer);
              expect(localPeer?.auxiliaryTracks[0]).to.equal(videoTrack.id);
              expect(localPeer?.videoTrack).to.not.equal(videoTrack.id);
              return actions.removeTrack(videoTrack.id);
            })
            .then(() => {
              const localPeer = store.getState(selectLocalPeer);
              expect(localPeer?.auxiliaryTracks.length).to.equal(0);
              expect(localPeer?.videoTrack).to.not.equal(undefined);
            });
        });
    });
  });

  it('should add/remove aux track for remotePeer on add/removeTrack', async () => {
    actions
      .join({ userName: 'test', authToken: token, initEndpoint })
      .then(() => {
        return actions1.join({ userName: 'test1', authToken: token, initEndpoint });
      })
      .then(() => {
        cy.get('@onTrackUpdate')
          .should('have.callCount', 4)
          .then(() => {
            return cy.get('@onTrackUpdate1').should('have.callCount', 4);
          })
          // By this time both peers would have joined and got each others tracks
          .then(() => getTrack())
          .then((videoTrack: MediaStreamTrack) => {
            actions.addTrack(videoTrack);
            cy.get('@onTrackUpdate1')
              .should('have.callCount', 5)
              .then(() => {
                const remotePeer = store1.getState(selectRemotePeers)[0];
                expect(remotePeer.auxiliaryTracks[0]).to.equal(videoTrack.id);
                expect(remotePeer.videoTrack).to.not.equal(videoTrack.id);
                actions.removeTrack(videoTrack.id);
                cy.get('@onTrackUpdate1')
                  .should('have.callCount', 6)
                  .then(() => {
                    const remotePeer = store1.getState(selectRemotePeers)[0];
                    expect(remotePeer.auxiliaryTracks.length).to.equal(0);
                    expect(remotePeer.videoTrack).to.not.equal(undefined);
                  });
              });
          });
      });
  });
});
