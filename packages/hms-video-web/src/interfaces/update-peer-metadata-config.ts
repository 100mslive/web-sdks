/**
 * If both name and data is undefined: Message is ignored.
 * If data is undefined: Name of the peer is changed.
 * If name is undefined: Metadata of the peer is updated.
 */
export interface UpdatePeerMetadataConfig {
  name?: string;
  data?: Record<string, any>;
}
