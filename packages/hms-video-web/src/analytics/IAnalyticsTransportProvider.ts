import AnalyticsEvent from './AnalyticsEvent';

export interface IAnalyticsTransportProvider {
  sendEvent: (event: AnalyticsEvent) => void;
}
