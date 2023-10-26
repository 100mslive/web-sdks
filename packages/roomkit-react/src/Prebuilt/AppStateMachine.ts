import { createMachine } from '@xstate/fsm';

export type MachineContext = {
  isLeaveEnabled: boolean;
  isPreviewEnabled: boolean;
};

export type MachineEvent =
  | { type: 'entry' }
  | { type: 'SET_DATA'; data: MachineContext }
  | { type: 'PREVIEW' }
  | { type: 'JOIN' }
  | { type: 'REJOIN' }
  | { type: 'LEAVE' };
export const AppStateMachine = () =>
  createMachine<MachineContext, MachineEvent>({
    id: 'app-state',
    initial: 'disconnected',
    context: {
      isLeaveEnabled: true,
      isPreviewEnabled: true,
    },
    states: {
      disconnected: {
        on: {
          PREVIEW: {
            target: 'preview',
          },
          SET_DATA: {
            actions: (context, event) => {
              if (event.type === 'SET_DATA') {
                context.isPreviewEnabled = event.data.isPreviewEnabled;
                context.isLeaveEnabled = event.data.isLeaveEnabled;
              }
            },
          },
        },
      },
      preview: {
        on: {
          entry: {
            target: 'conferencing',
            cond: context => !context.isPreviewEnabled,
          },
          JOIN: 'conferencing',
        },
      },
      conferencing: {
        on: {
          LEAVE: 'leave',
        },
      },
      leave: {
        on: {
          entry: {
            target: 'preview',
            cond: context => !context.isLeaveEnabled,
          },
          REJOIN: {
            target: 'preview',
          },
        },
      },
    },
  });
