export function getPercentage(a: number, b: number) {
  return (a / b) * 100;
}

/**
 *
 * @param {number} timeInSeconds - if given as floating point value, it is floored.
 * @returns  a string representing timeInSeconds in HH:MM:SS format.
 * (e.g) getDurationFromSeconds(3910) returns "1:05:10"
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

export function getWatchCount(viewer: number) {
  if (viewer < 1000) {
    return viewer;
  }
  const output = (viewer / 1000).toFixed(2);
  return output + 'K';
}

export function getTime(timeInMilles: number) {
  const timeInSeconds = Math.floor(timeInMilles / 1000);
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const hour = hours !== 0 ? `${hours < 10 ? '0' : ''}${hours}:` : '';
  return hour + `${hour ? 'h:' : ''}` + minutes + 'm';
}
