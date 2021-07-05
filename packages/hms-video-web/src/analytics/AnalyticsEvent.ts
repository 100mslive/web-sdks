import { AnalyticsEventLevel } from './AnalyticsEventLevel';

interface AnalyticsEventInit {
  name: string;
  level: AnalyticsEventLevel;
  includesPII?: boolean;
  properties?: Record<string, any>;
  timestamp?: number;
}
export default class AnalyticsEvent {
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

  toParams() {
    return {
      name: this.name,
      info: { ...this.properties, timestamp: this.timestamp },
      timestamp: new Date().getTime(), // Timestamp of sending the event
    };
  }
}
