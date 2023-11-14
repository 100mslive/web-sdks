import { parsedUserAgent } from '@100mslive/react-sdk';

export const DEFAULT_WAITING_VIEWER_ROLE = 'waiting-room';
export const QUERY_PARAM_SKIP_PREVIEW = 'skip_preview';
export const QUERY_PARAM_SKIP_PREVIEW_HEADFUL = 'skip_preview_headful';
export const QUERY_PARAM_NAME = 'name';
export const QUERY_PARAM_VIEW_MODE = 'ui_mode';
export const QUERY_PARAM_PREVIEW_AS_ROLE = 'preview_as_role';
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
  activeScreensharePeerId: 'activeScreensharePeerId',
  disableNotifications: 'disableNotifications',
  pollState: 'pollState',
  background: 'background',
  backgroundType: 'backgroundType',
};
export const UI_SETTINGS = {
  isAudioOnly: 'isAudioOnly',
  maxTileCount: 'maxTileCount',
  uiViewMode: 'uiViewMode',
  showStatsOnTiles: 'showStatsOnTiles',
  enableAmbientMusic: 'enableAmbientMusic',
  mirrorLocalVideo: 'mirrorLocalVideo',
};

export const SIDE_PANE_OPTIONS = {
  PARTICIPANTS: 'Participants',
  CHAT: 'Chat',
  STREAMING: 'STREAMING',
  POLLS: 'POLLS',
  VB: 'VB',
};

export const POLL_STATE = {
  pollInView: 'pollInView',
  view: 'view',
};

export const POLL_VIEWS = {
  CREATE_POLL_QUIZ: 'CREATE_POLL_QUIZ',
  CREATE_QUESTIONS: 'CREATE_QUESTIONS',
  VOTE: 'VOTE',
  RESULTS: 'RESULTS',
};

export const SUBSCRIBED_NOTIFICATIONS = {
  PEER_JOINED: 'PEER_JOINED',
  CHAT_PAUSED: 'CHAT_PAUSED',
  CHAT_RESUMED: 'CHAT_RESUMED',
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

export const SESSION_STORE_KEY = {
  TRANSCRIPTION_STATE: 'transcriptionState',
  PINNED_MESSAGE: 'pinnedMessage',
  SPOTLIGHT: 'spotlight',
  CHAT_PEER_BLACKLIST: 'chatPeerBlacklist',
  CHAT_MESSAGE_BLACKLIST: 'chatMessageBlacklist',
  CHAT_STATE: 'chatState',
};

/**
 * Chat state: {
 *  enabled?: boolean;
 *  updatedBy?: string;
 * }
 *
 * If unset, to assume enabled
 */

export const INTERACTION_TYPE = {
  POLL: 'Poll',
  QUIZ: 'Quiz',
};

export const QUESTION_TYPE_TITLE = {
  'single-choice': 'Single Choice',
  'multiple-choice': 'Multiple Choice',
  // "short-answer": "Short Answer",
  // "long-answer": "Long Answer",
};

export const QUESTION_TYPE = {
  SINGLE_CHOICE: 'single-choice',
  MULTIPLE_CHOICE: 'multiple-choice',
  // SHORT_ANSWER: "short-answer",
  // LONG_ANSWER: "long-answer",
};

export const ROLE_CHANGE_DECLINED = 'role_change_declined';

export const DEFAULT_PORTAL_CONTAINER = '#prebuilt-container';
