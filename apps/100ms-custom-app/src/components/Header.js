import React, { Suspense, useCallback, useState } from 'react';
import { CodeIcon, EditIcon, InviteIcon } from '@100mslive/react-icons';
import { Button, Flex, styled, Text } from '@100mslive/roomkit-react';
import { AppAnalytics } from '../utils/analytics';
import {
  apiBasePath,
  getInitialsFromEmail,
  getRandomColor,
} from '../utils/utils';
import darkLogo from '../assets/images/100ms_dark.svg';
import logo from '../assets/images/100ms_logo.svg';

const DownloadCodeModal = React.lazy(() => import('./DownloadCodeModal'));
const InviteLinksModal = React.lazy(() => import('./InviteLinksModal'));
const LogoImg = styled('img', {
  maxHeight: '$14',
  width: 'auto',
  cursor: 'pointer',
  '@md': {
    maxHeight: '$12',
  },
});
const randomColor = getRandomColor();

export default function Header({
  savingData,
  refreshData,
  settings,
  roomLinks,
  onlyEmail,
  toggleModal,
}) {
  const [modal, togModal] = useState(false);
  const [codeModal, setCodeModal] = useState(false);

  const generateEnvData = useCallback(
    logo => {
      return `REACT_APP_TILE_SHAPE=${settings.tile_shape}\nREACT_APP_THEME=${
        settings.theme
      }\nREACT_APP_COLOR=${settings.brand_color}\nREACT_APP_LOGO=${
        logo || ''
      }\nREACT_APP_FONT=${
        settings.font
      }\nREACT_APP_TOKEN_GENERATION_ENDPOINT=${`${
        apiBasePath + window.location.hostname
      }/`}\nREACT_APP_ENV=${process.env.REACT_APP_ENV}\n`;
    },
    [settings.tile_shape, settings.brand_color, settings.theme, settings.font]
  );

  const downloadCode = async () => {
    await refreshData().then(logo => {
      var envFile = document.createElement('a');
      const data = generateEnvData(logo);
      envFile.setAttribute(
        'href',
        `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`
      );
      envFile.download = 'example.env';
      envFile.style.display = 'none';
      document.body.appendChild(envFile);
      envFile.click();
      document.body.removeChild(envFile);
    });
  };

  return (
    <>
      <Flex
        align="center"
        justify="between"
        css={{
          p: '$6 $4',
          bg: '$mainBg',
          borderBottom: '1px solid $borderLight',
        }}
      >
        <LogoImg
          onClick={() => {
            window.open(process.env.REACT_APP_DASHBOARD_LINK);
          }}
          src={settings.theme === 'dark' ? logo : darkLogo}
          alt="100ms logo"
          width={132}
          height={40}
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
                  css={{ px: '$8', mr: '$4', color: '$white' }}
                >
                  <InviteIcon />
                  <Text as="span" css={{ ml: '$2', color: '$white' }}>
                    Invite
                  </Text>
                </Button>
              )}
              <Button
                variant="standard"
                css={{ lineHeight: '1.5rem' }}
                onClick={() => {
                  window.open('https://100ms.live/contact?referrer=prebuilt');
                }}
              >
                Schedule a demo
              </Button>
              <Button
                variant="standard"
                css={{ px: '$6', mx: '$4' }}
                disabled={savingData}
                onClick={() => {
                  setCodeModal(true);
                }}
              >
                <CodeIcon />
              </Button>
              <Button
                variant="standard"
                css={{ mr: '$4', px: '$6' }}
                onClick={toggleModal}
              >
                <EditIcon />
              </Button>
            </>
          )}
          <Flex
            align="center"
            justify="center"
            css={{ bg: randomColor, w: '$14', h: '$14', r: '$round' }}
          >
            <Text css={{ color: '$white' }}>{getInitialsFromEmail()}</Text>
          </Flex>
        </Flex>
      </Flex>
      {codeModal && (
        <Suspense fallback={null}>
          <DownloadCodeModal
            downloadEnv={downloadCode}
            onClose={() => setCodeModal(false)}
          />
        </Suspense>
      )}
      {modal && (
        <Suspense fallback={null}>
          <InviteLinksModal
            onClose={() => togModal(false)}
            roomLinks={roomLinks}
          />
        </Suspense>
      )}
    </>
  );
}
