import AnalyticsEvent from './AnalyticsEvent';

export interface IAnalyticsTransportProvider {
  TAG: string;
  isConnected: boolean;
  sendEvent: (event: AnalyticsEvent) => void;
}
