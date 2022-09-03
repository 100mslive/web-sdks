export const stringifyMediaStreamTrack = (track: MediaStreamTrack) => {
  return `
    trackId: ${track.id}
    kind: ${track.kind}
    enabled: ${track.enabled}
    muted: ${track.muted}
    readyState: ${track.readyState}
  `;
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
  return `${Object.keys(input).reduce<string>((acc, key) => {
    let value: any = input[key];
    if (!value) {
      return acc;
    }
    value = stringify(value);
    return `${acc}
      ${key}: ${value}`;
  }, '')}\n`;
};
