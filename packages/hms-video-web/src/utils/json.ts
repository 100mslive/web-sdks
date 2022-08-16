export const replaceCircularOccurence = () => {
  const seen = new WeakSet();
  return (_: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

export const stringifyMediaStreamTrack = (track: MediaStreamTrack) => {
  return `trackId=${track.id}, kind=${track.kind}, enabled=${track.enabled}`;
};
