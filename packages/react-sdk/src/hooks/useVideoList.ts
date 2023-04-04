import React, { useMemo } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import { HMSPeer, HMSTrack, HMSTrackID, selectTracksMap } from '@100mslive/hms-video-store';
import { useHMSVanillaStore } from '../primitives/HmsRoomProvider';
import {
  calculateLayoutSizes,
  chunkElements,
  getModeAspectRatio,
  getVideoTracksFromPeers,
  TrackWithPeer,
} from '../utils/layout';

export interface useVideoListInput {
  /**
   * peers is the list of all peers you need to display
   */
  peers: HMSPeer[];
  /**
   * Max tiles in a  page. Overrides maxRowCount and maxColCount
   */
  maxTileCount?: number;
  /**
   * Max rows in a  page. Only applied if maxTileCount is not present
   */
  maxRowCount?: number;
  /**
   * Max columns in a  page. Only applied if maxTileCount and maxRowCount are not present
   */
  maxColCount?: number;
  /**
   * A function which tells whether to show the screenshare for a peer who is sharing their screen. A peer is passed
   * and a boolean value is expected.
   * This can be useful if there are multiple screenShares in the room where you may want to show the main one in the
   * center view and others in video list along side other tiles. No screenShare is included by default.
   * for example. includeScreenShare = (peer) => return peer.id !== mainScreenSharingPeer.id
   */
  includeScreenShareForPeer?: (peer: HMSPeer) => boolean;
  /**
   * Aspect ratio of VideoTiles, ideally this should be the same as the aspect ratio selected for
   * capture in the dashboard template.
   */
  aspectRatio?: { width: number; height: number };
  /**
   * By default this will be true. Only publishing(audio/video/screen) peers in the passed in peer list
   * will be filtered. If you wish to show all peers, pass false for this.
   */
  filterNonPublishingPeers?: boolean;
  /**
   * Height that would be subtracted from the parent's height to give the available height, use case: if your pagination is inside the parent component then offsetY would be the height of pagination
   */
  offsetY?: number;
}

export interface useVideoListTile extends TrackWithPeer {
  width: number;
  height: number;
}

export interface useVideoResult {
  /**
   * This returns a list of all pages with every page containing the list of all tiles on it.
   */
  pagesWithTiles: useVideoListTile[][];
  /**
   * add the ref to the element going to render the video list, this is used to measure the available
   * space/dimensions in order to calculate the best fit
   */
  ref: React.MutableRefObject<any>;
}

const DEFAULTS = {
  aspectRatio: {
    width: 1,
    height: 1,
  },
};

/**
 * This hook can be used to build a paginated gallery view of video tiles. You can give the hook
 * a list of all the peers which need to be shown and it tells you how to structure the UI by giving
 * a list of pages with every page having a list of video tiles.
 * Please check the documentation of input and output types for more details.
 */
export const useVideoList = ({
  peers,
  maxTileCount,
  maxColCount,
  maxRowCount,
  includeScreenShareForPeer = () => false,
  aspectRatio = DEFAULTS.aspectRatio,
  filterNonPublishingPeers = true,
  offsetY = 0,
}: useVideoListInput): useVideoResult => {
  const { width = 0, height = 0, ref } = useResizeDetector();
  const store = useHMSVanillaStore();
  // using vanilla store as we don't need re-rendering every time something in a track changes
  const tracksMap: Record<HMSTrackID, HMSTrack> = store.getState(selectTracksMap);
  const tracksWithPeer: TrackWithPeer[] = getVideoTracksFromPeers(
    peers,
    tracksMap,
    includeScreenShareForPeer,
    filterNonPublishingPeers,
  );
  const finalAspectRatio = useMemo(() => {
    if (aspectRatio) {
      return aspectRatio;
    }
    const modeAspectRatio = getModeAspectRatio(tracksWithPeer);
    // Default to 1 if there are no video tracks
    return {
      width: modeAspectRatio || 1,
      height: 1,
    };
  }, [aspectRatio, tracksWithPeer]);
  const count = tracksWithPeer.length;
  const {
    tilesInFirstPage,
    defaultWidth,
    defaultHeight,
    lastPageWidth,
    lastPageHeight,
    isLastPageDifferentFromFirstPage,
  } = useMemo(
    () =>
      calculateLayoutSizes({
        count,
        parentWidth: Math.floor(width),
        parentHeight: Math.floor(height) - Math.min(height, offsetY),
        maxTileCount,
        maxRowCount,
        maxColCount,
        aspectRatio: finalAspectRatio,
      }),
    [count, width, height, maxTileCount, maxRowCount, maxColCount, finalAspectRatio, offsetY],
  );
  const chunkedTracksWithPeer = useMemo(
    () =>
      chunkElements<TrackWithPeer>({
        elements: tracksWithPeer,
        tilesInFirstPage,
        onlyOnePage: false,
        isLastPageDifferentFromFirstPage,
        defaultWidth,
        defaultHeight,
        lastPageWidth,
        lastPageHeight,
      }),
    [
      tracksWithPeer,
      tilesInFirstPage,
      isLastPageDifferentFromFirstPage,
      defaultWidth,
      defaultHeight,
      lastPageWidth,
      lastPageHeight,
    ],
  );
  return {
    pagesWithTiles: chunkedTracksWithPeer,
    ref,
  };
};
