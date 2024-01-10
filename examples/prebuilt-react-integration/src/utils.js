function isRoomCode(str) {
  const regex = /^[A-Za-z]*(-[A-Za-z]*){2}$/;
  return regex.test(str);
}

export const getRoomCodeFromUrl = () => {
  const path = window.location.pathname;
  const regex = /(\/streaming)?(\/(preview|meeting))?\/(?<code>[^/]+)/;
  const roomCode = path.match(regex)?.groups?.code || null;
  return isRoomCode(roomCode) ? roomCode : null;
};
