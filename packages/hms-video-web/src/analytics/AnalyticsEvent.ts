import { AnalyticsEventLevel } from './AnalyticsEventLevel';

export default class AnalyticsEvent {
  name: string;
  level: AnalyticsEventLevel;
  includesPII: boolean;
  properties: Record<string, any>;
  timestamp: number;

  constructor(name: string, level: AnalyticsEventLevel, includesPII: boolean, properties: Record<string, any> = {}) {
    this.name = name;
    this.level = level;
    this.includesPII = includesPII;
    this.properties = properties;
    this.timestamp = new Date().getTime();
  }

  toParams() {
    return {
      name: this.name,
      info: this.properties,
      timestamp: this.timestamp,
    };
  }
}
