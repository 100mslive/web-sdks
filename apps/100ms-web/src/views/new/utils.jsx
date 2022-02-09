const PEER_NAME_PLACEHOLDER = "peerName";
const labelMap = new Map([
  [[true, "screen"].toString(), "Your Screen"],
  [[true, "playlist"].toString(), "Your Playlist"],
  [[true, "regular"].toString(), `You (${PEER_NAME_PLACEHOLDER})`],
  [[false, "screen"].toString(), `${PEER_NAME_PLACEHOLDER}'s Screen`],
  [[false, "playlist"].toString(), `${PEER_NAME_PLACEHOLDER}'s Video`],
  [[false, "regular"].toString(), PEER_NAME_PLACEHOLDER],
  [[false, undefined].toString(), PEER_NAME_PLACEHOLDER],
]);

export const getVideoTileLabel = (
  peerName,
  isLocal,
  videoSource = "regular",
  isLocallyMuted,
  degraded
) => {
  // Map [isLocal, videoSource] to the label to be displayed.

  let label = labelMap.get([isLocal, videoSource].toString());
  if (label) {
    label.replace(PEER_NAME_PLACEHOLDER, peerName);
  }
  label = `${label}${degraded ? "(Degraded)" : ""}`;
  if (
    (isLocallyMuted === undefined || isLocallyMuted === null) &&
    videoSource === "regular"
  ) {
    return label;
  }
  return `${label}${isLocallyMuted ? " (Muted for you)" : ""}`;
};
