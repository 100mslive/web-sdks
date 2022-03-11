import { HMSException } from '../error/HMSException';
import { HMSUpdateListener } from '../interfaces';
import { NetworkHealth, ScoreMap } from '../signal/init/models';
import { sleep } from '../utils/timer-utils';

export class NetworkTestManager {
  constructor(private listener?: HMSUpdateListener) {}

  start = async ({ url, timeout, scoreMap }: NetworkHealth) => {
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
          const score = this.calculateScore(scoreMap, bitrate);
          console.error({ score });
          if (!res) {
            this.listener?.onNetworkQuality?.(score);
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

  calculateScore = (scoreMap: ScoreMap, bitrate: number) => {
    for (const key in scoreMap) {
      const map = scoreMap[key];
      if (bitrate >= map.low && (!map.high || bitrate <= map.high)) {
        return Number(key);
      }
    }
    return -1;
  };
}
