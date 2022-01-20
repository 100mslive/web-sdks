/**
 * checks if RTCPeerConnection constructor is available
 */
export const isMissingRTCPeerMissing = () => {
  try {
    new RTCPeerConnection();
  } catch (err) {
    // verify err is the expected error and then
    return false;
  }
  return true;
};
