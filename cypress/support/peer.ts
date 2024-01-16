import {
  HMSReactiveStore,
  selectIsConnectedToRoom,
  selectLocalAudioTrackID,
  selectLocalPeerID,
  selectLocalVideoTrackID,
  selectPeerByID,
  selectRoleByRoleName,
} from '@100mslive/hms-video-store';
import { IHMSActions } from '@100mslive/hms-video-store/src/IHMSActions';
import { IHMSStoreReadOnly } from '@100mslive/hms-video-store/src/IHMSStore';
import { HMSSdk } from '@100mslive/hms-video-store/src/sdk';

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
    this.sdk.setLogLevel(0);
    this.name = `peer_${Math.random().toString(36).slice(2, 7)}`; // random suffix
    this.authToken = token;
  }

  get id() {
    return this.store.getState(selectLocalPeerID);
  }

  get sdkPeer() {
    return this.sdk.getLocalPeer();
  }

  get videoTrack() {
    return this.store.getState(selectLocalVideoTrackID);
  }

  get audioTrack() {
    return this.store.getState(selectLocalAudioTrackID);
  }

  join = async () => {
    await this.actions.join({ userName: this.name, authToken: this.authToken, initEndpoint: this.initEndpoint });
    await this.waitForTracks(this.id);
    return `peer ${this.name} joined`;
  };

  waitForTracks = async (peerId: string) => {
    return new Promise(resolve => {
      // eslint-disable-next-line complexity
      this.store.subscribe(peer => {
        if (!peer) {
          return;
        }
        const allowed = this.store.getState(selectRoleByRoleName(peer.roleName))?.publishParams?.allowed || [];
        const isAudioAlright = allowed.includes('audio') ? peer.audioTrack : !peer.audioTrack;
        const isVideoAlright = allowed.includes('video') ? peer.videoTrack : !peer.videoTrack;
        if (isAudioAlright && isVideoAlright) {
          resolve(true);
        }
      }, selectPeerByID(peerId));
    });
  };

  /**
   * changeRole("newrole") // changes self role
   * changeRole("newRole", peerid) // changes role of passed in peer
   * waits till the role changes is actually reflected in store
   */
  changeRole = async (toRole: string, peerId?: string, force = true) => {
    if (!peerId) {
      peerId = this.id;
    }
    await this.actions.changeRole(peerId, toRole, force);
    return this.waitTillRoleChange(toRole, peerId);
  };

  getPeerById = (peerId: string) => {
    return this.store.getState(selectPeerByID(peerId));
  };

  leave = async () => {
    await this.actions.leave();
  };

  isConnected = () => {
    return this.store.getState(selectIsConnectedToRoom);
  };

  /**
   * waits till the role for the passed in peer is changed to passed in toRole.
   * If peer is not passed wait till self role changes.
   */
  waitTillRoleChange = async (toRole: string, forPeerId?: string) => {
    if (!forPeerId) {
      forPeerId = this.id;
    }
    return new Promise(resolve => {
      this.store.subscribe(peer => {
        if (peer?.roleName === toRole) {
          resolve(true);
        }
      }, selectPeerByID(forPeerId));
    });
  };
}
