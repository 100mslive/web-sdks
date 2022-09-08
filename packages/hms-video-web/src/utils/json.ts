export const stringifyMediaStreamTrack = (track: MediaStreamTrack) => {
  if (!track) {
    return '';
  }
  return `{
    trackId: ${track.id};
    kind: ${track.kind};
    enabled: ${track.enabled};
    muted: ${track.muted};
    readyState: ${track.readyState};
  }`;
};
