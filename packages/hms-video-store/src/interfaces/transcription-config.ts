import { HMSTranscriptionMode } from './room';

export interface TranslationConfig {
  enabled: boolean;
  /**
   * Map of role name to target language code (ISO 639-1 or IETF BCP 47).
   * Roles not in this map receive original (untranslated) captions.
   * @example { "host": "en", "guest": "es", "viewer": "fr" }
   * @see https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
   */
  roleLanguages?: Record<string, string>;
}

export interface TranscriptionConfig {
  mode: HMSTranscriptionMode;
  /**
   * Transcription input language in ISO 639-1 or IETF BCP 47 format.
   * Use "auto" for automatic language detection (maps to Deepgram's multi-language mode).
   * @example "en", "en-US", "hi", "auto"
   * @see https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
   */
  language?: string;
  /**
   * Translation config — only activates if the template has translation enabled.
   * If not provided, captions are delivered in the original language (no translation).
   */
  translation?: TranslationConfig;
}

export interface TranscriptionConfigUpdate {
  /**
   * Change transcription input language in ISO 639-1 or IETF BCP 47 format.
   * Use "auto" for automatic language detection.
   * Triggers a Deepgram reconnect (~1-2s gap in captions).
   * @example "en", "hi", "auto"
   * @see https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
   */
  language?: string;
  /** Toggle translation on/off and optionally update roleLanguages */
  translation?: TranslationConfig;
}
