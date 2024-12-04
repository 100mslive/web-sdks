export const standardMediaConstraints = [
  { echoCancellation: { exact: true } },
  { highpassFilter: { exact: true } },
  { audioMirroring: { exact: true } },
  // These options can vary depending on the audio plugin
  //   { autoGainControl: { exact: true } },
  //   { noiseSuppression: { exact: true } },
];
