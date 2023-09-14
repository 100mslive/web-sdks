import React, { Suspense, useState } from 'react';
import { useMedia } from 'react-use';
import {
  BrushDesignIcon,
  PeopleAddIcon,
  PersonContactIcon,
} from '@100mslive/react-icons';
import {
  Button,
  config as cssConfig,
  Flex,
  styled,
  Text,
} from '@100mslive/roomkit-react';
import darkLogo from '../assets/images/100ms_dark.svg';
import logo from '../assets/images/100ms_logo.svg';

const InviteLinksModal = React.lazy(() => import('./InviteLinksModal'));

const LogoImg = styled('img', {
  maxHeight: '$10',
  width: 'auto',
  cursor: 'pointer',
  '@md': {
    maxHeight: '$10',
  },
});

export default function Header({
  roomLinks = {},
  policyID = '',
  theme = 'DARK',
}) {
  const [modal, togModal] = useState(false);
  const isMobile = useMedia(cssConfig.media.md);

  if (isMobile) {
    return null;
  }

  return (
    <>
      <Flex
        align="center"
        justify="between"
        css={{
          p: '$6 $4',
          bg: '$background_dim',
          borderBottom: '1px solid $border_bright',
        }}
      >
        <LogoImg
          onClick={() => {
            window.open(process.env.REACT_APP_DASHBOARD_LINK);
          }}
          src={theme !== 'DARK' ? darkLogo : logo}
          alt="100ms logo"
          width={132}
          height={40}
        />
        <Flex align="center">
          <>
            <a
              rel="noreferrer"
              target="_blank"
              href="https://100ms.live/contact?referrer=prebuilt"
            >
              <Flex
                align="center"
                css={{
                  color: '$on_surface_medium',
                  borderRight: '1px solid $border_default',
                  pr: '$md',
                  mx: '$md',
                  gap: '$4',
                  '&:hover': { color: '$on_surface_high' },
                }}
              >
                <PersonContactIcon />
                <Text
                  variant="sm"
                  css={{ color: 'inherit', fontWeight: '$semiBold' }}
                >
                  Talk to Sales
                </Text>
              </Flex>
            </a>

            {roomLinks && Object.keys(roomLinks).length > 0 && (
              <Flex
                onClick={() => togModal(true)}
                align="center"
                css={{
                  color: '$on_surface_medium',
                  borderRight: '1px solid $border_default',
                  cursor: 'pointer',
                  mr: '$md',
                  px: '$md',
                  gap: '$4',
                  '&:hover': { color: '$on_surface_high' },
                }}
              >
                <PeopleAddIcon />
                <Text
                  variant="sm"
                  css={{ color: 'inherit', fontWeight: '$semiBold' }}
                >
                  Invite Others
                </Text>
              </Flex>
            )}
            <a
              target="_blank"
              href={`https://${
                process.env.REACT_APP_ENV === 'prod' ? 'dashboard' : 'app-qa'
              }.100ms.live/templates/${policyID}/prebuilt`}
              rel="noreferrer"
            >
              <Button
                variant=""
                icon
                css={{
                  lineHeight: '1rem',
                  fontSize: '$sm',
                  p: '$2 $4',
                  r: '$0',
                  background:
                    'linear-gradient(210deg, #6626ED 0%, #2672ED 100%)',
                  color: '$on_primary_high',
                  '&:hover': {
                    background:
                      'linear-gradient(210deg, #2672ED 0%, #6626ED 100%)',
                  },
                }}
              >
                <BrushDesignIcon />
                Customise
              </Button>
            </a>
          </>
        </Flex>
      </Flex>

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
