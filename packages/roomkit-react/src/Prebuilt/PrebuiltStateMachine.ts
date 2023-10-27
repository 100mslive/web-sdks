import { createMachine } from '@xstate/fsm';

export type MachineContext = {
  isLeaveEnabled: boolean;
  isPreviewEnabled: boolean;
};

export type MachineEvent = { type: 'entry' } | { type: 'SET_DATA'; data: MachineContext } | { type: 'NEXT' };
export const PrebuiltStateMachine = () =>
  createMachine<MachineContext, MachineEvent>({
    id: 'prebuilt-state-machine',
    initial: 'disconnected',
    context: {
      isLeaveEnabled: true,
      isPreviewEnabled: true,
    },
    states: {
      disconnected: {
        on: {
          NEXT: {
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
          NEXT: 'conferencing',
        },
      },
      conferencing: {
        on: {
          NEXT: 'leave',
        },
      },
      leave: {
        on: {
          entry: {
            target: 'preview',
            cond: context => !context.isLeaveEnabled,
          },
          NEXT: {
            target: 'preview',
          },
        },
      },
    },
  });
