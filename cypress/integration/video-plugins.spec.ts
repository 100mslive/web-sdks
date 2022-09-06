import { HMSReactiveStore } from '../../packages/hms-video-store/src';
import { HMSSDKActions } from '../../packages/hms-video-store/src/core/hmsSDKStore/HMSSDKActions';
import { brighteningPlugin } from '../brighteningPlugin';

let HMSStore;
let actions: HMSSDKActions;
let initEndpoint;
let brighteningPlugin1: brighteningPlugin;
let brighteningPlugin2: brighteningPlugin;

let token;

describe('Video Plugins', () => {
  before(() => {
    cy.getToken().then(authToken => {
      token = authToken;
    });
  });
  beforeEach(() => {
    HMSStore = new HMSReactiveStore();
    actions = HMSStore.getHMSActions();
    brighteningPlugin1 = new brighteningPlugin();
    brighteningPlugin2 = new brighteningPlugin(1.5, 'brightening-custom-plugin');
    initEndpoint = Cypress.env('CYPRESS_INIT_ENDPOINT');
    //@ts-ignore
    cy.spy(actions, 'onJoin').as('onJoin');
    //@ts-ignore
    cy.spy(actions, 'onTrackUpdate').as('onTrackUpdate');
    cy.spy(brighteningPlugin1, 'processVideoFrame').as('brightening1Process');
    cy.spy(brighteningPlugin2, 'processVideoFrame').as('brightening2Process');
    cy.spy(brighteningPlugin1, 'stop').as('brightening1Stop');
    cy.spy(brighteningPlugin2, 'stop').as('brightening2Stop');
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
          return actions.addPluginToVideoTrack(brighteningPlugin1);
        })
        .then(() => {
          cy.get('@brightening1Process').should('have.been.calledOnce');
          return actions.removePluginFromVideoTrack(brighteningPlugin1);
        })
        .then(() => {
          cy.get('@brightening1Stop').should('have.been.calledOnce');
        });
    });
  });

  it('should handle multiple plugins', () => {
    actions.join({ userName: 'test', authToken: token, initEndpoint }).then(() => {
      //@ts-ignore
      cy.localTracksAdded(actions.sdk.getLocalPeer())
        .then(() => {
          return actions.addPluginToVideoTrack(brighteningPlugin1);
        })
        .then(() => {
          return actions.addPluginToVideoTrack(brighteningPlugin2);
        })
        .then(() => {
          return actions.removePluginFromVideoTrack(brighteningPlugin1);
        })
        .then(() => {
          cy.get('@brightening1Process').should('have.been.calledOnce');
          cy.get('@brightening1Stop').should('have.been.calledOnce');
          return cy.get('@brightening2Process').should('have.been.calledTwice');
        })
        .then(() => {
          return actions.removePluginFromVideoTrack(brighteningPlugin2);
        })
        .then(() => {
          cy.get('@brightening2Stop').should('have.been.calledOnce');
        });
    });
  });
});
