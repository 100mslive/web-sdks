import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { Value_Type } from '../grpc/sessionstore';
import { StoreClient } from '../grpc/sessionstore.client';
import { OPEN_WAIT_TIMEOUT } from '../utils';

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

  async open({ handleOpen, handleChange, handleError }: OpenCallbacks<T>, retry = 0) {
    const abortController = new AbortController();
    const call = this.storeClient.open(
      {
        changeId: '',
        select: [],
      },
      { abort: abortController.signal },
    );
    const initialValues: T[] = [];
    let initialised = false;

    // on open, wait to call handleOpen with the pre-existing values from the store
    const openTimeoutID = setTimeout(() => {
      console.log('handle open', openTimeoutID, initialValues);
      handleOpen(initialValues);
      initialised = true;
    }, OPEN_WAIT_TIMEOUT);

    console.log('opening', openTimeoutID);

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
      console.log(openTimeoutID, error);
      const canRecover = RETRY_ERROR_MESSAGES.includes(error.message.toLowerCase());
      const shouldRetryInstantly = error.message.toLowerCase() === 'network error';

      clearTimeout(openTimeoutID);
      const openCallback = () => {
        abortController.abort(`closing ${openTimeoutID} to open new conn`);
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

    return () => {
      abortController.abort(WHITEBOARD_CLOSE_MESSAGE + ' ' + openTimeoutID);
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
