import { interpret, StateMachine } from 'xstate';
import { EventBus } from '../../../events/EventBus';
import HMSLogger from '../../../utils/logger';

export abstract class TrackStateMachineAdapter<
  TContext extends Record<string, any>,
  TEvent extends { type: string },
  TStateMachine extends StateMachine<TContext, any, TEvent, any>,
> {
  protected service: any; // InterpreterFrom has type issues with xstate versions
  protected readonly TAG: string;

  constructor(
    protected machine: TStateMachine,
    protected eventBus: EventBus,
    protected tag: string,
    initialContext?: Partial<TContext>,
  ) {
    this.TAG = tag;

    // Create service with initial context if provided
    this.service = interpret(
      initialContext
        ? this.machine.withContext({ ...this.machine.initialState.context, ...initialContext })
        : this.machine,
    );

    // Setup state change listener
    this.service.onTransition(state => {
      if (state.changed) {
        this.onStateChange(state);
      }
    });

    // Start the service
    this.service.start();
  }

  protected abstract onStateChange(state: any): void;

  protected send(event: TEvent): void {
    HMSLogger.d(this.TAG, 'Sending event:', event.type, event);
    this.service.send(event);
  }

  protected get context(): TContext {
    return this.service.getSnapshot().context as TContext;
  }

  protected get state(): any {
    return this.service.getSnapshot().value;
  }

  protected isInState(state: string): boolean {
    return this.service.getSnapshot().matches(state) as boolean;
  }

  public cleanup(): void {
    this.service.stop();
  }
}
