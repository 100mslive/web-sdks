export const stringifyMediaStreamTrack = (track: MediaStreamTrack) => {
  return `\n\ttrackId: ${track.id}\n\tkind: ${track.kind}\n\tenabled: ${track.enabled}\n\tmuted: ${track.muted}\n\treadyState: ${track.readyState}\n`;
};

/**
 * Function to stringify an object
 * @param input
 * @returns
 */
export const stringify = (input: any): string => {
  if (!input) {
    return '';
  }
  if (Array.isArray(input)) {
    return input.map(item => stringify(item)).join('');
  }
  if (typeof input !== 'object') {
    return input;
  }
  if (input instanceof MediaStreamTrack) {
    return stringifyMediaStreamTrack(input);
  }
  return `${Object.keys(input).reduce<string>((acc, key) => {
    let value: any = input[key];
    if (!value) {
      return acc;
    }
    value = stringify(value);
    return `${acc}\n${key}: ${value}`;
  }, '')}\n`;
};
