
import React from 'react';
import { HMSActions,HMSRoomProvider } from '@100mslive/react-sdk';
import { storyBookNotifications, storyBookSDK, storyBookStore } from '../store/SetupFakeStore';
interface StoryHMSProviderWrapperProps {
    children?: React.ReactNode
}

export const StoryHMSProviderWrapper = (props: React.PropsWithChildren<StoryHMSProviderWrapperProps>) => {
    return (
        <HMSRoomProvider 
            store={storyBookStore} 
            actions={storyBookSDK as unknown as HMSActions}
            notifications={storyBookNotifications}>
                {props.children}
        </HMSRoomProvider>
    );
}