import React from 'react';
import { useVideoTile } from '@100mslive/react-sdk';
import { VideoOnIcon, VideoOffIcon, MicOnIcon, MicOffIcon } from '@100mslive/react-icons';
import { Preview } from './Preview';
import { HmsSetting } from './HmsSetting';
import { Avatar, getInitials, IconButton } from '../..';

// TODO: please add types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const HmsPreviewTile = ({ peer, name }: any) => {
    const { actions, videoRef, isLocal, isAudioOn, isVideoOn, audioLevel } = useVideoTile(peer);
    const initials = getInitials(name);
    return (
        <Preview.VideoRoot audioLevel={audioLevel}>
            {isVideoOn ? (
                <Preview.Video local={isLocal} ref={videoRef} autoPlay muted playsInline />
            ) : (
                <Avatar style={{ backgroundColor: '#4CAF50' }}>{initials}</Avatar>
            )}
            <Preview.Controls>
                <IconButton
                    active={isAudioOn}
                    onClick={() => actions.setLocalAudioEnabled(!isAudioOn)}>
                    {isAudioOn ? <MicOnIcon /> : <MicOffIcon />}
                </IconButton>
                <IconButton
                    active={isVideoOn}
                    onClick={() => actions.setLocalVideoEnabled(!isVideoOn)}>
                    {isVideoOn ? <VideoOnIcon /> : <VideoOffIcon />}
                </IconButton>
            </Preview.Controls>
            <Preview.Setting>
                <HmsSetting />
            </Preview.Setting>
            <Preview.BottomOverlay />
        </Preview.VideoRoot>
    );
};
