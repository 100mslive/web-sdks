import InitialSettings from './settings';

export default interface HMSConfig {
  userName: string;
  authToken: string;
  metaData: string;
  audioSinkElementId?: string;
  initEndpoint?: string;
  settings: InitialSettings;
  autoVideoSubscribe?: boolean;
}
