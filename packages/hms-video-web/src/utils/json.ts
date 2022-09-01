export const stringifyMediaStreamTrack = (track: MediaStreamTrack) => {
  return `trackId=${track.id}, kind=${track.kind}, enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`;
};
