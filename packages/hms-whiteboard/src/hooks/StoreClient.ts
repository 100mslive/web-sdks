import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { Value_Type } from '../grpc/sessionstore';
import { StoreClient } from '../grpc/sessionstore.client';
import { OPEN_WAIT_TIMEOUT } from '../utils';

interface OpenCallbacks<T> {
  handleOpen: (values: T[]) => void;
  handleChange: (key: string, value?: T) => void;
  handleError: (error: Error) => void;
}

const WHITEBOARD_CLOSE_MESSAGE = 'client whiteboard abort';

export class SessionStore<T> {
  private storeClient: StoreClient;
  private abortController = new AbortController();

  constructor(endpoint: string, token: string) {
    const transport = new GrpcWebFetchTransport({
      baseUrl: endpoint,
      meta: { Authorization: `Bearer ${token}` },
    });

    this.storeClient = new StoreClient(transport);
  }

  async open({ handleOpen, handleChange, handleError }: OpenCallbacks<T>) {
    const call = this.storeClient.open(
      {
        changeId: '',
        select: [],
      },
      { abort: this.abortController.signal },
    );
    const initialValues: T[] = [];
    let initialised = false;

    // on open, wait to call handleOpen with the pre-existing values from the store
    setTimeout(() => {
      handleOpen(initialValues);
      initialised = true;
    }, OPEN_WAIT_TIMEOUT);

    call.responses.onMessage(message => {
      if (message.value) {
        if (message.value?.data.oneofKind === 'str') {
          const record = JSON.parse(message.value.data.str) as T;
          if (initialised) {
            handleChange(message.key, record);
          } else {
            initialValues.push(record);
          }
        }
      } else {
        handleChange(message.key);
      }
    });

    call.responses.onError(error => {
      if (!error.message.includes('abort')) {
        handleError(error);
      }
    });

    return () => {
      this.abortController.abort(WHITEBOARD_CLOSE_MESSAGE);
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
}
