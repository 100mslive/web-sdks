export const getFormattedTime = (milliseconds: number | undefined, precise = true) => {
  if (!milliseconds) return '-';

  const totalSeconds = milliseconds / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formattedTime = '';
  if (hours) {
    formattedTime += `${hours}h `;
  }
  if (minutes || hours) {
    formattedTime += `${minutes}m `;
  }
  if (!precise && (hours || minutes)) {
    return formattedTime;
  }
  formattedTime += `${Math.floor(seconds)}s`;

  return formattedTime;
};
