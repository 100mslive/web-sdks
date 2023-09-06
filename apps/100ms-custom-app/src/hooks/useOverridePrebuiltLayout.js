import { useSearchParam } from './useSearchParam';

export const QUERY_PARAM_SKIP_PREVIEW = 'skip_preview';
export const QUERY_PARAM_SKIP_PREVIEW_HEADFUL = 'skip_preview_headful';

export const useOverridePrebuiltLayout = () => {
  // way to skip preview for automated tests, beam recording and streaming
  const beamInToken = useSearchParam('token') === 'beam_recording'; // old format to remove
  // use this field to join directly for quick testing while in local
  const directJoinHeadfulFromEnv =
    process.env.REACT_APP_HEADLESS_JOIN === 'true';
  const directJoinHeadful =
    useSearchParam(QUERY_PARAM_SKIP_PREVIEW_HEADFUL) === 'true' ||
    directJoinHeadfulFromEnv;
  let skipPreview = useSearchParam(QUERY_PARAM_SKIP_PREVIEW) === 'true';

  let overrideLayout = undefined;

  if (skipPreview || beamInToken) {
    overrideLayout = {
      preview: null,
    };
    overrideLayout.conferencing = {
      default: {
        hideSections: ['footer', 'header'],
        elements: {
          video_tile_layout: {
            grid: {
              enable_local_tile_inset: false,
              hide_participant_name_on_tile: true,
              hide_audio_level_on_tile: true,
              rounded_video_tile: false,
              hide_audio_mute_on_tile: true,
              video_object_fit: 'cover',
            },
          },
        },
      },
    };
  }

  if (directJoinHeadful) {
    overrideLayout = {
      preview: null,
    };
  }

  return {
    overrideLayout,
    isHeadless: skipPreview || beamInToken || directJoinHeadful,
  };
};
