import {
  LocalAudioTrackAnalytics,
  LocalBaseSample,
  LocalVideoSample,
  LocalVideoTrackAnalytics,
  PublishAnalyticPayload,
  RemoteAudioSample,
  RemoteAudioTrackAnalytis,
  RemoteVideoSample,
  RemoteVideoTrackAnalytics,
  SubscribeAnalyticPayload,
} from './interfaces';
import { EventBus } from '../../events/EventBus';
import { HMSTrackStats } from '../../interfaces';
import { HMSTrack } from '../../internal';
import { HMSWebrtcStats } from '../../rtc-stats';
import { IStore } from '../../sdk/store';
import HMSLogger from '../../utils/logger';
import { sleep } from '../../utils/timer-utils';

export abstract class BaseStatsAnalytics {
  private shouldSendEvent = false;
  protected sequenceNum = 1;

  constructor(
    protected store: IStore,
    protected eventBus: EventBus,
    protected readonly sampleWindowSize: number,
    protected readonly pushInterval: number,
  ) {
    this.start();
  }

  start() {
    if (this.shouldSendEvent) {
      return;
    }
    this.stop();
    this.shouldSendEvent = true;
    this.eventBus.statsUpdate.subscribe(this.handleStatsUpdate);
    this.startLoop().catch(e => HMSLogger.e('[PublishStatsAnalytics]', e.message));
  }

  stop = () => {
    if (this.shouldSendEvent) {
      this.sendEvent();
    }
    this.eventBus.statsUpdate.unsubscribe(this.handleStatsUpdate);
    this.shouldSendEvent = false;
  };

  private async startLoop() {
    while (this.shouldSendEvent) {
      await sleep(this.pushInterval * 1000);
      this.sendEvent();
    }
  }

  protected abstract sendEvent: () => void;

  protected abstract toAnalytics: () => PublishAnalyticPayload | SubscribeAnalyticPayload;

  protected abstract handleStatsUpdate: (hmsStats: HMSWebrtcStats) => void;
}

export type TempPublishStats = HMSTrackStats & { availableOutgoingBitrate?: number };

export abstract class RunningTrackAnalytics {
  readonly sampleWindowSize: number;
  track: HMSTrack;
  track_id: string;
  source: string;
  ssrc: string;
  kind: string;
  rid?: string;
  samples: (LocalBaseSample | LocalVideoSample | RemoteAudioSample | RemoteVideoSample)[] = [];

  protected tempStats: TempPublishStats[] = [];

  constructor({
    track,
    ssrc,
    rid,
    kind,
    sampleWindowSize,
  }: {
    track: HMSTrack;
    ssrc: string;
    kind: string;
    rid?: string;
    sampleWindowSize: number;
  }) {
    this.track = track;
    this.ssrc = ssrc;
    this.rid = rid;
    this.kind = kind;
    this.track_id = this.track.trackId;
    this.source = this.track.source!;
    this.sampleWindowSize = sampleWindowSize;
  }

  push(stat: TempPublishStats) {
    this.tempStats.push(stat);

    if (this.shouldCreateSample()) {
      this.samples.push(this.createSample());
      this.tempStats.length = 0;
    }
  }

  protected abstract toAnalytics: () =>
    | LocalAudioTrackAnalytics
    | LocalVideoTrackAnalytics
    | RemoteAudioTrackAnalytis
    | RemoteVideoTrackAnalytics;

  protected abstract createSample: () => LocalBaseSample | LocalVideoSample | RemoteAudioSample | RemoteVideoSample;

  protected getLatestStat() {
    return this.tempStats[this.tempStats.length - 1];
  }

  protected getFirstStat() {
    return this.tempStats[0];
  }

  protected abstract shouldCreateSample: () => boolean;

  protected calculateSum(key: keyof TempPublishStats) {
    const checkStat = this.getLatestStat()[key];
    if (typeof checkStat !== 'number') {
      return;
    }
    return this.tempStats.reduce((partialSum, stat) => {
      return partialSum + ((stat[key] || 0) as number);
    }, 0);
  }

  protected calculateAverage(key: keyof TempPublishStats, round = true) {
    const sum = this.calculateSum(key);
    const avg = sum !== undefined ? sum / this.tempStats.length : undefined;
    return avg ? (round ? Math.round(avg) : avg) : undefined;
  }

  protected calculateDifferenceForSample(key: keyof TempPublishStats) {
    const firstValue = Number(this.tempStats[0][key]) || 0;
    const latestValue = Number(this.getLatestStat()[key]) || 0;

    return latestValue - firstValue;
  }

  protected calculateInstancesOfHigh(key: keyof TempPublishStats, threshold: number) {
    const checkStat = this.getLatestStat()[key];
    if (typeof checkStat !== 'number') {
      return;
    }

    return this.tempStats.reduce((partialSum, stat) => {
      return partialSum + (((stat[key] || 0) as number) > threshold ? 1 : 0);
    }, 0);
  }
}

export const hasResolutionChanged = (newStat: TempPublishStats, prevStat: TempPublishStats) =>
  newStat && prevStat && (newStat.frameWidth !== prevStat.frameWidth || newStat.frameHeight !== prevStat.frameHeight);

export const hasEnabledStateChanged = (newStat: TempPublishStats, prevStat: TempPublishStats) =>
  newStat && prevStat && newStat.enabled !== prevStat.enabled;

export const removeUndefinedFromObject = <T extends Record<string, any>>(data: T) => {
  return Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .reduce((obj, [key, value]) => {
      obj[key as keyof T] = value;
      return obj;
    }, {} as T);
};
