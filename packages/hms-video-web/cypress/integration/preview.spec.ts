import { HMSSdk } from '../../src';

const getToken = async ({ tokenEndpoint, roomId, role, apiEnv }) => {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    body: JSON.stringify({
      env: apiEnv,
      role,
      room_id: roomId,
      user_id: 'test',
    }),
  });

  const { token } = await response.json();

  return token;
};

let sdk;
let previewListener;
let token;
let initEndpoint;

describe('preview api', () => {
  before(async () => {
    token = await getToken({
      tokenEndpoint: Cypress.env('CYPRESS_TOKEN_ENDPOINT'),
      roomId: Cypress.env('CYPRESS_ROOM_ID'),
      role: Cypress.env('CYPRESS_ROLE'),
      apiEnv: Cypress.env('CYPRESS_API_ENV'),
    });
  });
  beforeEach(() => {
    initEndpoint = Cypress.env('CYPRESS_INIT_ENDPOINT');
    previewListener = {
      onPreview: cy.stub().as('onPreview'),
      onError: cy.stub().as('onError'),
    };
    sdk = new HMSSdk();
  });
  afterEach(() => {
    sdk = null;
  });

  it('should throw error if no token', () => {
    sdk
      .preview(
        {
          userName: 'test',
          authToken: '',
          initEndpoint: '',
        },
        previewListener,
      )
      .catch((error) => {
        expect(error.message).to.equal('Token is not in proper JWT format');
      });
  });

  it('should call onPreview if preview is successful', () => {
    const config = { authToken: token, initEndpoint, userName: 'test' };
    sdk.preview(config, previewListener).then(() => {
      const audioUpdate = { onAudioLevelUpdate: cy.stub().as('onAudioLevelUpdate') };
      sdk.addAudioListener(audioUpdate);
    });
    cy.get('@onPreview').should('be.calledOnce');
  });

  it('should have different id on video mute', () => {
    const config = { authToken: token, initEndpoint, userName: 'test' };
    sdk.preview(config, previewListener).then(() => {
      const audioUpdate = { onAudioLevelUpdate: cy.stub().as('onAudioLevelUpdate') };
      sdk.addAudioListener(audioUpdate);
    });
    cy.get('@onPreview')
      .should('be.calledOnce')
      .then(() => {
        const videoTrack = sdk.getLocalPeer().videoTrack;
        const firstId = videoTrack.trackId;
        const previousId = videoTrack.nativeTrack.id;
        videoTrack.setEnabled(false).then(() => {
          expect(videoTrack.nativeTrack.id).to.not.equal(previousId);
          expect(videoTrack.trackId).to.equal(firstId);
        });
      });
  });
});
