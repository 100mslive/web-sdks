/// <reference types="cypress" />

import type { HMSLocalPeer } from '../packages/hms-video-store/src/core/hmsSDKStore/sdkTypes';

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Get token required for preview/join
       * @param title
       */
      getToken(role?: string): Chainable<string>;
      localTracksAdded(localPeer: HMSLocalPeer, options: { join: string; trackUpdate: string }): Chainable<void>;
    }
  }
}
