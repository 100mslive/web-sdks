import React from 'react';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogClose,
    DialogOverlay
} from '@radix-ui/react-dialog';
import { SettingIcon, CrossIcon } from '@100mslive/react-icons';
import { Text } from '../Text';
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
        <Dialog>
            <Overlay />
            <Trigger>
                <SettingIcon />
            </Trigger>
            <Content>
                <Flex type="sb">
                    <Flex>
                        <SettingIcon width={36} height={36} />{' '}
                        <Text css={{ marginLeft: '10px' }} as="span" variant="heading-lg">
                            Settings
                        </Text>
                    </Flex>

                    <Close>
                        <CrossIcon />
                    </Close>
                </Flex>
                <HorizontalDivider />
                {showVideo ? (
                    <Fieldset>
                        <Label>Camera:</Label>
                        {videoInput.length > 0 ? (
                            <Select
                                name="videoInputDeviceId"
                                onChange={handleInputChange}
                                value={selectedDevices.videoInputDeviceId}>
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
                                name="audioInputDeviceId"
                                onChange={handleInputChange}
                                value={selectedDevices.audioInputDeviceId}>
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
                            name="audioOutputDeviceId"
                            onChange={handleInputChange}
                            value={selectedDevices.audioOutputDeviceId}>
                            {audioOutput.map((device: MediaDeviceInfo) => (
                                <option value={device.deviceId} key={device.deviceId}>
                                    {device.label}
                                </option>
                            ))}
                        </Select>
                    </Fieldset>
                ) : null}
            </Content>
        </Dialog>
    );
};

const Content = styled(DialogContent, {
    color: 'White',
    backgroundColor: '$grey1',
    borderRadius: '8px',
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90vw',
    maxWidth: '450px',
    maxHeight: '85vh',
    padding: '20px',
    '@media (prefers-reduced-motion: no-preference)': {
        willChange: 'transform'
    },
    '&:focus': { outline: 'none' }
});

const Trigger = styled(DialogTrigger, {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '$sans',
    outline: 'none',
    border: 'none',
    padding: '4px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: 'White',
    '&:focus': {
        boxShadow: '0 0 0 3px $colors$brandTint'
    },
    '&:hover': {
        backgroundColor: '$grey2'
    }
});
const Close = styled(DialogClose, {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '$sans',
    outline: 'none',
    border: 'none',
    padding: '4px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: 'White',
    '&:focus': {
        boxShadow: '0 0 0 3px $colors$brandTint'
    },
    '&:hover': {
        backgroundColor: '$grey2'
    }
});

const Overlay = styled(DialogOverlay, {
    backgroundColor: 'rgba(0, 0, 0, 0.5);',
    position: 'fixed',
    inset: 0
});

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

const Select = styled('select', {
    display: 'flex',
    width: '67%',
    justifyContent: 'flex-start',
    border: 'none',
    padding: '8px 12px',
    backgroundColor: '$grey2',
    borderRadius: '8px',
    outline: 'none',
    color: 'White'
});
