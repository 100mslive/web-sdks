import { createMachine } from 'xstate';
import { TrackState } from '../notification-manager';

export const publishMachine = createMachine({
  id: 'publishMachine',
  initial: 'idle',
  context: {
    trackStates: new Map<string, TrackState>(),
    publishConnection: null,
  },
  states: {
    idle: {
      on: {
        PUBLISH: {
          target: 'publish',
          actions(context, event) {
            const track = event.track;
            track.publishedTrackId = track.getTrackIDBeingSent();
            context.trackStates.set(track.publishedTrackId, track);
          },
        },
      },
    },
    publish: {},
  },
});
