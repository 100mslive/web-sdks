import { ISignalParamsProvider } from '../signal/ISignalSendParamsProvider';
import { AnalyticsEventLevel } from './AnalyticsEventLevel';

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

  constructor({ name, level, properties, includesPII, timestamp }: AnalyticsEventInit) {
    this.name = name;
    this.level = level;
    this.includesPII = includesPII || false;
    this.properties = properties || {};
    this.timestamp = timestamp || new Date().getTime(); // Timestamp of generating the event
  }

  toSignalParams() {
    return {
      name: this.name,
      info: { ...this.properties, timestamp: this.timestamp },
      timestamp: new Date().getTime(), // Timestamp of sending the event
    };
  }
}
