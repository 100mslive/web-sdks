import React from 'react';
import { useVideoTile } from '@100mslive/react-sdk';
import { Preview } from './Preview';
import { Avatar, IconButton, getInitials } from '@100mslive/react-ui';
import { VideoOnIcon, VideoOffIcon, MicOnIcon, MicOffIcon } from '@100mslive/react-icons';
import { HmsSetting } from './HmsSetting';

export const HmsPreviewTile = ({ peer }: any) => {
    const { actions, videoRef, isLocal, isAudioOn, isVideoOn, audioLevel } = useVideoTile(peer);
    const initials = getInitials(peer.name);
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
