import {
  HMSReactiveStore,
  selectIsConnectedToRoom,
  selectLocalAudioTrackID,
  selectLocalPeer,
  selectLocalPeerRole,
  selectLocalPeerRoleName,
  selectLocalVideoTrackID,
  selectRemotePeers,
} from '@100mslive/hms-video-store';
import { IHMSStoreReadOnly } from '../../packages/hms-video-store/src/core/IHMSStore';
import { IHMSActions } from '@100mslive/hms-video-store/src/core/IHMSActions';
import { HMSSdk } from '../../packages/hms-video-web/src';

/**
 * helper for dealing with peers creates in cypress.
 * Functions which return promise are meant to be used with cy.wrap -
 * @example
 * ```
 * cy.wrap(peer.changeRole("abcd")).then(()=> expectThings());
 * ```
 * ```
 * cy.wrap(peer.holdTillConnected()).then(()=> expectThings());
 * ```
 */
export class CypressPeer {
  actions: IHMSActions;
  store: IHMSStoreReadOnly;
  sdk: HMSSdk;
  name: string;
  initEndpoint: string = Cypress.env('CYPRESS_INIT_ENDPOINT');
  authToken: string;

  constructor(token: string) {
    const hms = new HMSReactiveStore();
    hms.triggerOnSubscribe();
    this.actions = hms.getActions();
    this.store = hms.getStore();
    // @ts-ignore
    this.sdk = this.actions.sdk;
    this.name = `peer_${Math.random().toString(36).slice(2, 7)}`; // random suffix
    this.authToken = token;
  }

  get id() {
    return this.store.getState(selectLocalPeer)?.id;
  }

  get sdkPeer() {
    return this.sdk.getLocalPeer();
  }

  getVideoTrackId() {
    return this.store.getState(selectLocalVideoTrackID);
  }

  getAudioTrackId() {
    return this.store.getState(selectLocalAudioTrackID);
  }

  join = async () => {
    this.actions.join({ userName: this.name, authToken: this.authToken, initEndpoint: this.initEndpoint });
    await this.waitTillConnected();
    await this.waitForTracks();
    return `peer ${this.name} joined`;
  };

  changeRole = async (toRole: string, force = true) => {
    await this.actions.changeRole(this.id, toRole, force);
    // promise till role actually changes
    return new Promise(resolve => {
      this.store.subscribe(role => {
        if (role === toRole) {
          resolve(role);
        }
      }, selectLocalPeerRoleName);
    });
  };

  getRemotePeer = () => {
    return this.store.getState(selectRemotePeers)[0];
  };

  leave = async () => {
    await this.actions.leave();
  };

  isConnected = () => {
    return this.store.getState(selectIsConnectedToRoom);
  };

  private waitTillConnected = async () => {
    return new Promise(resolve => {
      this.store.subscribe(isConnected => {
        if (isConnected) {
          resolve(true);
        }
      }, selectIsConnectedToRoom);
    });
  };

  private waitForTracks = async () => {
    return new Promise(resolve => {
      this.store.subscribe(peer => {
        const allowed = this.store.getState(selectLocalPeerRole)?.publishParams?.allowed || [];
        const isAudioAlright = !allowed.includes('audio') || peer.audioTrack;
        const isVideoAlright = !allowed.includes('video') || peer.videoTrack;
        if (isAudioAlright && isVideoAlright) {
          resolve(true);
        }
      }, selectLocalPeer);
    });
  };
}
