export const getFormattedTime = (milliseconds: number) => {
  if (!milliseconds) return '-';
  const totalSeconds = milliseconds / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const timeString = `${minutes ? `${minutes}m ` : ''}${
    Number.isInteger(seconds) || minutes ? seconds.toFixed(0) : seconds.toFixed(1)
  }s`;

  return timeString;
};
