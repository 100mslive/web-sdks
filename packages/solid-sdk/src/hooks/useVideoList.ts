import { HMSPeer, HMSTrack, HMSTrackID, selectTracksMap } from '@100mslive/hms-video-store';
import { Accessor, createMemo } from 'solid-js';
import {
  calculateLayoutSizes,
  chunkElements,
  getModeAspectRatio,
  getVideoTracksFromPeers,
  TrackWithPeer,
} from '../utils/layout';
import { useHMSVanillaStore } from '../primitives/HmsRoomProvider';
// import { useResizeDetector } from 'react-resize-detector';

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
   * A function which tells whether to show the screenShare for a peer who is screensharing. A peer is passed
   * and a boolean value is expected.
   * This can be useful if there are multiple screenShares in the room where you may want to show the main one in the
   * center view and others in video list along side other tiles. No screenShare is included by default.
   * e.g. includeScreenShare = (peer) => return peer.id !== mainScreenSharingPeer.id
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
  pagesWithTiles: Accessor<useVideoListTile[][]>;
  /**
   * add the ref to the element going to render the video list, this is used to measure the available
   * space/dimensions in order to calculate the best fit
   */
  ref: any;
}

const DEFAULTS = {
  aspectRatio: {
    width: 1,
    height: 1,
  },
  includeScreenShareForPeer: () => false,
  filterNonPublishingPeers: true,
  offsetY: 0,
};

/**
 * This hook can be used to build a paginated gallery view of video tiles. You can give the hook
 * a list of all the peers which need to be shown and it tells you how to structure the UI by giving
 * a list of pages with every page having a list of video tiles.
 * Please check the documentation of input and output types for more details.
 */
export const useVideoList = (props: useVideoListInput): useVideoResult => {
  const { width = 0, height = 0 } = {};
  let ref: any;
  const store = useHMSVanillaStore();
  // using vanilla store as we don't need re-rendering everytime something in a track changes
  const tracksMap: Record<HMSTrackID, HMSTrack> = store.getState(selectTracksMap);
  const tracksWithPeer: TrackWithPeer[] = getVideoTracksFromPeers(
    props.peers,
    tracksMap,
    props.includeScreenShareForPeer || DEFAULTS.includeScreenShareForPeer,
    props.filterNonPublishingPeers,
  );
  const finalAspectRatio = createMemo(() => {
    if (props.aspectRatio) {
      return props.aspectRatio;
    }
    const modeAspectRatio = getModeAspectRatio(tracksWithPeer);
    // Default to 1 if there are no video tracks
    return {
      width: modeAspectRatio || 1,
      height: 1,
    };
  });
  const count = tracksWithPeer.length;
  const layoutSizes = createMemo(() =>
    calculateLayoutSizes({
      count,
      parentWidth: Math.floor(width),
      parentHeight: Math.floor(height) - Math.min(height, props.offsetY || DEFAULTS.offsetY),
      maxTileCount: props.maxTileCount,
      maxRowCount: props.maxRowCount,
      maxColCount: props.maxColCount,
      aspectRatio: finalAspectRatio(),
    }),
  );
  const chunkedTracksWithPeer = createMemo(() =>
    chunkElements<TrackWithPeer>({
      elements: tracksWithPeer,
      onlyOnePage: false,
      tilesInFirstPage: layoutSizes().tilesInFirstPage,
      isLastPageDifferentFromFirstPage: layoutSizes().isLastPageDifferentFromFirstPage,
      defaultWidth: layoutSizes().defaultWidth,
      defaultHeight: layoutSizes().defaultHeight,
      lastPageWidth: layoutSizes().lastPageWidth,
      lastPageHeight: layoutSizes().lastPageHeight,
    }),
  );
  return {
    pagesWithTiles: chunkedTracksWithPeer,
    ref,
  };
};
