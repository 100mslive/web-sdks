import React from 'react';
import { Dialog } from '../Dialog';
import { SettingIcon, CrossIcon } from '@100mslive/react-icons';
import { Text } from '../Text';
import { IconButton } from '../IconButton';
import { Select } from '../Select';
import { HorizontalDivider, styled } from '../..';
import { useDevices } from '@100mslive/react-sdk';

export const HmsSetting = () => {
    const {
        // @ts-ignore
        showVideo,
        // @ts-ignore
        videoInput,
        // @ts-ignore
        showAudio,
        // @ts-ignore
        audioInput,
        // @ts-ignore
        handleInputChange,
        // @ts-ignore
        selectedDevices,
        // @ts-ignore
        isSubscribing,
        // @ts-ignore
        audioOutput
    } = useDevices();
    return (
        <Dialog.Root>
            <Dialog.Overlay />
            <Dialog.Trigger asChild>
                <IconButton>
                    <SettingIcon />
                </IconButton>
            </Dialog.Trigger>
            <Dialog.Content>
                <Flex type="sb">
                    <Flex>
                        <SettingIcon width={36} height={36} />{' '}
                        <Text css={{ marginLeft: '10px' }} as="span" variant="heading-lg">
                            Settings
                        </Text>
                    </Flex>

                    <Dialog.Close asChild>
                        <IconButton>
                            <CrossIcon />
                        </IconButton>
                    </Dialog.Close>
                </Flex>
                <HorizontalDivider />
                {showVideo ? (
                    <Fieldset>
                        <Label>Camera:</Label>
                        {videoInput.length > 0 ? (
                            <Select
                                // @ts-ignore
                                onChange={handleInputChange}
                                value={selectedDevices.videoInputDeviceId}
                            >
                                {videoInput.map((device: MediaDeviceInfo) => (
                                    <option value={device.deviceId} key={device.deviceId}>
                                        {device.label}
                                    </option>
                                ))}
                            </Select>
                        ) : null}
                    </Fieldset>
                ) : null}
                {showAudio ? (
                    <Fieldset>
                        <Label>Camera:</Label>
                        {videoInput.length > 0 ? (
                            <Select
                                // @ts-ignore
                                onChange={handleInputChange}
                                value={selectedDevices.audioInputDeviceId}
                            >
                                {audioInput.map((device: MediaDeviceInfo) => (
                                    <option value={device.deviceId} key={device.deviceId}>
                                        {device.label}
                                    </option>
                                ))}
                            </Select>
                        ) : null}
                    </Fieldset>
                ) : null}
                {isSubscribing && audioOutput.length > 0 ? (
                    <Fieldset>
                        <Label>Speaker:</Label>
                        <Select
                            // @ts-ignore
                            onChange={handleInputChange}
                            value={selectedDevices.audioOutputDeviceId}
                        >
                            {audioOutput.map((device: MediaDeviceInfo) => (
                                <option value={device.deviceId} key={device.deviceId}>
                                    {device.label}
                                </option>
                            ))}
                        </Select>
                    </Fieldset>
                ) : null}
            </Dialog.Content>
        </Dialog.Root>
    );
};

const Flex = styled('div', {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    variants: {
        type: {
            sb: {
                justifyContent: 'space-between'
            }
        }
    }
});

const Fieldset = styled('fieldset', {
    width: '100%',
    all: 'unset',
    display: 'flex',
    gap: 20,
    alignItems: 'center',
    margin: '20px 0'
});

const Label = styled('label', {
    display: 'flex',
    width: '33.3333%',
    justifyContent: 'flex-end'
});
