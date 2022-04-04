import cookies from 'js-cookies';
import axios from 'axios';

export const getRoomCodeFromUrl = () => {
  const path = window.location.pathname;
  let roomCode = null;
  if (path.startsWith('/preview/') || path.startsWith('/meeting/')) {
    roomCode = '';
    for (let i = 9; i < path.length; i++) {
      if (path[i] === '/') {
        break;
      }
      roomCode += path[i];
    }
    if (roomCode.trim() === '') {
      roomCode = null;
    }
  }
  return roomCode;
};

export const getAuthInfo = () => {
  let info = { token: undefined, userEmail: undefined };
  try {
    const cookieName = process.env.REACT_APP_ENV === 'qa' ? 'authUser-qa' : 'authUser';
    const authUser = JSON.parse(cookies.getItem(cookieName));
    info.token = authUser?.token;
    info.userEmail = authUser?.email;
  } catch (e) {
    // user not logged in
    console.log(e);
  }
  return info;
};

export const storeRoomSettings = async ({ hostname, settings, appInfo }) => {
  const jwt = getAuthInfo().token;
  const mapTileShape = value => {
    return value === '1-1' ? 'SQUARE' : value === '16-9' ? 'WIDE' : 'LANDSCAPE';
  };

  const formData = new FormData();
  const logoFile = settings.logo_obj;
  if (logoFile) {
    formData.append('logo', logoFile);
  }

  formData.append('color', settings.brand_color);
  formData.append('font', settings.font.toUpperCase());
  formData.append('tile_shape', mapTileShape(settings.tile_shape));
  formData.append('theme', settings.theme.toUpperCase());
  formData.append('app_type', appInfo.app_type);
  formData.append('app_name', appInfo.app_name);
  formData.append('subdomain', hostname);
  formData.append('metadata', settings.metadataFields.metadata);

  axios.create({ baseURL: process.env.REACT_APP_BACKEND_API, timeout: 2000 });
  const url = `${process.env.REACT_APP_BACKEND_API}apps/details`;

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
