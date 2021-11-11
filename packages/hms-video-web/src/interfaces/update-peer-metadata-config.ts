/**
 * If both name and metadata is undefined: Message is ignored.
 * If metadata is undefined: Name of the peer is changed.
 * If name is undefined: Metadata of the peer is updated.
 * If both name and metadata is defined: Both name and metadata is updated
 */
export interface HMSPeerUpdateConfig {
  name?: string;
  metadata?: string;
}
