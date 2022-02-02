import { HMSPeer, HMSTrack, HMSTrackID, selectTracksMap } from '@100mslive/hms-video-store';
import React, { useMemo } from 'react';
import {
  calculateLayoutSizes,
  chunkElements,
  getModeAspectRatio,
  getVideoTracksFromPeers,
  TrackWithPeer,
} from '../utils/layout';
import { useHMSVanillaStore } from '../primitives/HmsRoomProvider';
import { useResizeDetector } from 'react-resize-detector';

export interface useVideoListInput {
  /**
   * peers is the list of all peers you need to render.
   */
  peers: HMSPeer[];
  /**
   * Max tiles in a  page. Overrides maxRowCount and maxColCount
   */
  maxTileCount?: number;
  /**
   * max number of rows for tiles
   */
  maxRowCount?: number;
  /**
   * max number of columns for tiles
   */
  maxColCount?: number;
  /**
   * Given a screensharing peer the function should return true if their screenShare should be
   * included for the video tile, and false otherwise.
   * This can be useful if there are multiple screenshares in the room where you may want to show one in the
   * center view and others in video list along side other tiles. No screenShare is included by default.
   * e.g. includeScreenShare = (peer) => return peer.id !== mainScreenSharingPeer.id
   */
  includeScreenShareForPeer?: (peer: HMSPeer) => boolean;
  /**
   *
   */
  overflow?: 'scroll-x' | 'scroll-y' | 'hidden';
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
}

export interface useVideoResult {
  /**
   * This returns a list of all pages with every page containing the list of all tiles on it.
   */
  pagesWithTiles: (TrackWithPeer & {
    width: number;
    height: number;
  })[][];
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
 * a list of pages with every page having a 2D matrix of video tiles, tiles showing per row.
 * Please check the documentation of input and output types for more details.
 */
export const useVideoList = ({
  peers,
  maxTileCount,
  maxColCount,
  maxRowCount,
  includeScreenShareForPeer = () => false,
  overflow = 'scroll-x',
  aspectRatio = DEFAULTS.aspectRatio,
  filterNonPublishingPeers = true,
}: useVideoListInput): useVideoResult => {
  const { width = 0, height = 0, ref } = useResizeDetector();
  const store = useHMSVanillaStore();
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
      // Flooring since there's a bug in react-slick where it converts width into a number
      calculateLayoutSizes({
        count,
        parentWidth: Math.floor(width),
        parentHeight: Math.floor(height),
        maxTileCount,
        maxRowCount,
        maxColCount,
        aspectRatio: finalAspectRatio,
      }),
    [count, width, height, maxTileCount, maxRowCount, maxColCount, finalAspectRatio],
  );
  const chunkedTracksWithPeer = useMemo(
    () =>
      chunkElements<TrackWithPeer>({
        elements: tracksWithPeer,
        tilesInFirstPage,
        onlyOnePage: overflow === 'hidden',
        isLastPageDifferentFromFirstPage,
        defaultWidth,
        defaultHeight,
        lastPageWidth,
        lastPageHeight,
      }),
    [
      tracksWithPeer,
      tilesInFirstPage,
      overflow,
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
