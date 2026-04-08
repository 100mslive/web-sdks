import { HMSTranscriptionMode } from './room';

export interface TranslationConfig {
  enabled: boolean;
  roleLanguages?: Record<string, string>;
}

export interface TranscriptionConfig {
  mode: HMSTranscriptionMode;
  /** ISO-639/BCP 47 language code for transcription input (e.g., "en", "hi", "auto") */
  language?: string;
  /** Translation config — only activates if template has translation enabled */
  translation?: TranslationConfig;
}

export interface TranscriptionConfigUpdate {
  /** ISO-639/BCP 47 language code (e.g., "en", "hi", "auto") */
  language?: string;
  /** Toggle translation on/off and optionally update roleLanguages */
  translation?: TranslationConfig;
}
