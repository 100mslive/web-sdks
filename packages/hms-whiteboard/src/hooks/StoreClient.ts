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

export class SessionStore<T> {
  private storeClient: StoreClient;

  constructor(endpoint: string, token: string) {
    const transport = new GrpcWebFetchTransport({
      baseUrl: endpoint,
      meta: { Authorization: `Bearer ${token}` },
    });

    this.storeClient = new StoreClient(transport);
  }

  async open({ handleOpen, handleChange, handleError }: OpenCallbacks<T>) {
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

    call.responses.onMessage(message => {
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
      const canRecover = RETRY_ERROR_MESSAGES.includes(error.message.toLowerCase());
      const shouldRetryInstantly = error.message.toLowerCase() === 'network error';

      const openCallback = () => {
        abortController.abort(`closing to open new conn`);
        this.open({ handleOpen, handleChange, handleError });
        window.removeEventListener('online', openCallback);
      };
      if (canRecover) {
        shouldRetryInstantly && openCallback();
        window.addEventListener('online', openCallback);
      }

      if (!error.message.includes('abort')) {
        handleError(error, !canRecover);
      }
    });

    count = await this.getKeysCountWithDelay();
    handleOpen(count ? initialValues : []);

    return () => {
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
        console.log(error);
        if ((error as unknown as Error).message !== 'peer not found' || i === MAX_RETRIES - 1) {
          throw error;
        }
      }
    }
  }
}
