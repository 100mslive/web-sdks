import { createSelector } from 'reselect';
import { byIDCurry, StoreSelector, StoreTypes } from './common';
import { selectMessagesMap, selectPeersMap, selectTracksMap } from './selectors';
import { createPeerTrackFinder } from './selectorUtils';
import { HMSMessage, HMSPeer, HMSPeerID, HMSStore, HMSTrack, HMSTrackID } from '../schema';

/**
 * Factory for creating track selectors by ID with type safety
 */
export function createTrackByIDSelector<T extends HMSTrack>(trackFilter: (track: HMSTrack) => track is T) {
  const selectTrackByIDBare = createSelector(
    [selectTracksMap, (_store: HMSStore, trackID: HMSTrackID | undefined) => trackID],
    (storeTracks, trackID) => {
      if (!trackID) {
        return null;
      }
      const track = storeTracks[trackID];
      return trackFilter(track) ? track : null;
    },
  );
  return byIDCurry(selectTrackByIDBare);
}

/**
 * Factory for creating peer track selectors with specific track types
 */
export function createPeerTrackSelector<T extends HMSTrack>(
  trackFilter: (track: HMSTrack) => track is T,
  trackSource?: 'primary' | 'auxiliary' | 'all',
) {
  const trackFinder = createPeerTrackFinder(trackFilter);

  return byIDCurry(
    createSelector(
      [selectTracksMap, selectPeersMap, (_store: HMSStore, peerID: HMSPeerID | undefined) => peerID],
      (tracks, peersMap, peerID) => {
        if (!peerID) {
          return undefined;
        }
        const peer = peersMap[peerID];

        if (trackSource === 'primary') {
          // Only check primary tracks
          if (peer?.audioTrack && trackFilter(tracks[peer.audioTrack])) {
            return tracks[peer.audioTrack] as T;
          }
          if (peer?.videoTrack && trackFilter(tracks[peer.videoTrack])) {
            return tracks[peer.videoTrack] as T;
          }
          return undefined;
        } else if (trackSource === 'auxiliary') {
          // Only check auxiliary tracks
          if (peer) {
            for (const trackID of peer.auxiliaryTracks) {
              const track = tracks[trackID];
              if (trackFilter(track)) {
                return track as T;
              }
            }
          }
          return undefined;
        } else {
          // Check all tracks (default)
          return trackFinder(tracks, peer) as T | undefined;
        }
      },
    ),
  );
}

/**
 * Factory for creating message filter selectors
 */
export function createMessageFilterSelector(messageFilter: (message: HMSMessage) => boolean) {
  return createSelector(selectMessagesMap, messages => Object.values(messages).filter(messageFilter));
}

/**
 * Factory for creating unread count selectors for filtered messages
 */
export function createUnreadCountSelector(messageFilter: (message: HMSMessage) => boolean) {
  return createSelector(createMessageFilterSelector(messageFilter), messages => messages.filter(m => !m.read).length);
}

/**
 * Factory for creating peer filter selectors
 */
export function createPeerFilterSelector(peerFilter: (peer: HMSPeer) => boolean) {
  return createSelector(selectPeersMap, peersMap => Object.values(peersMap).filter(peerFilter));
}

/**
 * Factory for creating generic store property selectors
 */
export function createStorePropertySelector<T>(propertyPath: string[]): StoreSelector<HMSStore, T | undefined> {
  return (store: HMSStore) => {
    let value: any = store;
    for (const key of propertyPath) {
      value = value?.[key];
    }
    return value as T | undefined;
  };
}

/**
 * Factory for creating presence checkers (boolean selectors)
 */
export function createPresenceSelector<S extends StoreTypes>(
  valueSelector: StoreSelector<S, any>,
  presenceCheck: (value: any) => boolean = value => !!value,
): StoreSelector<S, boolean> {
  return createSelector(valueSelector, presenceCheck);
}

/**
 * Factory for creating count selectors from array selectors
 */
export function createCountSelector<S extends StoreTypes>(
  arraySelector: StoreSelector<S, any[]>,
): StoreSelector<S, number> {
  return createSelector(arraySelector, array => array?.length || 0);
}
