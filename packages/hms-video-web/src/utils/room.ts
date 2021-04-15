import jwt from "jsonwebtoken"

function getRoomId(token: string) {
  const decoded = jwt.decode(token, {json: true})
  return decoded!.room_id;
}

export { getRoomId };
