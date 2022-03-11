import { HMSException } from '../error/HMSException';
import { HMSUpdateListener } from '../interfaces';
import { sleep } from '../utils/timer-utils';

export class NetworkTestManager {
  constructor(private listener?: HMSUpdateListener) {}

  start = async ({ url, timeout }: { url: string; timeout: number }) => {
    const controller = new AbortController();
    const signal = controller.signal;

    const startTime = Date.now();
    let downloadedSize = 0;
    const timeoutPromise = sleep(timeout).then(() => {
      controller.abort();
      return true;
    });
    try {
      const res = await fetch(url, { signal });
      const reader = res.body?.getReader();
      if (!reader) {
        throw Error('unable to process request');
      }
      const readData = async () => {
        if (!reader) {
          return;
        }
        const { value, done } = await reader.read();
        if (!done) {
          downloadedSize += value.byteLength;
          await readData();
        }
      };

      return Promise.race([readData(), timeoutPromise])
        .then(res => {
          const totalTimeInSecs = (Date.now() - startTime) / 1000;
          const sizeInKB = downloadedSize / 1024;
          const bitrate = (sizeInKB / totalTimeInSecs) * 8;
          if (!res) {
            this.listener?.onNetworkQuality?.(bitrate);
          }
          console.error({ sizeInKB, bitrate, totalTimeInSecs });
        })
        .catch(error => {
          this.listener?.onError(error);
        });
    } catch (error) {
      this.listener?.onError(error as HMSException);
    }
  };
}
