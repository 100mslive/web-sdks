function getRoomId(token: string) {
  return JSON.parse(atob(token.split('.')[1])).room_id;
}

export { getRoomId };
