import React, { useState, useEffect, Suspense } from 'react';
import { Button, Flex, Text } from '@100mslive/react-ui';
import { AppAnalytics } from '../helpers/analytics_helpers';

// images
import logo from '../assets/images/100ms_logo.svg';
import darkLogo from '../assets/images/100ms_dark.svg';

// icons
import iconEdit from '../assets/images/icons/icon-edit.svg';
import iconCode from '../assets/images/icons/icon-code.svg';

const DownloadCodeModal = React.lazy(() => import('./DownloadCodeModal'));
const InviteLinksModal = React.lazy(() => import('./InviteLinksModal'));

const getRandomColor = () => {
  const h = Math.floor(Math.random() * 360),
    s = `${Math.floor(Math.random() * 100)}%`,
    l = `${Math.floor(Math.random() * 60)}%`;
  return `hsl(${h},${s},${l})`;
};

const randomColor = getRandomColor();

export default function Header({
  savingData,
  refreshData,
  settings,
  roleNames,
  roomLinks,
  onlyEmail,
  email,
  theme = 'dark',
  toggleModal,
}) {
  const [modal, togModal] = useState(false);
  const [codeModal, setCodeModal] = useState(false);
  const [role_data, setRoleData] = useState({
    role_names: [],
    roomId: null,
  });

  useEffect(() => {
    const pathName = window.location.pathname;
    let roomId = '';
    if (pathName.startsWith('/preview') || pathName.startsWith('/meeting') || pathName.startsWith('/leave')) {
      let index = 9;
      if (pathName.startsWith('/leave')) {
        index = 7;
      }
      for (let i = index; i < pathName.length; i++) {
        if (pathName[i] === '/') {
          break;
        }
        roomId += pathName[i];
      }
    }
    setRoleData({
      ...role_data,
      role_names: roleNames,
      roomId: roomId,
    });
    // eslint-disable-next-line
  }, []);

  const getEmailInitials = () => {
    let initials = '';
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

  const generateEnvData = logo => {
    return `REACT_APP_TILE_SHAPE=${settings.tile_shape}\nREACT_APP_THEME=${settings.theme}\nREACT_APP_COLOR=${
      settings.brand_color
    }\nREACT_APP_LOGO=${logo || ''}\nREACT_APP_FONT=${settings.font}\nREACT_APP_TOKEN_GENERATION_ENDPOINT=${`${
      process.env.REACT_APP_BACKEND_API + window.location.hostname
    }/`}\nREACT_APP_ENV=${process.env.REACT_APP_ENV}\nREACT_APP_LOGROCKET_ID=<Your Logrocket project ID>`;
  };

  const downloadCode = async () => {
    await refreshData().then(logo => {
      var envFile = document.createElement('a');
      const data = generateEnvData(logo);
      envFile.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`);
      envFile.download = 'example.env';
      envFile.style.display = 'none';
      document.body.appendChild(envFile);
      envFile.click();
      document.body.removeChild(envFile);
    });
  };

  return (
    <>
      <Flex align="center" justify="between" css={{ p: '$6', bg: '$mainBg', borderBottom: '1px solid $borderLight' }}>
        <img
          onClick={() => {
            window.open(process.env.REACT_APP_DASHBOARD_LINK);
          }}
          className="h-6 hover:cursor-pointer"
          src={theme === 'dark' ? logo : darkLogo}
          alt="100ms logo"
        />
        <Flex align="center">
          {onlyEmail && (
            <>
              {roomLinks && Object.keys(roomLinks).length > 0 && (
                <Button
                  onClick={() => {
                    togModal(!modal);
                    AppAnalytics.track('invite.clicked');
                  }}
                  css={{ p: '$3 $8', mr: '$4' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8.625 4.53906C7.60557 4.53906 6.6279 4.94403 5.90706 5.66487C5.18622 6.38571 4.78125 7.36339 4.78125 8.38281C4.78125 9.40224 5.18622 10.3799 5.90706 11.1008C6.6279 11.8216 7.60557 12.2266 8.625 12.2266C9.64443 12.2266 10.6221 11.8216 11.3429 11.1008C12.0638 10.3799 12.4688 9.40224 12.4688 8.38281C12.4688 7.36339 12.0638 6.38571 11.3429 5.66487C10.6221 4.94403 9.64443 4.53906 8.625 4.53906ZM6.96772 6.72553C7.40726 6.28599 8.0034 6.03906 8.625 6.03906C9.2466 6.03906 9.84274 6.28599 10.2823 6.72553C10.7218 7.16507 10.9688 7.76121 10.9688 8.38281C10.9688 9.00441 10.7218 9.60056 10.2823 10.0401C9.84274 10.4796 9.2466 10.7266 8.625 10.7266C8.0034 10.7266 7.40726 10.4796 6.96772 10.0401C6.52818 9.60056 6.28125 9.00441 6.28125 8.38281C6.28125 7.76121 6.52818 7.16507 6.96772 6.72553ZM5.5756 15.6615C6.38435 14.8527 7.48125 14.3984 8.625 14.3984C9.76875 14.3984 10.8656 14.8527 11.6744 15.6615C12.4831 16.4702 12.9375 17.5671 12.9375 18.7109C12.9375 19.1251 13.2733 19.4609 13.6875 19.4609C14.1017 19.4609 14.4375 19.1251 14.4375 18.7109C14.4375 17.1693 13.8251 15.6909 12.7351 14.6008C11.645 13.5108 10.1666 12.8984 8.625 12.8984C7.08343 12.8984 5.605 13.5108 4.51494 14.6008C3.42489 15.6909 2.8125 17.1693 2.8125 18.7109C2.8125 19.1251 3.14829 19.4609 3.5625 19.4609C3.97671 19.4609 4.3125 19.1251 4.3125 18.7109C4.3125 17.5671 4.76685 16.4702 5.5756 15.6615ZM13.9751 7.45202C14.5904 6.83667 15.425 6.49097 16.2953 6.49097C17.1655 6.49097 18.0001 6.83667 18.6155 7.45202C19.2308 8.06738 19.5765 8.90198 19.5765 9.77222C19.5765 10.6425 19.2308 11.4771 18.6155 12.0924C18.0001 12.7078 17.1655 13.0535 16.2953 13.0535C15.425 13.0535 14.5904 12.7078 13.9751 12.0924C13.3597 11.4771 13.014 10.6425 13.014 9.77222C13.014 8.90198 13.3597 8.06738 13.9751 7.45202ZM16.2953 7.99097C15.8228 7.99097 15.3698 8.17863 15.0357 8.51268C14.7017 8.84673 14.514 9.2998 14.514 9.77222C14.514 10.2446 14.7017 10.6977 15.0357 11.0318C15.3698 11.3658 15.8228 11.5535 16.2953 11.5535C16.7677 11.5535 17.2207 11.3658 17.5548 11.0318C17.8888 10.6977 18.0765 10.2446 18.0765 9.77222C18.0765 9.2998 17.8888 8.84673 17.5548 8.51268C17.2207 8.17863 16.7677 7.99097 16.2953 7.99097ZM15.1191 15.5281C15.6321 15.339 16.1831 15.2767 16.7254 15.3463C17.2676 15.416 17.785 15.6155 18.2336 15.9281C18.6821 16.2406 19.0486 16.6569 19.3017 17.1415C19.5548 17.626 19.6872 18.1646 19.6875 18.7113C19.6877 19.1255 20.0237 19.4611 20.4379 19.4609C20.8521 19.4606 21.1877 19.1247 21.1875 18.7105C21.187 17.9222 20.9962 17.1457 20.6312 16.4469C20.2662 15.7482 19.7379 15.148 19.0911 14.6974C18.4444 14.2467 17.6983 13.9589 16.9164 13.8585C16.1346 13.7581 15.34 13.848 14.6004 14.1207C14.2117 14.2639 14.0128 14.6951 14.156 15.0837C14.2992 15.4724 14.7304 15.6713 15.1191 15.5281Z"
                      fill="white"
                    />
                  </svg>
                  <span className="ml-2">Invite</span>
                </Button>
              )}
              <Button
                variant="standard"
                onClick={() => {
                  window.open('https://100ms.live/contact');
                }}
                css={{ py: '$3' }}
              >
                Schedule a demo
              </Button>
              <Button
                variant="standard"
                css={{ p: '$3 $6', mx: '$4' }}
                disabled={savingData}
                onClick={() => {
                  setCodeModal(true);
                }}
              >
                <img alt="code" src={iconCode} />
              </Button>
              <Button variant="standard" css={{ mr: '$4', p: '$3 $6' }} onClick={toggleModal}>
                <img alt="edit" src={iconEdit} />
              </Button>
            </>
          )}
          <Flex align="center" justify="center" css={{ backgroundColor: randomColor, w: '$14', h: '$14', r: '$round' }}>
            <Text>{getEmailInitials()}</Text>
          </Flex>
        </Flex>
      </Flex>
      {codeModal && (
        <Suspense fallback={<div>Loading...</div>}>
          <DownloadCodeModal downloadEnv={downloadCode} theme={theme} onClose={() => setCodeModal(false)} />
        </Suspense>
      )}
      {modal && (
        <Suspense fallback={<div>Loading...</div>}>
          <InviteLinksModal onClose={() => togModal(false)} roomLinks={roomLinks} />
        </Suspense>
      )}
    </>
  );
}
