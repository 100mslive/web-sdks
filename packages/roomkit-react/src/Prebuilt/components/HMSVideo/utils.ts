export function getPercentage(a: number, b: number) {
  return (a / b) * 100;
}

/**
 * Take a time in seconds and return its equivalent time in hh:mm:ss format
 * @param {number} timeInSeconds if given as floating point value, it is floored.
 *
 * @returns a string representing timeInSeconds in HH:MM:SS format.
 */
export function getDurationFromSeconds(timeInSeconds: number) {
  let time = Math.floor(timeInSeconds);
  const hours = Math.floor(time / 3600);
  time = time - hours * 3600;
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time - minutes * 60);

  const prefixedMinutes = `${minutes < 10 ? `0${minutes}` : minutes}`;
  const prefixedSeconds = `${seconds < 10 ? `0${seconds}` : seconds}`;

  let videoTimeStr = `${prefixedMinutes}:${prefixedSeconds}`;
  if (hours) {
    const prefixedHours = `${hours < 10 ? `0${hours}` : hours}`;
    videoTimeStr = `${prefixedHours}:${prefixedMinutes}:${prefixedSeconds}`;
  }
  return videoTimeStr;
}

export function getDuration(videoEl: HTMLVideoElement): number {
  if (isFinite(videoEl.duration)) {
    return videoEl.duration;
  }
  if (videoEl.seekable.length > 0) {
    return videoEl.seekable.end(0);
  }
  return 0;
}
