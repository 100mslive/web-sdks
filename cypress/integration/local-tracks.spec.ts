import { HMSConfig, HMSSdk, HMSUpdateListener } from '../../packages/hms-video-web/src';
import { HMSPreviewListener } from '../../packages/hms-video-web/src/interfaces/preview-listener';

let sdk: HMSSdk;
let previewListener: HMSPreviewListener;
let updateListener: HMSUpdateListener;
let token: string;
let initEndpoint: string;
let previewConfig: HMSConfig;
let deviceMap: {
  videoInput: string[];
  audioInput: string[];
  audioOutput: string[];
};

describe('Local track manager', () => {
  before(() => {
    cy.getToken().then(async t => {
      token = t;

      const devices = await navigator.mediaDevices.enumerateDevices();
      deviceMap = {
        videoInput: [],
        audioInput: [],
        audioOutput: [],
      };

      devices.forEach(device => {
        switch (device.kind) {
          case 'videoinput':
            deviceMap.videoInput.push(device.deviceId);
            break;
          case 'audioinput':
            deviceMap.audioInput.push(device.deviceId);
            break;
          case 'audiooutput':
            deviceMap.audioOutput.push(device.deviceId);
            break;
        }
      });
    });
  });
  beforeEach(() => {
    initEndpoint = Cypress.env('CYPRESS_INIT_ENDPOINT');
    previewListener = {
      onPreview: cy.stub().as('onPreview'),
      onError: cy.stub().as('onError'),
    };
    updateListener = {
      onJoin: cy.stub().as('onJoin'),
      onRoomUpdate: cy.stub().as('onRoomUpdate'),
      onPeerUpdate: cy.stub().as('onPeerUpdate'),
      onTrackUpdate: cy.stub().as('onTrackUpdate'),
      onMessageReceived: cy.stub().as('onMessageReceived'),
      onError: cy.stub().as('onErrorUpdate'),
      onReconnecting: cy.stub().as('onReconnecting'),
      onReconnected: cy.stub().as('onReconnected'),
      onRoleChangeRequest: cy.stub().as('onRoleChangeRequest'),
      onRoleUpdate: cy.stub().as('onRoleUpdate'),
      onChangeTrackStateRequest: cy.stub().as('onChangeTrackStateRequest'),
      onChangeMultiTrackStateRequest: cy.stub().as('onChangeMultiTrackStateRequest'),
      onRemovedFromRoom: cy.stub().as('onRemovedFromRoom'),
    };
    sdk = new HMSSdk();

    previewConfig = { authToken: token, initEndpoint, userName: 'test' };
  });
  afterEach(() => {
    sdk.leave();
    sdk = null;
  });

  it('should use the same tracks fetched in preview', () => {
    sdk.preview(previewConfig, previewListener);
    cy.get('@onPreview')
      .should('be.calledOnce')
      .then(() => {
        const videoTrack = sdk.getLocalPeer().videoTrack;
        const audioTrack = sdk.getLocalPeer().audioTrack;

        sdk.join({ authToken: token, initEndpoint, userName: 'test' }, updateListener);

        cy.get('@onJoin').should('be.calledOnce');

        cy.get('@onTrackUpdate')
          .should('be.calledTwice')
          .then(() => {
            const vTrackAfterJoin = sdk.getLocalPeer().videoTrack;
            const aTrackAfterJoin = sdk.getLocalPeer().audioTrack;

            expect(videoTrack.trackId).to.equal(vTrackAfterJoin.trackId);
            expect(audioTrack.trackId).to.equal(aTrackAfterJoin.trackId);
          });
      });
  });

  it('remembers the muted state when joined from preview', () => {
    sdk.preview(previewConfig, previewListener);
    cy.get('@onPreview')
      .should('be.calledOnce')
      .then(async () => {
        const videoTrack = sdk.getLocalPeer().videoTrack;
        const audioTrack = sdk.getLocalPeer().audioTrack;

        await videoTrack.setEnabled(false);
        await audioTrack.setEnabled(false);

        sdk.join(
          {
            authToken: token,
            initEndpoint,
            userName: 'test',
            settings: {
              isAudioMuted: false,
              isVideoMuted: false,
            },
          },
          updateListener,
        );

        cy.get('@onTrackUpdate')
          .should('be.calledTwice')
          .then(() => {
            expect(videoTrack.enabled).to.equal(false);
            expect(audioTrack.enabled).to.equal(false);
          });
      });
  });

  it('remembers selected input devices on preview', () => {
    const videoDevice = deviceMap.videoInput[deviceMap.videoInput.length - 1];
    const audioDevice = deviceMap.audioInput[deviceMap.audioInput.length - 1];
    const audioOutputDevice = deviceMap.audioOutput[deviceMap.audioOutput.length - 1];

    sdk.preview(
      {
        ...previewConfig,
        settings: {
          audioInputDeviceId: audioDevice,
          videoDeviceId: videoDevice,
          audioOutputDeviceId: audioOutputDevice,
        },
      },
      previewListener,
    );

    cy.get('@onPreview')
      .should('be.calledOnce')
      .then(async () => {
        const videoTrack = sdk.getLocalPeer().videoTrack;
        const audioTrack = sdk.getLocalPeer().audioTrack;

        const videoSettings = videoTrack.nativeTrack.getSettings();
        const audioSettings = audioTrack.nativeTrack.getSettings();
        expect(videoSettings.deviceId).to.equal(videoDevice);
        expect(audioSettings.deviceId).to.equal(audioDevice);
      });
  });

  it('remembers selected input devices on join', () => {
    sdk.preview(previewConfig, previewListener);

    const videoDevice = deviceMap.videoInput[deviceMap.videoInput.length - 1];
    const audioDevice = deviceMap.audioInput[deviceMap.audioInput.length - 1];

    cy.get('@onPreview')
      .should('be.calledOnce')
      .then(async () => {
        const videoTrack = sdk.getLocalPeer().videoTrack;
        const audioTrack = sdk.getLocalPeer().audioTrack;

        await videoTrack.setSettings({
          deviceId: videoDevice,
        });

        await audioTrack.setSettings({
          deviceId: audioDevice,
        });

        sdk.join(
          {
            authToken: token,
            initEndpoint,
            userName: 'test',
            settings: {
              isAudioMuted: false,
              isVideoMuted: false,
            },
          },
          updateListener,
        );

        cy.get('@onTrackUpdate')
          .should('be.calledTwice')
          .then(() => {
            const videoSettings = videoTrack.nativeTrack.getSettings();
            const audioSettings = audioTrack.nativeTrack.getSettings();
            expect(videoSettings.deviceId).to.equal(videoDevice);
            expect(audioSettings.deviceId).to.equal(audioDevice);
          });
      });
  });

  describe('join without preview', () => {
    it('reads the mute state in initial settings', () => {
      sdk.join(
        {
          authToken: token,
          initEndpoint,
          userName: 'test',
          settings: {
            isAudioMuted: true,
            isVideoMuted: true,
          },
        },
        updateListener,
      );

      cy.get('@onTrackUpdate')
        .should('be.calledTwice')
        .then(async () => {
          const videoTrack = sdk.getLocalPeer().videoTrack;
          const audioTrack = sdk.getLocalPeer().audioTrack;

          expect(videoTrack).not.to.be.undefined;
          expect(audioTrack).not.to.be.undefined;
          expect(videoTrack.enabled).to.equal(false);
          expect(audioTrack.enabled).to.equal(false);
        });
    });

    it('remembers device change during mute and applies it after unmute', () => {
      sdk.join(
        {
          authToken: token,
          initEndpoint,
          userName: 'test',
          settings: {
            isAudioMuted: true,
            isVideoMuted: true,
          },
        },
        updateListener,
      );

      cy.get('@onTrackUpdate')
        .should('be.calledTwice')
        .then(async () => {
          const videoTrack = sdk.getLocalPeer().videoTrack;
          const audioTrack = sdk.getLocalPeer().audioTrack;

          expect(videoTrack.enabled).to.equal(false);
          expect(audioTrack.enabled).to.equal(false);

          const videoDevice = deviceMap.videoInput[deviceMap.videoInput.length - 1];
          const audioDevice = deviceMap.audioInput[deviceMap.audioInput.length - 1];

          await videoTrack.setSettings({
            deviceId: videoDevice,
          });

          await audioTrack.setSettings({
            deviceId: audioDevice,
          });

          await videoTrack.setEnabled(true);

          const videoSettings = videoTrack.nativeTrack.getSettings();

          expect(videoSettings.deviceId).to.equal(videoDevice);

          await audioTrack.setEnabled(true);

          const audioSettings = audioTrack.nativeTrack.getSettings();

          expect(audioSettings.deviceId).to.equal(audioDevice);
        });
    });
  });
});
