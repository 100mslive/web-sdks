import { HMSReactiveStore } from '../../packages/hms-video-store/src';
import { HMSSDKActions } from '../../packages/hms-video-store/src/core/hmsSDKStore/HMSSDKActions';
import { GainPlugin } from '../GainPlugin';

let HMSStore;
let actions: HMSSDKActions;
let initEndpoint;
let gainPlugin1: GainPlugin;
let gainPlugin2: GainPlugin;

let token;

describe('Audio Plugins', () => {
  before(() => {
    cy.getToken().then(authToken => {
      token = authToken;
    });
  });
  beforeEach(() => {
    HMSStore = new HMSReactiveStore();
    actions = HMSStore.getHMSActions();
    gainPlugin1 = new GainPlugin();
    gainPlugin2 = new GainPlugin(0.75, 'gain-custom');
    initEndpoint = Cypress.env('CYPRESS_INIT_ENDPOINT');
    //@ts-ignore
    cy.spy(actions, 'onJoin').as('onJoin');
    //@ts-ignore
    cy.spy(actions, 'onTrackUpdate').as('onTrackUpdate');
    cy.spy(gainPlugin1, 'processAudioTrack').as('gain1Process');
    cy.spy(gainPlugin2, 'processAudioTrack').as('gain2Process');
    cy.spy(gainPlugin1, 'stop').as('gain1Stop');
    cy.spy(gainPlugin2, 'stop').as('gain2Stop');
  });

  afterEach(() => {
    if (actions) {
      return actions.leave();
    }
  });

  it('should call plugin process/stop on add/remove plugin', () => {
    actions.join({ userName: 'test', authToken: token, initEndpoint }).then(() => {
      //@ts-ignore
      cy.localTracksAdded(actions.sdk.getLocalPeer())
        .then(() => {
          return actions.addPluginToAudioTrack(gainPlugin1);
        })
        .then(() => {
          cy.get('@gain1Process').should('have.been.calledOnce');
          return actions.removePluginFromAudioTrack(gainPlugin1);
        })
        .then(() => {
          cy.get('@gain1Stop').should('have.been.calledOnce');
        });
    });
  });

  it('should handle multiple plugins', () => {
    actions.join({ userName: 'test', authToken: token, initEndpoint }).then(() => {
      //@ts-ignore
      cy.localTracksAdded(actions.sdk.getLocalPeer())
        .then(() => {
          return actions.addPluginToAudioTrack(gainPlugin1);
        })
        .then(() => {
          return actions.addPluginToAudioTrack(gainPlugin2);
        })
        .then(() => {
          return actions.removePluginFromAudioTrack(gainPlugin1);
        })
        .then(() => {
          cy.get('@gain1Process').should('have.been.calledOnce');
          cy.get('@gain1Stop').should('have.been.calledOnce');
          cy.get('@gain2Process').should('have.been.calledTwice');
          cy.get('@gain2Stop').should('have.been.calledOnce');
        });
    });
  });
});
