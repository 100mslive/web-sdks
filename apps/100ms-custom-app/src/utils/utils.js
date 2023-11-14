import cookies from 'js-cookies';

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

export const getRoomIdRoleFromUrl = () => {
  const path = window.location.pathname;
  const regex =
    /(\/streaming)?(\/(preview|meeting))?\/(?<roomId>[^/]+)\/(?<role>[^/]+)/;
  const roomId = path.match(regex)?.groups?.roomId || null;
  const role = path.match(regex)?.groups?.role || null;
  return {
    roomId,
    role,
  };
};

export const getAuthInfo = () => {
  let info = { token: undefined, userEmail: undefined };
  try {
    const cookieName =
      process.env.REACT_APP_ENV === 'qa' ? 'authUser-qa' : 'authUser';
    const authUser = JSON.parse(cookies.getItem(cookieName));
    info.token = authUser?.token;
    info.userEmail = authUser?.email;
  } catch (e) {
    // user not logged in
    console.log(e);
  }
  return info;
};

const env = process.env.REACT_APP_ENV || 'prod';
export const apiBasePath =
  process.env.REACT_APP_DASHBOARD_BASE_ENDPOINT ||
  `https://${env}-in2.100ms.live/hmsapi/`;

export const getWithRetry = async (url, headers) => {
  const MAX_RETRIES = 4;
  let error = Error('something went wrong');
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fetch(url, { method: 'GET', headers: headers });
    } catch (err) {
      error = err;
    }
  }
  console.error('max retry done for get-details', error);
  throw error;
};

export const getAuthTokenUsingRoomIdRole = async function ({
  subdomain = '',
  roomId = '',
  role = '',
  userId = '',
}) {
  try {
    if (roomId && role) {
      const resp = await fetch(`${apiBasePath}${subdomain}/api/token`, {
        method: 'POST',
        body: JSON.stringify({
          room_id: roomId,
          role,
          user_id: userId,
        }),
      });
      const { token = '' } = await resp.json();
      return token;
    }
  } catch (e) {
    console.error('failed to getAuthTokenUsingRoomIdRole', e);
    throw Error('failed to get auth token using roomid and role');
  }
};

export const fetchData = (
  subdomain,
  roomCode,
  setOnlyEmail,
  setData,
  setShowHeader
) => {
  const jwt = getAuthInfo().token;

  const url = `${apiBasePath}apps/get-details?domain=${subdomain}&room_id=${roomCode}`;
  const headers = new Headers();
  if (jwt) {
    headers.set('Authorization', `Bearer ${jwt}`);
  }
  headers.set('Content-Type', 'application/json');

  return getWithRetry(url, headers)
    .then(res => {
      if (res.data.success) {
        setOnlyEmail(res.data.same_user);
        setShowHeader(true);
        setData({
          roomLinks: res.data.room_links,
          policyID: res.data.policy_id,
          theme: res.data.theme,
        });
      }
    })
    .catch(err => {
      setShowHeader(false);
      const errorMessage = `[Get Details] ${err.message}`;
      console.error(errorMessage);
    });
};
