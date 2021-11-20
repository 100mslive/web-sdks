import { createSelector } from 'reselect';
import { selectLocalAudioTrackID, selectLocalVideoTrackID, selectRolesMap, selectTracksMap } from './selectors';
import { HMSTrack } from '../schema';

export const selectRoleByRoleName = (roleName: string) =>
  createSelector([selectRolesMap], rolesMap => rolesMap[roleName]);

const selectLocalVideoPlugins = createSelector([selectLocalVideoTrackID, selectTracksMap], (trackID, tracksMap) => {
  let track: HMSTrack | null = null;
  if (trackID) {
    track = tracksMap[trackID];
  }
  return track?.plugins || [];
});

const selectLocalAudioPlugins = createSelector([selectLocalAudioTrackID, selectTracksMap], (trackID, tracksMap) => {
  let track: HMSTrack | null = null;
  if (trackID) {
    track = tracksMap[trackID];
  }
  return track?.plugins || [];
});

export const selectIsLocalVideoPluginPresent = (pluginName: string) => {
  return createSelector([selectLocalVideoPlugins], plugins => {
    return plugins.includes(pluginName);
  });
};

export const selectIsLocalAudioPluginPresent = (pluginName: string) => {
  return createSelector([selectLocalAudioPlugins], plugins => {
    return plugins.includes(pluginName);
  });
};
