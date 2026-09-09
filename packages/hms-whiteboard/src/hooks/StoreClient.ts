import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { Value_Type } from '../grpc/sessionstore';
import { StoreClient } from '../grpc/sessionstore.client';
import { BackoffState, calculateBackoff } from '../utils';
import {
  INITIAL_BACKOFF_MS,
  RETRY_ERROR_MESSAGES,
  WHITEBOARD_CLOSE_MESSAGE,
  WHITEBOARD_RECONNECT_MESSAGE,
  WHITEBOARD_REOPEN_MESSAGE,
} from '../constants';
interface OpenCallbacks<T> {
  handleOpen: (values: T[]) => void;
  handleChange: (key: string, value?: T) => void;
  handleError: (error: Error, isTerminal?: boolean) => void;
}
export class SessionStore<T> {
  private storeClient: StoreClient;
  /** Teardown state for the stream generation that is currently live. */
  private abortController?: AbortController;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private onlineHandler?: () => void;

  constructor(endpoint: string, token: string) {
    const transport = new GrpcWebFetchTransport({
      baseUrl: endpoint,
      meta: { Authorization: `Bearer ${token}` },
    });

    this.storeClient = new StoreClient(transport);
  }

  /**
   * Starts streaming session store changes and returns the handle that closes it.
   * The handle is returned synchronously so a caller can never unmount without it.
   */
  open(
    { handleOpen, handleChange, handleError }: OpenCallbacks<T>,
    backoffState: BackoffState = { attempt: 0, currentDelay: INITIAL_BACKOFF_MS },
  ) {
    // open() is the only place a stream is created, so replacing any still-live generation here
    // means no stream can be orphaned by a caller that opens twice.
    this.teardown();
    const abortController = new AbortController();
    this.abortController = abortController;
    const call = this.storeClient.open(
      {
        changeId: '',
        select: [],
      },
      { abort: abortController.signal },
    );
    let count: number | undefined = undefined;
    const initialValues: T[] = [];
    let isConnected = false;

    call.responses.onMessage(message => {
      // Reset backoff state on successful message (connection is working)
      if (!isConnected) {
        isConnected = true;
        backoffState = { attempt: 0, currentDelay: INITIAL_BACKOFF_MS };
      }

      if (message.value) {
        if (message.value?.data.oneofKind === 'str') {
          const record = JSON.parse(message.value.data.str) as T;
          if (initialValues.length === count) {
            handleChange(message.key, record);
          } else {
            initialValues.push(record);
            if (initialValues.length === count) {
              handleOpen(initialValues);
            }
          }
        }
      } else {
        handleChange(message.key);
      }
    });

    // Reconnect immediately when the browser comes back online
    const handleOnline = () => {
      this.teardown(WHITEBOARD_RECONNECT_MESSAGE);
      this.open({ handleOpen, handleChange, handleError }); // reset backoff
    };

    this.onlineHandler = handleOnline;
    window.addEventListener('online', handleOnline);

    call.responses.onError(error => {
      console.error('GRPCOpenStreamError: ', error);
      // Our own teardown, not a connection failure. The signal is authoritative where the message
      // is not: Chrome reports the abort reason before streaming starts and an AbortError after.
      if (abortController.signal.aborted) {
        return;
      }

      handleError(error);

      const nextState: BackoffState = {
        attempt: backoffState.attempt + 1,
        currentDelay: calculateBackoff(backoffState),
      };

      // Apply exponential backoff before reconnecting
      this.reconnectTimer = setTimeout(() => {
        this.open({ handleOpen, handleChange, handleError }, nextState);
      }, backoffState.currentDelay);
    });

    this.getKeysCountWithDelay()
      .then(keysCount => {
        // A close or reconnect landed while the count was in flight - its records are stale now.
        if (abortController.signal.aborted) {
          return;
        }
        count = keysCount;
        handleOpen(count ? initialValues : []);
      })
      .catch(error => {
        console.error('GRPCCountError: ', error);
        const canRecover = RETRY_ERROR_MESSAGES.includes((error as unknown as Error).message.toLowerCase());
        handleError(error as unknown as Error, canRecover);
      });

    return () => this.teardown(WHITEBOARD_CLOSE_MESSAGE);
  }

  /**
   * Closes the live stream generation and cancels any reconnect it had scheduled.
   * `reason` is diagnostic only - Chrome drops it once the response body is streaming.
   */
  private teardown(reason: string = WHITEBOARD_REOPEN_MESSAGE) {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;

    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = undefined;
    }

    this.abortController?.abort(reason);
    this.abortController = undefined;
  }

  set(key: string, value?: T) {
    const valueStr = value ? JSON.stringify(value) : undefined;
    return this.storeClient.set({
      key,
      value: valueStr
        ? {
            data: { str: valueStr, oneofKind: 'str' },
            type: Value_Type.STRING,
          }
        : {
            data: { oneofKind: undefined },
            type: Value_Type.NONE,
          },
    });
  }

  async get(key: string) {
    const { response } = await this.storeClient.get({ key });

    if (response.value?.data.oneofKind === 'str') {
      return JSON.parse(response.value.data.str) as T;
    }
  }

  async getKeysCount() {
    const { response } = await this.storeClient.count({});
    return Number(response.count);
  }

  delete(key: string) {
    return this.storeClient.delete({ key });
  }

  private async getKeysCountWithDelay() {
    const MAX_RETRIES = 3;
    const DELAY = 200;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, DELAY));
        return await this.getKeysCount();
      } catch (error) {
        console.warn(error);
        if ((error as unknown as Error).message !== 'peer not found' || i === MAX_RETRIES - 1) {
          throw error;
        }
      }
    }
  }
}
