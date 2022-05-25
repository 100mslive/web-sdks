const roomId = '60f26ab342a997a1ff49c5c2';
const role = 'student';
const tokenEndpoint = 'https://qa-in2.100ms.live/hmsapi/ravi.qa-app.100ms.live/api/token';

export const INIT_ENDPOINT = 'https://qa-init.100ms.live/';

export const getToken = async () => {
  let token = null;
  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      body: JSON.stringify({
        role,
        room_id: roomId,
        user_id: 'temp_user',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      token = data.token;
    }
  } catch (error) {
    console.log(error);
  }
  return token;
};
