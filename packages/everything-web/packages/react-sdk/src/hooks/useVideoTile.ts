import {
    selectIsPeerAudioEnabled,
    selectIsPeerVideoEnabled,
    selectPeerAudioByID,
    selectVideoTrackByPeerID
} from '@100mslive/hms-video-store';
import { useRef, useEffect } from 'react';
import { useHMSActions, useHMSStore } from '..';

interface UseVideoTileType {
    videoRef: any;
    isAudioOn: boolean;
    isVideoOn: boolean;
    actions: any;
    isLocal: boolean;
    name: string;
    audioLevel: boolean;
}

export const useVideoTile = (peer: any): UseVideoTileType => {
    const actions = useHMSActions();
    const videoRef = useRef(null);
    const videoTrack = useHMSStore(selectVideoTrackByPeerID(peer.id));
    const isAudioOn = useHMSStore(selectIsPeerAudioEnabled(peer.id));
    const isVideoOn = useHMSStore(selectIsPeerVideoEnabled(peer.id));
    const { isLocal, name } = peer;
    const audioLevel = useHMSStore(selectPeerAudioByID(peer.id)) > 0;
    useEffect(() => {
        if (videoRef.current && videoTrack) {
            if (videoTrack.enabled) {
                actions.attachVideo(videoTrack.id, videoRef.current);
            } else {
                actions.detachVideo(videoTrack.id, videoRef.current);
            }
        }
    }, [videoTrack, actions]);
    return {
        videoRef,
        isAudioOn,
        isVideoOn,
        actions,
        isLocal,
        name,
        audioLevel
    };
};
