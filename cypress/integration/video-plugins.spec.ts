import { CypressPeer } from '../support/peer';
import { BrighteningPlugin } from '../brighteningPlugin';

let token: string;
let localPeer: CypressPeer;
let brighteningPlugin1: BrighteningPlugin;
let brighteningPlugin2: BrighteningPlugin;

describe('Video Plugins', () => {
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
    brighteningPlugin1 = new BrighteningPlugin();
    brighteningPlugin2 = new BrighteningPlugin(1.5, 'brightening-custom-plugin');

    cy.spy(brighteningPlugin1, 'processVideoFrame').as('brightening1Process');
    cy.spy(brighteningPlugin2, 'processVideoFrame').as('brightening2Process');
    cy.spy(brighteningPlugin1, 'stop').as('brightening1Stop');
    cy.spy(brighteningPlugin2, 'stop').as('brightening2Stop');
  });

  it('should call plugin process/stop on add/remove plugin', () => {
    const actions = localPeer.actions;
    cy.wrap(localPeer.join()).then(() => {
      cy.wrap(actions.addPluginToVideoTrack(brighteningPlugin1)).then(() => {
        cy.get('@brightening1Process')
          .should('have.been.calledOnce')
          .then(() => {
            cy.wrap(actions.removePluginFromVideoTrack(brighteningPlugin1)).then(() => {
              cy.get('@brightening1Stop').should('have.been.calledOnce');
            });
          });
      });
    });
  });

  it('should handle multiple plugins', () => {
    const actions = localPeer.actions;
    cy.wrap(localPeer.join()).then(() => {
      cy.wrap(actions.addPluginToVideoTrack(brighteningPlugin1)).then(() => {
        cy.get('@brightening1Process')
          .should('have.been.calledOnce')
          .then(() => {
            cy.wrap(actions.addPluginToVideoTrack(brighteningPlugin2)).then(() => {
              cy.wrap(actions.removePluginFromVideoTrack(brighteningPlugin1)).then(() => {
                cy.get('@brightening1Stop').should('have.been.calledOnce');
                cy.get('@brightening2Process')
                  .should('have.been.calledTwice')
                  .then(() => {
                    cy.wrap(actions.removePluginFromVideoTrack(brighteningPlugin2)).then(() => {
                      cy.get('@brightening2Stop').should('have.been.calledOnce');
                    });
                  });
              });
            });
          });
      });
    });
  });
});
