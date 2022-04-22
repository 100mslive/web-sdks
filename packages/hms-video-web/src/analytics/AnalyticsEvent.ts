import { v4 as uuid } from 'uuid';
import { ISignalParamsProvider } from '../signal/ISignalSendParamsProvider';
import { domainCategory } from './domain-analytics';
import { AnalyticsEventLevel } from './AnalyticsEventLevel';
import { deviceId } from '../utils/support';

interface AnalyticsEventInit {
  name: string;
  level: AnalyticsEventLevel;
  includesPII?: boolean;
  properties?: Record<string, any>;
  timestamp?: number;
}

interface SignalEventParams {
  name: string;
  info: any;
  timestamp: number;
}

export default class AnalyticsEvent implements ISignalParamsProvider<SignalEventParams> {
  name: string;
  level: AnalyticsEventLevel;
  includesPII: boolean;
  properties: Record<string, any>;
  timestamp: number;
  event_id: string;
  device_id: string;

  constructor({ name, level, properties, includesPII, timestamp }: AnalyticsEventInit) {
    this.name = name;
    this.level = level;
    this.includesPII = includesPII || false;
    this.properties = properties || {};
    this.timestamp = timestamp || new Date().getTime(); // Timestamp of generating the event
    this.event_id = uuid();
    this.device_id = deviceId;
  }

  toSignalParams() {
    return {
      name: this.name,
      info: { ...this.properties, timestamp: this.timestamp, domain: domainCategory },
      timestamp: new Date().getTime(), // Timestamp of sending the event
    };
  }
}
