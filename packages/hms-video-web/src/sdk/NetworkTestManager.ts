import { HMSUpdateListener } from '../interfaces';
import { sleep } from '../utils/timer-utils';

export class NetworkTestManager {
  constructor(private listener?: HMSUpdateListener) {}
  start({ url, timeout }: { url: string; timeout: number }) {
    const controller = new AbortController();
    const signal = controller.signal;

    const startTime = Date.now();
    fetch(url, { signal })
      .then(res => {
        let downloadedSize = 0;

        const readerPromise = new Promise<{ timeout: boolean }>(resolve => {
          res.body
            ?.getReader()
            .read()
            .then(({ done, value }) => {
              if (value) {
                downloadedSize = value.byteLength;
              }
              if (done) {
                resolve({ timeout: false });
              }
            })
            .catch(console.error);
        });
        const timeoutPromise = sleep(timeout).then(() => {
          controller.abort();
          return { timeout: true };
        });
        return Promise.race([readerPromise, timeoutPromise]).then(res => {
          const totalTimeInSecs = (Date.now() - startTime) / 1000;
          const sizeInKB = downloadedSize / 1024;
          const bitrate = (sizeInKB / totalTimeInSecs) * 8;
          console.error(sizeInKB, totalTimeInSecs, res, bitrate);
        });
      })
      .catch(error => {
        this.listener?.onError(error);
      });
  }
}
