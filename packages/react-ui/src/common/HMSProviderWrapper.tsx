
import React from 'react';
import { useDarkMode } from 'storybook-dark-mode';
import { HMSActions,HMSRoomProvider } from '@100mslive/react-sdk';
import { storyBookNotifications,storyBookSDK, storyBookStore } from '../store/SetupFakeStore';
import { HMSThemeProvider, ThemeTypes } from '../Theme';

interface StoryHMSProviderWrapperProps {
    children?: React.ReactNode
}

export const StoryHMSProviderWrapper = (props: React.PropsWithChildren<StoryHMSProviderWrapperProps>) => {
    const isDark = useDarkMode();
    return (
        <HMSRoomProvider
            store={storyBookStore}
            actions={storyBookSDK as unknown as HMSActions}
            notifications={storyBookNotifications}>
            <HMSThemeProvider themeType={ isDark ? ThemeTypes.dark : ThemeTypes.light}>
                {props.children}
            </HMSThemeProvider>
        </HMSRoomProvider>
    );
}