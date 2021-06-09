import AnalyticsEvent from './AnalyticsEvent';

export interface IAnalyticsPropertiesProvider {
  toAnalyticsProperties: () => AnalyticsEvent['properties'];
}
