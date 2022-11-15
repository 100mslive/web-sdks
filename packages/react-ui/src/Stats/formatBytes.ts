export const formatBytes = (bytes?: number, unit = 'B', decimals = 2) => {
  if (bytes === 0) {
    return `0 ${unit}`;
  }
  if (!bytes) {
    return '-';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'].map(size => size + unit);

  let i = Math.floor(Math.log(bytes) / Math.log(k));

  // B to KB
  i === 0 && i++;

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
