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
          NEXT: [
            { target: 'conferencing', cond: context => !context.isPreviewEnabled },
            { target: 'preview', cond: context => context.isPreviewEnabled },
          ],
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
          NEXT: 'conferencing',
        },
      },
      conferencing: {
        on: {
          NEXT: [
            { target: 'leave', cond: context => context.isLeaveEnabled },
            { target: 'preview', cond: context => !context.isLeaveEnabled },
          ],
        },
      },
      leave: {
        on: {
          NEXT: {
            target: 'preview',
          },
        },
      },
    },
  });
