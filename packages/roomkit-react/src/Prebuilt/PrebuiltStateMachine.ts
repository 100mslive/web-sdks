import { createMachine } from '@xstate/fsm';
import { HMSRoomState } from '@100mslive/react-sdk';

export type MachineContext = {
  isLeaveEnabled: boolean;
  isPreviewEnabled: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
};

export type MachineEvent =
  | { type: 'idle' }
  | { type: 'rejoin' }
  | { type: 'SET_DATA'; data: MachineContext }
  | { type: HMSRoomState };
export const PrebuiltStateMachine = () =>
  createMachine<MachineContext, MachineEvent>({
    id: 'prebuilt-state-machine',
    initial: 'idle',
    context: {
      isLeaveEnabled: true,
      isPreviewEnabled: true,
    },
    states: {
      idle: {
        on: {
          Connecting: [
            {
              target: 'conferencing',
              cond: context => !context.isPreviewEnabled,
            },

            {
              target: 'preview',
              cond: context => context.isPreviewEnabled,
            },
          ],
          Disconnected: [
            {
              target: 'conferencing',
              cond: context => !context.isPreviewEnabled,
            },

            {
              target: 'preview',
              cond: context => context.isPreviewEnabled,
            },
          ],
          SET_DATA: {
            actions: (context, event) => {
              if (event.type === 'SET_DATA') {
                context.isPreviewEnabled = !event.data.isPreviewEnabled;
                context.isLeaveEnabled = event.data.isLeaveEnabled;
                context.onJoin = event.data.onJoin;
                context.onLeave = event.data.onLeave;
              }
            },
          },
        },
      },
      preview: {
        on: {
          Connected: {
            target: 'conferencing',
            actions: context => context.onJoin?.(),
          },
        },
      },
      conferencing: {
        on: {
          Disconnecting: [
            { target: 'leave', cond: context => context.isLeaveEnabled, actions: context => context.onLeave?.() },
            { target: 'preview', cond: context => !context.isLeaveEnabled, actions: context => context.onLeave?.() },
          ],
        },
      },
      leave: {
        on: {
          rejoin: [
            { target: 'conferencing', cond: context => !context.isPreviewEnabled },
            { target: 'preview', cond: context => context.isPreviewEnabled },
          ],
        },
      },
    },
  });
