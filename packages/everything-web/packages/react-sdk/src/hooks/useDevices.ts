import {
    selectLocalMediaSettings,
    selectDevices,
    selectIsAllowedToPublish,
    selectIsAllowedToSubscribe,
    HMSMediaSettings
} from '@100mslive/hms-video-store';
import { ChangeEventHandler } from 'react';
import { useHMSActions, useHMSStore } from './HmsRoomProvider';

export const useDevices = () => {
    const hmsActions = useHMSActions();
    const devices = useHMSStore(selectDevices);
    const selectedDevices = useHMSStore(selectLocalMediaSettings);
    const { video: showVideo, audio: showAudio } = useHMSStore(selectIsAllowedToPublish);
    const isSubscribing = useHMSStore(selectIsAllowedToSubscribe);

    const handleInputChange: ChangeEventHandler<any> = (event) => {
        const selectedDevice = event.currentTarget.value;
        const { name } = event.currentTarget;
        if (selectedDevice !== selectedDevices[name as keyof HMSMediaSettings]) {
            switch (name) {
                case 'audioInputDeviceId':
                    hmsActions.setAudioSettings({ deviceId: selectedDevice });
                    break;
                case 'videoInputDeviceId':
                    hmsActions.setVideoSettings({ deviceId: selectedDevice });
                    break;
                case 'audioOutputDeviceId':
                    hmsActions.setAudioOutputDevice(selectedDevice);
                    break;
                default:
                    break;
            }
        }
    };

    const videoInput = devices.videoInput || [];
    const audioInput = devices.audioInput || [];
    const audioOutput = devices.audioOutput || [];
    const showSettings = [showVideo, showAudio, isSubscribing].some((val) => !!val);
    if (!showSettings) {
        return null;
    }

    return {
        showVideo,
        videoInput,
        showAudio,
        audioInput,
        audioOutput,
        isSubscribing,
        selectedDevices,
        handleInputChange
    };
};
