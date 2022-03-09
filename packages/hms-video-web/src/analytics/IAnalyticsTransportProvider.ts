import AnalyticsEvent from './AnalyticsEvent';

export interface IAnalyticsTransportProvider {
  TAG: string;
  sendEvent: (event: AnalyticsEvent) => void;
}
