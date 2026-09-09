import { SessionStore } from './StoreClient';
import { INITIAL_BACKOFF_MS } from '../constants';

jest.mock('@protobuf-ts/grpcweb-transport', () => ({
  GrpcWebFetchTransport: jest.fn().mockImplementation(() => ({})),
}));

interface FakeStream {
  signal: AbortSignal;
  emitError: (error: Error) => void;
}

const streams: FakeStream[] = [];
let countResponse: () => Promise<{ response: { count: string } }>;

jest.mock('../grpc/sessionstore.client', () => ({
  StoreClient: jest.fn().mockImplementation(() => ({
    open: (_input: unknown, options: { abort: AbortSignal }) => {
      const stream: FakeStream = { signal: options.abort, emitError: () => undefined };
      streams.push(stream);
      return {
        responses: {
          onMessage: () => undefined,
          onError: (callback: (error: Error) => void) => {
            stream.emitError = callback;
          },
        },
      };
    },
    count: () => countResponse(),
  })),
}));

// Matches the delay getKeysCountWithDelay waits before its first count call.
const COUNT_RETRY_DELAY_MS = 200;

const buildCallbacks = () => ({
  handleOpen: jest.fn(),
  handleChange: jest.fn(),
  handleError: jest.fn(),
});

// Every store is closed in afterEach - an open one keeps an 'online' listener on window and
// would reconnect during a later test's 'online' event.
const openHandles: (() => void)[] = [];

// A real JWT is not needed - SessionStore only forwards the token as a metadata header.
const openSessionStore = (callbacks = buildCallbacks()) => {
  const sessionStore = new SessionStore<unknown>('https://store-qa-in2-grpc.100ms.live', 'whiteboard-token');
  const close = sessionStore.open(callbacks);
  openHandles.push(close);
  return { close, callbacks, sessionStore };
};

beforeEach(() => {
  jest.useFakeTimers();
  streams.length = 0;
  openHandles.length = 0;
  countResponse = () => Promise.resolve({ response: { count: '0' } });
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  openHandles.forEach(close => close());
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('SessionStore.open', () => {
  it('returns the close handle synchronously so callers cannot miss it', () => {
    const { close } = openSessionStore();

    expect(typeof close).toBe('function');
  });

  it('aborts the live stream on close', () => {
    const { close } = openSessionStore();

    close();

    expect(streams).toHaveLength(1);
    expect(streams[0].signal.aborted).toBe(true);
  });

  it('aborts the reconnected stream on close, not the stream it replaced', () => {
    const { close } = openSessionStore();

    streams[0].emitError(new Error('network error'));
    jest.advanceTimersByTime(INITIAL_BACKOFF_MS);
    expect(streams).toHaveLength(2);

    close();

    expect(streams[1].signal.aborted).toBe(true);
  });

  it('does not reconnect after close when a retry is already scheduled', () => {
    const { close } = openSessionStore();

    streams[0].emitError(new Error('network error'));
    close();
    jest.advanceTimersByTime(INITIAL_BACKOFF_MS * 10);

    expect(streams).toHaveLength(1);
  });

  it('replaces the live stream when opened again without an explicit close', () => {
    const { sessionStore, callbacks } = openSessionStore();

    openHandles.push(sessionStore.open(callbacks));

    expect(streams).toHaveLength(2);
    expect(streams[0].signal.aborted).toBe(true);
  });

  it('treats an abort surfaced as the abort reason as intentional, not as a failure', () => {
    const { callbacks } = openSessionStore();

    // Reconnect on 'online' aborts the stream. Chrome rejects a not-yet-streaming fetch with the
    // abort reason itself, so the old stream reports that string rather than an AbortError.
    window.dispatchEvent(new Event('online'));
    expect(streams).toHaveLength(2);
    streams[0].emitError(new Error('reconnecting due to online event'));
    jest.advanceTimersByTime(INITIAL_BACKOFF_MS * 10);

    expect(streams).toHaveLength(2);
    expect(callbacks.handleError).not.toHaveBeenCalled();
  });

  it('does not log an error when the stream ends because we closed it', () => {
    const { close } = openSessionStore();

    close();
    streams[0].emitError(new Error('BodyStreamBuffer was aborted'));

    expect(console.error).not.toHaveBeenCalled();
  });

  it('logs a genuine stream failure', () => {
    openSessionStore();

    streams[0].emitError(new Error('network error'));

    expect(console.error).toHaveBeenCalledWith('GRPCOpenStreamError: ', expect.any(Error));
  });

  it('does not report a count failure that lands after close', async () => {
    countResponse = () => Promise.reject(new Error('network error'));
    const { close, callbacks } = openSessionStore();

    close();
    await jest.advanceTimersByTimeAsync(COUNT_RETRY_DELAY_MS);

    expect(callbacks.handleError).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('reports a genuine stream failure and reconnects', () => {
    const { callbacks } = openSessionStore();

    streams[0].emitError(new Error('network error'));

    expect(callbacks.handleError).toHaveBeenCalled();
    jest.advanceTimersByTime(INITIAL_BACKOFF_MS);
    expect(streams).toHaveLength(2);
  });
});
