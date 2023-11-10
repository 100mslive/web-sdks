import { createMachine } from '@xstate/fsm';
import { HMSRoomState } from '@100mslive/react-sdk';

export type PrebuiltStateMachineContext = {
  isLeaveEnabled: boolean;
  isPreviewEnabled: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
};

export type PrebuiltStateMachineEvent =
  | { type: 'Rejoin' }
  | { type: 'InitContext'; data: PrebuiltStateMachineContext }
  | { type: HMSRoomState };
export const PrebuiltStateMachine = () =>
  createMachine<PrebuiltStateMachineContext, PrebuiltStateMachineEvent>({
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
          InitContext: {
            actions: (context, event) => {
              if (event.type === 'InitContext') {
                context.isPreviewEnabled = event.data.isPreviewEnabled;
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
          Rejoin: [
            { target: 'conferencing', cond: context => !context.isPreviewEnabled },
            { target: 'preview', cond: context => context.isPreviewEnabled },
          ],
        },
      },
    },
  });
