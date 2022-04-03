import React, { useState, useEffect, Suspense } from 'react';
import { Button, Flex, Text } from '@100mslive/react-ui';
import { AppAnalytics } from '../helpers/analytics_helpers';

// images
import logo from '../assets/images/100ms_logo.svg';
import darkLogo from '../assets/images/100ms_dark.svg';

// icons
import { InviteIcon, CodeIcon, EditIcon } from '@100mslive/react-icons';

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
                  css={{ p: '$3 $8', mr: '$4', color: '$white' }}
                >
                  <InviteIcon />
                  <Text as="span" css={{ ml: '$2', color: '$white' }}>
                    Invite
                  </Text>
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
                <CodeIcon />
              </Button>
              <Button variant="standard" css={{ mr: '$4', p: '$3 $6' }} onClick={toggleModal}>
                <EditIcon />
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
