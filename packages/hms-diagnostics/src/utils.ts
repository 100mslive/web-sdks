export const userName = 'diagnostics_user';
export const roomId = '60f26ab342a997a1ff49c5c2';
export const role = 'student';
export const tokenEndpoint = 'https://qa-in2.100ms.live/hmsapi/ravi.qa-app.100ms.live/api/token';

export const INIT_ENDPOINT = 'https://qa-init.100ms.live/';

export const getToken = async () => {
  let token = null;
  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      body: JSON.stringify({
        role,
        room_id: roomId,
        user_id: 'diagnostics_user_id',
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
