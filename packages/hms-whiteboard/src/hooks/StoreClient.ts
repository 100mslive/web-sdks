import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { Value_Type } from '../grpc/sessionstore';
import { StoreClient } from '../grpc/sessionstore.client';

interface OpenCallbacks<T> {
  handleOpen: (values: T[]) => void;
  handleChange: (key: string, value?: T) => void;
  handleError: (error: Error, isTerminal?: boolean) => void;
}

const WHITEBOARD_CLOSE_MESSAGE = 'client whiteboard abort';
const RETRY_ERROR_MESSAGES = ['network error', 'failed to fetch'];

// Exponential backoff configuration
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const BACKOFF_MULTIPLIER = 2;

interface BackoffState {
  attempt: number;
  currentDelay: number;
}

const calculateBackoff = (state: BackoffState): number => {
  const delay = Math.min(state.currentDelay * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);
  // Add jitter (±20%) to prevent thundering herd
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
};

export class SessionStore<T> {
  private storeClient: StoreClient;

  constructor(endpoint: string, token: string) {
    const transport = new GrpcWebFetchTransport({
      baseUrl: endpoint,
      meta: { Authorization: `Bearer ${token}` },
    });

    this.storeClient = new StoreClient(transport);
  }

  async open(
    { handleOpen, handleChange, handleError }: OpenCallbacks<T>,
    backoffState: BackoffState = { attempt: 0, currentDelay: INITIAL_BACKOFF_MS },
  ) {
    const abortController = new AbortController();
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

    call.responses.onError(error => {
      // Don't retry if this was an abort - either intentional close or already reconnecting
      if (error.message.includes('abort')) {
        return;
      }

      handleError(error);

      const nextDelay = calculateBackoff(backoffState);
      const nextState: BackoffState = {
        attempt: backoffState.attempt + 1,
        currentDelay: nextDelay,
      };

      const openCallback = () => {
        abortController.abort(`closing to open new conn`);
        this.open({ handleOpen, handleChange, handleError }, nextState);
      };

      // Apply exponential backoff before reconnecting
      setTimeout(openCallback, backoffState.currentDelay);
    });

    // Reconnect immediately when the browser comes back online
    const handleOnline = () => {
      abortController.abort('reconnecting due to online event');
      this.open({ handleOpen, handleChange, handleError }); // reset backoff
    };

    window.addEventListener('online', handleOnline);

    try {
      count = await this.getKeysCountWithDelay();
      handleOpen(count ? initialValues : []);
    } catch (error) {
      const canRecover = RETRY_ERROR_MESSAGES.includes((error as unknown as Error).message.toLowerCase());
      handleError(error as unknown as Error, canRecover);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      abortController.abort(WHITEBOARD_CLOSE_MESSAGE);
    };
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
