export const CURRENT_PAGE_KEY = 'currentPage';
export const SHAPES_THROTTLE_TIME = 11;
export const PAGES_DEBOUNCE_TIME = 200;
export const OPEN_WAIT_TIMEOUT = 1000;

export const WHITEBOARD_CLOSE_MESSAGE = 'client whiteboard abort';
export const WHITEBOARD_RECONNECT_MESSAGE = 'reconnecting due to online event';
export const WHITEBOARD_REOPEN_MESSAGE = 'closing to open new conn';
export const RETRY_ERROR_MESSAGES = ['network error', 'failed to fetch'];

// Exponential backoff configuration
export const INITIAL_BACKOFF_MS = 1000;
export const MAX_BACKOFF_MS = 30000;
export const BACKOFF_MULTIPLIER = 2;
