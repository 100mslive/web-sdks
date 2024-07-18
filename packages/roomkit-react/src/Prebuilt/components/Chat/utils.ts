export const formatTime = (date: Date) => {
  if (!(date instanceof Date)) {
    return '';
  }
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours > 11 ? 'PM' : 'AM';
  return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes} ${suffix}`;
};

export const CHAT_MESSAGE_LIMIT = 2000;
