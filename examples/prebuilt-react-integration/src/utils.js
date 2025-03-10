function isRoomCode(str) {
  const regex = /^[A-Za-z]*(-[A-Za-z]*){2}$/;
  return regex.test(str);
}

export const getRoomCodeFromUrl = () => {
  // use query param, not path, so that we don't need Vercel rewrites
  const roomCode = new URLSearchParams(location.search).get('roomCode');
  return isRoomCode(roomCode) ? roomCode : null;
};
