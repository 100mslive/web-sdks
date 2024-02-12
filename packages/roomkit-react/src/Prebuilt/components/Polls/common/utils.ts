export const getFormattedTime = (milliseconds: number | undefined) => {
  if (!milliseconds) return '-';

  const totalSeconds = milliseconds / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let formattedSeconds = '';
  if (Number.isInteger(seconds) || minutes) {
    formattedSeconds = seconds.toFixed(0);
  } else {
    formattedSeconds = seconds.toFixed(1);
  }

  return `${minutes ? `${minutes}m ` : ''}${formattedSeconds}s`;
};
