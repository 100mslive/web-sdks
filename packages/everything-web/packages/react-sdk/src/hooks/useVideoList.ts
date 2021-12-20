import { HMSPeer, HMSTrack, HMSTrackID, selectTracksMap } from '@100mslive/hms-video-store';
import { useMemo } from 'react';
import {
    calculateLayoutSizes,
    chunkElements,
    getModeAspectRatio,
    getVideoTracksFromPeers,
    TrackWithPeer
} from '../utils/layout';
import { useHMSVanillaStore } from './HmsRoomProvider';

interface UseVideoListProps {
    /**
    * Max tiles in a  page. Overrides maxRowCount and maxColCount
    */
    maxTileCount: number;
    maxRowCount: number;
    maxColCount: number;
    width: number;
    height: number;
    showScreenFn?: (peer: HMSPeer) => boolean;
    peers: HMSPeer[];
    overflow?: 'scroll-x' | 'scroll-y' | 'hidden';
    aspectRatio?: { width: number; height: number };
}

export const useVideoList = ({
    maxTileCount,
    maxColCount,
    maxRowCount,
    width,
    height,
    showScreenFn = () => false,
    peers,
    overflow = 'scroll-x',
    aspectRatio
}: UseVideoListProps) => {
    const store = useHMSVanillaStore();
    const tracksMap: Record<HMSTrackID, HMSTrack> = store.getState(selectTracksMap);
    const tracksWithPeer: TrackWithPeer[] = getVideoTracksFromPeers(peers, tracksMap, showScreenFn);
    const finalAspectRatio = useMemo(() => {
        if (aspectRatio) {
            return aspectRatio;
        }
        const modeAspectRatio = getModeAspectRatio(tracksWithPeer);
        // Default to 1 if there are no video tracks
        return {
            width: modeAspectRatio || 1,
            height: 1
        };
    }, [aspectRatio, tracksWithPeer]);
    const count = tracksWithPeer.length;
    const {
        tilesInFirstPage,
        defaultWidth,
        defaultHeight,
        lastPageWidth,
        lastPageHeight,
        isLastPageDifferentFromFirstPage
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
                aspectRatio: finalAspectRatio
            }),
        [count, width, height, maxTileCount, maxRowCount, maxColCount, finalAspectRatio]
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
                lastPageHeight
            }),
        [
            tracksWithPeer,
            tilesInFirstPage,
            overflow,
            isLastPageDifferentFromFirstPage,
            defaultWidth,
            defaultHeight,
            lastPageWidth,
            lastPageHeight
        ]
    );
    return {
        chunkedTracksWithPeer
    };
};
