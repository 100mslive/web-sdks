import { DomainCategory } from '../analytics/AnalyticsEventDomains';

const eventName = 'transport.leave';

export const transportLeaveEvent = {
  name: eventName,
  level: 1,
  includesPII: false,
  properties: { plugin_name: 'HMSKrispPlugin' },
  metadata: { peer: {}, userAgent: '' },
  timestamp: Date.now(),
  device_id: '',
  event_id: '00000000',
  toSignalParams: () => {
    return {
      name: eventName,
      info: { domain: DomainCategory.CUSTOM, timestamp: Date.now() },
      timestamp: Date.now(),
    };
  },
};
