import { v4 as uuid } from 'uuid';
import { AnalyticsEventLevel } from './AnalyticsEventLevel';
import { domainCategory } from './domain-analytics';
import { ISignalParamsProvider } from '../signal/ISignalSendParamsProvider';
import { getAnalyticsDeviceId } from '../utils/analytics-deviceId';
import { createUserAgent } from '../utils/user-agent';

interface AnalyticsEventInit {
  name: string;
  level: AnalyticsEventLevel;
  includesPII?: boolean;
  properties?: Record<string, any>;
  timestamp?: number;
  onlyForwardProperties?: boolean;
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
  onlyForwardProperties?: boolean;
  metadata: {
    token?: string;
    peer: {
      peer_id?: string;
      session_id?: string;
      room_id?: string;
      role?: string;
      room_name?: string;
      joined_at?: number;
      template_id?: string;
      session_started_at?: number;
      user_name?: string;
      user_data?: string;
    };
    userAgent: string;
  } = {
    peer: {},
    userAgent: createUserAgent(),
  };
  timestamp: number;
  event_id: string;
  device_id: string;

  constructor({ name, level, properties, includesPII, timestamp, onlyForwardProperties = false }: AnalyticsEventInit) {
    this.name = name;
    this.level = level;
    this.includesPII = includesPII || false;
    this.properties = properties || {};
    this.timestamp = timestamp || new Date().getTime(); // Timestamp of generating the event
    this.event_id = uuid();
    this.device_id = getAnalyticsDeviceId();
    this.onlyForwardProperties = onlyForwardProperties;
  }

  toSignalParams() {
    const signalParams = {
      name: this.name,
      info: { ...this.properties },
      timestamp: new Date().getTime(), // Timestamp of sending the event
    };
    if (!this.onlyForwardProperties) {
      signalParams['info'] = { ...signalParams.info, timestamp: this.timestamp, domain: domainCategory };
    }
    return signalParams;
  }
}
