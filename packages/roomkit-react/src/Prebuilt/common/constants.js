import { parsedUserAgent } from '@100mslive/react-sdk';

export const DEFAULT_HLS_ROLE_KEY = 'HLS_VIEWER_ROLE';
export const DEFAULT_HLS_VIEWER_ROLE = 'hls-viewer';
export const DEFAULT_WAITING_VIEWER_ROLE = 'waiting-room';
export const QUERY_PARAM_SKIP_PREVIEW = 'skip_preview';
export const QUERY_PARAM_SKIP_PREVIEW_HEADFUL = 'skip_preview_headful';
export const QUERY_PARAM_NAME = 'name';
export const QUERY_PARAM_VIEW_MODE = 'ui_mode';
export const QUERY_PARAM_AUTH_TOKEN = 'auth_token';
export const QUERY_PARAM_PREVIEW_AS_ROLE = 'preview_as_role';
export const UI_MODE_ACTIVE_SPEAKER = 'activespeaker';
export const UI_MODE_GRID = 'grid';
export const MAX_TOASTS = 5;
export const RTMP_RECORD_RESOLUTION_MIN = 480;
export const RTMP_RECORD_RESOLUTION_MAX = 1280;
export const RTMP_RECORD_DEFAULT_RESOLUTION = {
  width: 1280,
  height: 720,
};
export const EMOJI_REACTION_TYPE = 'EMOJI_REACTION';

export const CHAT_SELECTOR = {
  PEER_ID: 'peer_id',
  ROLE: 'role',
};

export const APP_DATA = {
  uiSettings: 'uiSettings',
  chatOpen: 'chatOpen',
  chatSelector: 'chatSelector',
  chatDraft: 'chatDraft',
  appConfig: 'appConfig',
  sidePane: 'sidePane',
  hlsStats: 'hlsStats',
  hlsViewerRole: 'hlsViewerRole',
  waitingViewerRole: 'waitingViewerRole',
  subscribedNotifications: 'subscribedNotifications',
  logo: 'logo',
  tokenEndpoint: 'tokenEndpoint',
  appLayout: 'appLayout',
  hlsStarted: 'hlsStarted',
  rtmpStarted: 'rtmpStarted',
  recordingStarted: 'recordingStarted',
  embedConfig: 'embedConfig',
  pinnedTrackId: 'pinnedTrackId',
  dropdownList: 'dropdownList',
  authToken: 'authToken',
  pdfConfig: 'pdfConfig',
  minimiseInset: 'minimiseInset',
};
export const UI_SETTINGS = {
  isAudioOnly: 'isAudioOnly',
  isHeadless: 'isHeadless',
  maxTileCount: 'maxTileCount',
  uiViewMode: 'uiViewMode',
  showStatsOnTiles: 'showStatsOnTiles',
  enableAmbientMusic: 'enableAmbientMusic',
  mirrorLocalVideo: 'mirrorLocalVideo',
  activeSpeakerSorting: 'activeSpeakerSorting',
  hideLocalVideo: 'hideLocalVideo',
};

export const SIDE_PANE_OPTIONS = {
  PARTICIPANTS: 'Participants',
  CHAT: 'Chat',
  STREAMING: 'STREAMING',
  TILES: 'TILES',
  SCREEN_TILES: 'SCREEN_TILES',
};

export const SUBSCRIBED_NOTIFICATIONS = {
  PEER_JOINED: 'PEER_JOINED',
  PEER_LEFT: 'PEER_LEFT',
  METADATA_UPDATED: 'METADATA_UPDATED',
  NEW_MESSAGE: 'NEW_MESSAGE',
  ERROR: 'ERROR',
};

export const CREATE_ROOM_DOC_URL = 'https://github.com/100mslive/100ms-web/wiki/Creating-and-joining-a-room';
export const HLS_TIMED_METADATA_DOC_URL =
  'https://www.100ms.live/docs/javascript/v2/how--to-guides/record-and-live-stream/hls/hls-timed-metadata';

export const REMOTE_STOP_SCREENSHARE_TYPE = 'REMOTE_STOP_SCREENSHARE';

export const isChrome = parsedUserAgent.getBrowser()?.name?.toLowerCase() === 'chrome';
export const isFirefox = parsedUserAgent.getBrowser()?.name?.toLowerCase() === 'firefox';
export const isSafari = parsedUserAgent.getBrowser()?.name?.toLowerCase() === 'safari';
export const isIOS = parsedUserAgent.getOS()?.name?.toLowerCase() === 'ios';
export const isMacOS = parsedUserAgent.getOS()?.name?.toLowerCase() === 'mac os';
export const isAndroid = parsedUserAgent.getOS()?.name?.toLowerCase() === 'android';
export const isIPadOS = false;
// typeof navigator !== "undefined" &&
// navigator?.maxTouchPoints &&
// navigator?.maxTouchPoints > 2 &&
// navigator?.userAgent?.match(/Mac/);

export const FEATURE_LIST = {
  AUDIO_ONLY_SCREENSHARE: 'audioscreenshare',
  AUDIO_PLAYLIST: 'audioplaylist',
  VIDEO_PLAYLIST: 'videoplaylist',
  EMOJI_REACTION: 'emojireaction',
  AUDIO_PLUGINS: 'audioplugins',
  VIDEO_PLUGINS: 'videoplugins',
  WHITEBOARD: 'whiteboard',
  CHANGE_NAME: 'changename',
  FULLSCREEN: 'fullscreen',
  PICTURE_IN_PICTURE: 'pip',
  STARTS_FOR_NERDS: 'statsfornerds',
  EMBED_URL: 'embedurl',
  BRB: 'brb',
  HAND_RAISE: 'handraise',
  CHAT: 'chat',
  PIN_TILE: 'pintile',
};

export const SESSION_STORE_KEY = {
  TRANSCRIPTION_STATE: 'transcriptionState',
  PINNED_MESSAGE: 'pinnedMessage',
  SPOTLIGHT: 'spotlight',
};
