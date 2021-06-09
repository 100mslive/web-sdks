import AnalyticsEvent from './AnalyticsEvent';

export interface IAnalyticsTransport {
  sendEvent: (event: AnalyticsEvent) => void;
}
