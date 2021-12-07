/// <reference types="cypress" />

import type { HMSLocalPeer } from '../packages/hms-video-store/src/core/hmsSDKStore/sdkTypes';

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Get token required for preview/join
       * @param title
       */
      getToken(): Chainable<string>;
      localTracksAdded(localPeer: HMSLocalPeer): Chainable<void>;
    }
  }
}
