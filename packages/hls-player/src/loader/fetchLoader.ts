import {
  HlsConfig,
  Loader,
  LoaderCallbacks,
  LoaderConfiguration,
  LoaderContext,
  LoaderOnProgress,
  LoaderResponse,
  LoaderStats,
  LoadStats,
} from 'hls.js';
import { types } from 'util';
import ChunkCache from './chunkCache';

export function fetchSupported() {
  if (
    // @ts-ignore
    window.fetch &&
    window.AbortController &&
    window.ReadableStream &&
    window.Request
  ) {
    try {
      new window.ReadableStream({}); // eslint-disable-line no-new
      return true;
    } catch (e) {
      /* noop */
    }
  }
  return false;
}

const BYTERANGE = /(\d+)-(\d+)\/(\d+)/;

class FetchLoader implements Loader<LoaderContext> {
  private fetchSetup: NonNullable<HlsConfig['fetchSetup']>;
  private requestTimeout?: number;
  private request: Promise<Request> | Request | null = null;
  private response: Response | null = null;
  private controller: AbortController;
  public context: LoaderContext | null = null;
  //@ts-ignore
  private config: LoaderConfiguration | null = null;
  private callbacks: LoaderCallbacks<LoaderContext> | null = null;
  public stats: LoaderStats;
  //@ts-ignore
  private loader: Response | null = null;

  constructor(config: HlsConfig) {
    this.fetchSetup = config.fetchSetup || getRequest;
    this.controller = new window.AbortController();
    this.stats = new LoadStats();
  }

  destroy(): void {
    this.loader = this.callbacks = this.context = this.config = this.request = null;
    this.abortInternal();
    this.response = null;
    // @ts-ignore
    this.fetchSetup = this.controller = this.stats = null;
  }

  abortInternal(): void {
    if (this.controller && !this.stats.loading.end) {
      this.stats.aborted = true;
      this.controller.abort();
    }
  }

  abort(): void {
    this.abortInternal();
    if (this.callbacks?.onAbort) {
      this.callbacks.onAbort(this.stats, this.context as LoaderContext, this.response);
    }
  }

  load(context: LoaderContext, config: LoaderConfiguration, callbacks: LoaderCallbacks<LoaderContext>): void {
    const stats = this.stats;
    if (stats.loading.start) {
      throw new Error('Loader can only be used once.');
    }
    stats.loading.start = window.performance.now();

    const initParams = getRequestParameters(context, this.controller.signal);
    const isArrayBuffer = context.responseType === 'arraybuffer';
    const { maxTimeToFirstByteMs, maxLoadTimeMs } = config.loadPolicy;

    this.context = context;
    this.config = config;
    this.callbacks = callbacks;
    this.request = this.fetchSetup(context, initParams);
    window.clearTimeout(this.requestTimeout);
    config.timeout =
      maxTimeToFirstByteMs && Number.isFinite(maxTimeToFirstByteMs) ? maxTimeToFirstByteMs : maxLoadTimeMs;
    this.requestTimeout = window.setTimeout(() => {
      if (this.callbacks) {
        this.abortInternal();
        this.callbacks.onTimeout(stats, context, this.response);
      }
    }, config.timeout);

    const fetchPromise = types.isPromise(this.request)
      ? this.request.then(req => window.fetch(req as Request))
      : window.fetch(this.request as Request);

    fetchPromise
      // eslint-disable-next-line complexity
      .then((response: Response): Promise<string | ArrayBuffer> => {
        this.response = this.loader = response;
        console.log('response', response);
        // Retrieve your custom cookie header from the response
        //@ts-ignore
        const cookieHeaders = Array.from(response.headers.values());
        console.log('cookieHeaders', cookieHeaders);
        // let edgeCookie = '';
        // if (setCookieheaders) {
        //   const cookieArray = setCookieheaders.split(';');

        // }
        // if (edgeCookie) {
        //   // Manually set the cookie using document.cookie with required attributes
        //   document.cookie = `Edge-Cache-Cookie=${edgeCookie}; Path=/; SameSite=None; Secure`;
        // }
        const first = Math.max(window.performance.now(), stats.loading.start);

        window.clearTimeout(this.requestTimeout);
        config.timeout = maxLoadTimeMs;
        this.requestTimeout = window.setTimeout(() => {
          if (this.callbacks) {
            this.abortInternal();
            this.callbacks.onTimeout(stats, context, this.response);
          }
        }, maxLoadTimeMs - (first - stats.loading.start));
        console.log(response);
        if (!response.ok) {
          const { status, statusText } = response;
          throw new FetchError(statusText || 'fetch, bad network response', status, response);
        }
        stats.loading.first = first;

        stats.total = getContentLength(response.headers) || stats.total;

        const onProgress = this.callbacks?.onProgress;
        if (onProgress && Number.isFinite(config.highWaterMark)) {
          return this.loadProgressively(response, stats, context, config.highWaterMark, onProgress);
        }

        if (isArrayBuffer) {
          return response.arrayBuffer();
        }
        if (context.responseType === 'json') {
          return response.json();
        }
        return response.text();
      })
      .then((responseData: string | ArrayBuffer) => {
        const response = this.response;
        if (!response) {
          throw new Error('loader destroyed');
        }
        window.clearTimeout(this.requestTimeout);
        stats.loading.end = Math.max(window.performance.now(), stats.loading.first);
        const total = isArrayBuffer ? (responseData as ArrayBuffer).byteLength : (responseData as string).length;
        if (total) {
          stats.loaded = stats.total = total;
        }

        const loaderResponse: LoaderResponse = {
          url: response.url,
          data: responseData,
          code: response.status,
        };

        const onProgress = this.callbacks?.onProgress;
        if (onProgress && !Number.isFinite(config.highWaterMark)) {
          onProgress(stats, context, responseData, response);
        }

        this.callbacks?.onSuccess(loaderResponse, stats, context, response);
      })
      .catch(error => {
        console.log('response', error);
        window.clearTimeout(this.requestTimeout);
        if (stats.aborted) {
          return;
        }
        // CORS errors result in an undefined code. Set it to 0 here to align with XHR's behavior
        // when destroying, 'error' itwindow can be undefined
        const code: number = !error ? 0 : error.code || 0;
        const text: string = !error ? null : error.message;
        this.callbacks?.onError({ code, text }, context, error ? error.details : null, stats);
      });
  }

  getCacheAge(): number | null {
    let result: number | null = null;
    if (this.response) {
      const ageHeader = this.response.headers.get('age');
      result = ageHeader ? parseFloat(ageHeader) : null;
    }
    return result;
  }

  getResponseHeader(name: string): string | null {
    return this.response ? this.response.headers.get(name) : null;
  }

  private loadProgressively(
    response: Response,
    stats: LoaderStats,
    context: LoaderContext,
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    highWaterMark: number = 0,
    onProgress: LoaderOnProgress<LoaderContext>,
  ): Promise<ArrayBuffer> {
    const chunkCache = new ChunkCache();
    const reader = (response.body as ReadableStream).getReader();

    const pump = (): Promise<ArrayBuffer> => {
      return reader
        .read()
        .then(data => {
          if (data.done) {
            if (chunkCache.dataLength) {
              onProgress(stats, context, chunkCache.flush().buffer as ArrayBuffer, response);
            }

            return Promise.resolve(new ArrayBuffer(0));
          }
          const chunk: Uint8Array = data.value;
          const len = chunk.length;
          stats.loaded += len;
          if (len < highWaterMark || chunkCache.dataLength) {
            // The current chunk is too small to to be emitted or the cache already has data
            // Push it to the cache
            chunkCache.push(chunk);
            if (chunkCache.dataLength >= highWaterMark) {
              // flush in order to join the typed arrays
              onProgress(stats, context, chunkCache.flush().buffer as ArrayBuffer, response);
            }
          } else {
            // If there's nothing cached already, and the chache is large enough
            // just emit the progress event
            onProgress(stats, context, chunk.buffer as ArrayBuffer, response);
          }
          return pump();
        })
        .catch(() => {
          /* aborted */
          return Promise.reject();
        });
    };

    return pump();
  }
}

function getRequestParameters(context: LoaderContext, signal: AbortSignal): any {
  const initParams: any = {
    method: 'GET',
    mode: 'cors',
    credentials: 'same-origin',
    signal,
    headers: new window.Headers(Object.assign({}, context.headers)),
  };

  if (context.rangeEnd) {
    initParams.headers.set('Range', `bytes=${context.rangeStart}-${String(context.rangeEnd - 1)}`);
  }

  return initParams;
}

function getByteRangeLength(byteRangeHeader: string): number | undefined {
  const result = BYTERANGE.exec(byteRangeHeader);
  if (result) {
    return parseInt(result[2]) - parseInt(result[1]) + 1;
  }
  return undefined;
}

function getContentLength(headers: Headers): number | undefined {
  const contentRange = headers.get('Content-Range');
  if (contentRange) {
    const byteRangeLength = getByteRangeLength(contentRange);
    if (Number.isFinite(byteRangeLength)) {
      return byteRangeLength;
    }
  }
  const contentLength = headers.get('Content-Length');
  if (contentLength) {
    return parseInt(contentLength);
  }
  return undefined;
}

function getRequest(context: LoaderContext, initParams: any): Request {
  return new window.Request(context.url, initParams);
}

class FetchError extends Error {
  public code: number;
  public details: any;
  constructor(message: string, code: number, details: any) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export default FetchLoader;
