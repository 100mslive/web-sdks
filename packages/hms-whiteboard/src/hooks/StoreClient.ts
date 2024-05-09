import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { Value_Type } from '../grpc/sessionstore';
import { StoreClient } from '../grpc/sessionstore.client';

interface OpenCallbacks<T> {
  handleOpen: (values: T[]) => void;
  handleChange: (key: string, value?: T) => void;
  handleError: (error: Error) => void;
}

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
    const call = this.storeClient.open({
      changeId: '',
      select: [],
    });
    /**
     * on open, get key count to call handleOpen with the pre-existing values from the store
     */
    const keyCount = await this.getKeysCount();
    const initialValues: T[] = [];

    if (!keyCount) {
      handleOpen([]);
    }

    call.responses.onMessage(message => {
      if (message.value) {
        if (message.value?.data.oneofKind === 'str') {
          const record = JSON.parse(message.value.data.str) as T;
          if (initialValues.length === keyCount) {
            handleChange(message.key, record);
          } else {
            initialValues.push(record);
            if (initialValues.length === keyCount) {
              handleOpen(initialValues);
            }
          }
        }
      } else {
        handleChange(message.key);
      }
    });

    call.responses.onError(error => {
      handleError(error);
    });

    call.status.then(status => {
      console.log('SessionStoreClient open', status);
    });
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
