import React, { Fragment, useState } from 'react';
import { useScreenShare } from '@100mslive/react-sdk';
import { StarIcon, VerticalMenuIcon } from '@100mslive/react-icons';
import PDFShareImg from './../../images/pdf-share.png';
import ScreenShareImg from './../../images/screen-share.png';
import { Box, Dropdown, Flex, IconButton, Text, Tooltip } from '../../../';
import { ShareMenuIcon } from '../ShareMenuIcon';
import { PDFFileOptions } from './pdfFileOptions';

const MODALS = {
  SHARE: 'share',
  SCREEN_SHARE: 'screenShare',
  PDF_SHARE: 'pdfShare',
};

export function ShareScreenOptions() {
  const [openModals, setOpenModals] = useState(new Set());
  const { amIScreenSharing } = useScreenShare();
  const updateState = (modalName, value) => {
    setOpenModals(modals => {
      const copy = new Set(modals);
      if (value) {
        copy.add(modalName);
      } else {
        copy.delete(modalName);
      }
      return copy;
    });
  };
  const { toggleScreenShare } = useScreenShare();
  return (
    <Fragment>
      <Dropdown.Root
        open={openModals.has(MODALS.SHARE)}
        onOpenChange={value => updateState(MODALS.SHARE, value)}
        modal={false}
      >
        <Dropdown.Trigger asChild data-testid="sharing_btn" disabled={amIScreenSharing}>
          <ShareMenuIcon disabled={amIScreenSharing}>
            <Tooltip title="Share">
              <Box>
                <VerticalMenuIcon />
              </Box>
            </Tooltip>
          </ShareMenuIcon>
        </Dropdown.Trigger>
        <Dropdown.Content
          sideOffset={5}
          css={{
            w: '96',
            maxHeight: '96',
            p: 0,
            bg: 'surface.dim',
          }}
        >
          <Dropdown.Item
            css={{
              flexDirection: 'column',
              alignItems: 'flex-start',
              px: '10',
              pt: '10',
              pb: '6',
              '&:hover': {
                bg: 'transparent',
                cursor: 'default',
              },
            }}
          >
            <Text variant="h6">Start Sharing</Text>
            <Text variant="sm">Choose what you want to share</Text>
          </Dropdown.Item>
          <Dropdown.Item
            css={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: '8',
              px: '10',
              pt: '6',
              pb: '10',
              '&:hover': {
                bg: 'transparent',
                cursor: 'default',
              },
            }}
          >
            <Flex
              direction="column"
              align="center"
              css={{
                gap: '6',
              }}
            >
              <IconButton
                as="div"
                onClick={toggleScreenShare}
                css={{
                  p: '6',
                  display: 'flex',
                  justifyContent: 'center',
                  border: '1px solid $border_bright',
                  r: '2',
                  bg: 'surface.brighter',
                  pb: '0',
                }}
              >
                <img
                  src={ScreenShareImg}
                  alt="screen-share"
                  width="100%"
                  height="100%"
                  style={{
                    borderTopLeftRadius: '0.5rem', // TODO: create image component to solve for style hardcoding
                    borderTopRightRadius: '0.5rem',
                  }}
                />
              </IconButton>
              <Flex direction="column" align="center">
                <Text variant="body2">Share Screen</Text>
                <Text
                  variant="caption"
                  css={{
                    c: 'onSurface.low',
                    textAlign: 'center',
                  }}
                >
                  Share your tab, window or your entire screen
                </Text>
              </Flex>
            </Flex>
            <Flex
              direction="column"
              align="center"
              css={{
                gap: '6',
              }}
            >
              <IconButton
                onClick={() => {
                  updateState(MODALS.PDF_SHARE, true);
                }}
                disabled={amIScreenSharing}
                css={{
                  p: '6',
                  display: 'flex',
                  justifyContent: 'center',
                  border: '$border_bright 1px solid',
                  r: '2',
                  bg: 'surface.bright',
                  pb: '0',
                }}
              >
                <img
                  src={PDFShareImg}
                  alt="pdf-share"
                  width="100%"
                  height="100%"
                  style={{
                    borderTopLeftRadius: '0.5rem', // TODO: create image component to solve for style hardcoding
                    borderTopRightRadius: '0.5rem',
                  }}
                />
                <Flex
                  direction="row"
                  align="center"
                  css={{
                    position: 'absolute',
                    top: '35%',
                    left: '54%',
                    padding: '$2 $4',
                    r: '2',
                    bg: 'primary.bright',
                    zIndex: '2',
                    gap: '2',
                  }}
                >
                  <StarIcon height={14} width={14} />

                  <Text
                    variant="xs"
                    css={{
                      fontWeight: '$semiBold',
                      c: 'onPrimary.high',
                      pr: '4',
                    }}
                  >
                    New
                  </Text>
                </Flex>
              </IconButton>
              <Flex direction="column" align="center">
                <Text variant="body2">Share PDF</Text>
                <Text
                  variant="caption"
                  css={{
                    c: 'onSurface.low',
                    textAlign: 'center',
                  }}
                >
                  Annotate, draw shapes, and more over PDFs
                </Text>
              </Flex>
            </Flex>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>
      {openModals.has(MODALS.PDF_SHARE) && (
        <PDFFileOptions onOpenChange={value => updateState(MODALS.PDF_SHARE, value)} />
      )}
    </Fragment>
  );
}
