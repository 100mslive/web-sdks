const endPoint = `https://prod-in.100ms.live/hmsapi/deepcodes.app.100ms.live/`;
const roomId = `618636bbaf3188df33e66752`;

export default async function getToken(role: string) {
  const response = await fetch(`${endPoint}api/token`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: '5fc62c5872909272bf9995e1', // User ID assigned by you (different from 100ms' assigned id)
      role, // listener , speaker , moderator
      room_id: roomId,
    }),
  });

  const { token } = await response.json();

  return token;
}
