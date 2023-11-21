import AnalyticsEvent from './AnalyticsEvent';

export interface IAnalyticsTransportProvider {
  readonly TAG: string;
  isConnected: boolean;
  sendEvent: (event: AnalyticsEvent) => void;
}
