import { createActor, createMachine } from 'xstate';

const toggleMachine = createMachine({
  context: {
    enabled: false,
    nextState: undefined,
  },
  initial: 'disabled',
  states: {
    enabled: {
      entry: ({ context }) => {
        context.enabled = true;
      },
      on: {
        toggle: 'progress',
      },
    },
    disabled: {
      on: {
        toggle: 'progress',
      },
      entry: ({ context }) => {
        context.enabled = false;
      },
    },
    progress: {},
  },
});

const countActor = createActor(toggleMachine).start();

countActor.subscribe(state => {
  console.log(state.context.count);
});

countActor.send({ type: 'INC' });
// logs 1
countActor.send({ type: 'DEC' });
// logs 0
countActor.send({ type: 'SET', value: 10 });
// logs 10
