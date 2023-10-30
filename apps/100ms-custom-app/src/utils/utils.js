import axios from 'axios';
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

const tileShapeMapping = {
  '1-1': 'SQUARE',
  '4-3': 'LANDSCAPE',
  '16-9': 'WIDE',
  '3-4': '3-4',
  '9-16': '9-16',
};

const env = process.env.REACT_APP_ENV || 'prod';
export const apiBasePath =
  process.env.REACT_APP_DASHBOARD_BASE_ENDPOINT ||
  `https://${env}-in2.100ms.live/hmsapi/`;

export const storeRoomSettings = async ({ hostname, settings, appInfo }) => {
  const jwt = getAuthInfo().token;
  const formData = new FormData();
  const logoFile = settings.logo_obj;
  if (logoFile) {
    formData.append('logo', logoFile);
  }

  formData.append('color', settings.brand_color);
  formData.append('font', settings.font.toUpperCase());
  formData.append('tile_shape', tileShapeMapping[settings.tile_shape]);
  formData.append('theme', settings.theme.toUpperCase());
  formData.append('app_type', appInfo.app_type);
  formData.append('app_name', appInfo.app_name);
  formData.append('subdomain', hostname);
  formData.append('metadata', settings.metadataFields.metadata);

  const url = `${apiBasePath}apps/details`;

  const headers = {
    Authorization: `Bearer ${jwt}`,
    'Content-Type': 'multipart/form-data',
  };

  try {
    const res = await axios.post(url, formData, { headers: headers });
    if (res.data.success) {
      console.log('Details saved successfully!');
    } else {
      console.error(`Failed to update settings: ${res.statusText}`);
    }
  } catch (err) {
    console.error(`Failed to update settings: ${err.message}`);
  }
};

export const getRandomColor = () => {
  const h = Math.floor(Math.random() * 360),
    s = `${Math.floor(Math.random() * 100)}%`,
    l = `${Math.floor(Math.random() * 60)}%`;
  return `hsl(${h},${s},${l})`;
};

export const getInitialsFromEmail = () => {
  let initials = '';
  const email = getAuthInfo().userEmail;
  if (!email) {
    return initials;
  }
  const userEmail = email.toLowerCase();
  for (let i = 0; i < userEmail.length; i++) {
    if (userEmail[i] === '@') {
      break;
    }
    if (userEmail[i] >= 'a' && userEmail[i] <= 'z') {
      initials += userEmail[i];
    }
    if (initials.length === 2) {
      break;
    }
  }
  return initials;
};

export const mapTileShape = shape => {
  if (shape === 'SQUARE') {
    return '1-1';
  } else if (shape === 'WIDE') {
    return '16-9';
  } else if (shape === 'LANDSCAPE') {
    return '4-3';
  }
  return shape;
};

export const mapFromBackend = data => {
  const avatars = {
      PEBBLE: 'pebble',
      INITIALS: 'initial',
    },
    fonts = {
      LATO: 'Lato',
      ROBOTO: 'Roboto',
      MONTSERRAT: 'Montserrat',
      INTER: 'Inter',
      'OPEN SANS': 'Open Sans',
      'IBM PLEX SANS': 'IBM Plex Sans',
    };

  return {
    ...data,
    video_off_avatars: avatars[data.video_off_avatars],
    font: fonts[data.font],
  };
};

export const getWithRetry = async (url, headers) => {
  const MAX_RETRIES = 4;
  let error = Error('something went wrong');
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await axios.get(url, { headers: headers });
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
  if (roomId && role) {
    try {
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
    } catch (e) {
      console.error('failed to getAuthTokenUsingRoomIdRole', e);
      throw Error('failed to get auth token using roomid and role');
    }
  }
};

export const fetchData = async (
  subdomain,
  roomCode,
  setOnlyEmail,
  setData,
  setShowHeader
) => {
  const jwt = getAuthInfo().token;

  const url = `${apiBasePath}apps/get-details?domain=${subdomain}&room_id=${roomCode}`;
  const headers = {};
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }
  headers['Content-Type'] = 'application/json';

  getWithRetry(url, headers)
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
