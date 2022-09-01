import { CypressPeer } from '../support/peer';
import { GainPlugin } from '../GainPlugin';

let token: string;
let localPeer: CypressPeer;
let gainPlugin1: GainPlugin;
let gainPlugin2: GainPlugin;

describe('Audio Plugins', () => {
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

    gainPlugin1 = new GainPlugin();
    gainPlugin2 = new GainPlugin(0.75, 'gain-custom');
    cy.spy(gainPlugin1, 'processAudioTrack').as('gain1Process');
    cy.spy(gainPlugin2, 'processAudioTrack').as('gain2Process');
    cy.spy(gainPlugin1, 'stop').as('gain1Stop');
    cy.spy(gainPlugin2, 'stop').as('gain2Stop');
  });

  it('should call plugin process/stop on add/remove plugin', () => {
    const actions = localPeer.actions;
    cy.wrap(localPeer.join()).then(() => {
      cy.wrap(actions.addPluginToAudioTrack(gainPlugin1)).then(() => {
        cy.get('@gain1Process').should('have.been.calledOnce');
        cy.wrap(actions.removePluginFromAudioTrack(gainPlugin1)).then(() => {
          cy.get('@gain1Stop').should('have.been.calledOnce');
        });
      });
    });
  });

  it('should handle multiple plugins', () => {
    const actions = localPeer.actions;
    cy.wrap(localPeer.join()).then(() => {
      cy.wrap(actions.addPluginToAudioTrack(gainPlugin1)).then(() => {
        cy.wrap(actions.addPluginToAudioTrack(gainPlugin2)).then(() => {
          cy.wrap(actions.removePluginFromAudioTrack(gainPlugin1)).then(() => {
            cy.get('@gain1Process').should('have.been.calledOnce');
            cy.get('@gain1Stop').should('have.been.calledOnce');
            cy.get('@gain2Process').should('have.been.calledTwice');
            cy.get('@gain2Stop').should('have.been.calledOnce');
          });
        });
      });
    });
  });
});
