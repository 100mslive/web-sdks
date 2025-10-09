import { useEffect, useState } from 'react';
import { parsedUserAgent } from '@100mslive/react-sdk';
import { TestContainer, TestFooter } from './components';
import { Box, Flex } from '../Layout';
import { Text } from '../Text';
import { DiagnosticsStep, useDiagnostics } from './DiagnosticsContext';

const CMS_MEDIA_SERVER = 'https://storage.googleapis.com/100ms-cms-prod/';

export const operatingSystemIconInfo = {
  tizen: {
    key: 'tizen',
    val: 'Tizen',
    icon: `${CMS_MEDIA_SERVER}cms/Tizen_b99350214e/Tizen_b99350214e.svg`,
  },
  'mac os': {
    key: 'macos',
    val: 'Mac OS',
    icon: `${CMS_MEDIA_SERVER}cms/mac_OS_804456afd8/mac_OS_804456afd8.png`,
  },
  windows: {
    key: 'windows',
    val: 'Windows',
    icon: `${CMS_MEDIA_SERVER}cms/Windows_fdfe6749b6/Windows_fdfe6749b6.svg`,
  },
  linux: {
    key: 'linux',
    val: 'Linux',
    icon: `${CMS_MEDIA_SERVER}cms/Linux_31f8353a2e/Linux_31f8353a2e.svg`,
  },
  chromium: {
    key: 'chromium',
    val: 'Chromium',
    icon: `${CMS_MEDIA_SERVER}cms/Chromium_3df17710bd/Chromium_3df17710bd.svg`,
  },
  ubuntu: {
    key: 'ubuntu',
    val: 'Ubuntu',
    icon: `${CMS_MEDIA_SERVER}cms/Ubuntu_966dd923c5/Ubuntu_966dd923c5.svg`,
  },
  ios: {
    key: 'ios',
    val: 'iOS',
    icon: `${CMS_MEDIA_SERVER}cms/i_OS_3cdc9d9b71/i_OS_3cdc9d9b71.svg`,
  },
  android: {
    key: 'android',
    val: 'Android',
    icon: `${CMS_MEDIA_SERVER}cms/Android_49dcfdc934/Android_49dcfdc934.svg`,
  },
};

export const browserTypeIconInfo = {
  brave: {
    key: 'brave',
    val: 'Brave',
    icon: `${CMS_MEDIA_SERVER}cms/Brave_7e66131f09/Brave_7e66131f09.svg`,
  },
  chrome: {
    key: 'chrome',
    val: 'Chrome',
    icon: `${CMS_MEDIA_SERVER}cms/Chrome_7bf77fbdd7/Chrome_7bf77fbdd7.svg`,
  },
  firefox: {
    key: 'firefox',
    val: 'Firefox',
    icon: `${CMS_MEDIA_SERVER}cms/Firefox_30f3976fb8/Firefox_30f3976fb8.svg`,
  },
  safari: {
    key: 'safari',
    val: 'Safari',
    icon: `${CMS_MEDIA_SERVER}cms/Safari_254e74ed94/Safari_254e74ed94.svg`,
  },
  'mobile safari': {
    key: 'safari',
    val: 'Safari',
    icon: `${CMS_MEDIA_SERVER}cms/Safari_254e74ed94/Safari_254e74ed94.svg`,
  },
  edge: {
    key: 'edge',
    val: 'Edge',
    icon: `${CMS_MEDIA_SERVER}cms/Edge_23add4a83f/Edge_23add4a83f.svg`,
  },
  opera: {
    key: 'opera',
    val: 'Opera',
    icon: `${CMS_MEDIA_SERVER}cms/Opera_0f3bf4eb19/Opera_0f3bf4eb19.svg`,
  },
};

const CheckDetails = ({ title, value, iconURL }: { title: string; value: string; iconURL?: string }) => (
  <Box css={{ w: '100%', my: '$10', p: '$10', r: '$1', bg: '$surface_default', '@lg': { w: 'auto' } }}>
    <Text css={{ c: '$on_primary_medium', mb: '$6' }}>{title}</Text>
    <Flex align="center">
      {iconURL && (
        <Box css={{ size: '2rem', r: '$round', bg: '$surface_brighter', mr: '$4' }}>
          <img style={{ objectFit: 'contain', width: '2rem' }} src={iconURL} alt={value} />
        </Box>
      )}
      <Text>{value}</Text>
    </Flex>
  </Box>
);

export const BrowserTest = () => {
  const { hmsDiagnostics, updateStep } = useDiagnostics();
  const [error, setError] = useState<Error | undefined>();
  useEffect(() => {
    try {
      hmsDiagnostics?.checkBrowserSupport();
    } catch (err) {
      updateStep(DiagnosticsStep.BROWSER, { hasFailed: true });
      setError(err as Error);
    }
  }, [hmsDiagnostics, updateStep]);
  return (
    <>
      <TestContainer css={{ display: 'flex', gap: '$8', '@lg': { display: 'block' } }}>
        <CheckDetails
          title="Browser"
          iconURL={
            parsedUserAgent.getBrowser().name &&
            browserTypeIconInfo[parsedUserAgent.getBrowser().name?.toLowerCase() as keyof typeof browserTypeIconInfo]
              ?.icon
          }
          value={`${parsedUserAgent.getBrowser().name} ${parsedUserAgent.getBrowser().version}`}
        />
        <CheckDetails
          title="Operating system"
          iconURL={
            parsedUserAgent.getOS().name &&
            operatingSystemIconInfo[parsedUserAgent.getOS().name?.toLowerCase() as keyof typeof operatingSystemIconInfo]
              ?.icon
          }
          value={`${parsedUserAgent.getOS().name} ${parsedUserAgent.getOS().version}`}
        />
      </TestContainer>
      <TestFooter error={error} ctaText="Is your device information correct?" />
    </>
  );
};
