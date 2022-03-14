import { HMSUpdateListener } from '../interfaces';
import { NetworkHealth, ScoreMap } from '../signal/init/models';
import HMSLogger from '../utils/logger';
import { sleep } from '../utils/timer-utils';

export class NetworkTestManager {
  private TAG = 'NetworkTestManager';
  constructor(private listener?: HMSUpdateListener) {}

  start = async ({ timeout, scoreMap }: NetworkHealth) => {
    const controller = new AbortController();
    const signal = controller.signal;

    const startTime = Date.now();
    let downloadedSize = 0;
    const timeoutPromise = sleep(timeout).then(() => {
      controller.abort();
      return true;
    });
    try {
      const url = 'https://d2qi07yyjujoxr.cloudfront.net/webapp/playlist/audio2.mp3';
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
          HMSLogger.e(this.TAG, error);
          this.listener?.onNetworkQuality?.(-1);
        });
    } catch (error) {
      HMSLogger.e(this.TAG, error);
      if ((error as Error).name !== 'AbortError') {
        this.listener?.onNetworkQuality?.(-1);
      }
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
