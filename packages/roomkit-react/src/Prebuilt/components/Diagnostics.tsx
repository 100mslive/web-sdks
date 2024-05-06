import React, { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParam } from 'react-use';
import {
  HMSDiagnostics,
  HMSDiagnosticsCheck,
  HMSDiagnosticsOutput,
  HMSDiagnosticsOutputValue,
  TrackAudioLevelMonitor,
} from '@100mslive/hms-diagnostics';
// @ts-ignore: No implicit Any
import { Logo } from './Header/HeaderComponents';
import { Accordion } from '../../Accordion';
import { Button } from '../../Button';
import { VerticalDivider } from '../../Divider';
import { Flex } from '../../Layout';
import { Loading } from '../../Loading';
import { Text } from '../../Text';
import { useTheme } from '../../Theme';
import { StyledVideo } from '../../Video';
// @ts-ignore: No implicit Any
import { ErrorDialog } from '../primitives/DialogContent';

const diagnostics = new HMSDiagnostics();
const HMSDiagnosticsChecks = Object.keys(HMSDiagnosticsCheck);

const DiagnosticsItem = ({
  name,
  properties,
}: {
  name: HMSDiagnosticsCheck;
  properties?: HMSDiagnosticsOutputValue;
}) => {
  if (!name) {
    return null;
  }
  const description = diagnostics.getDescriptionForCheck(name);

  return (
    <Accordion.Item
      value={properties ? properties.id : name}
      css={{
        p: '$4 $8',
        borderBottom: '1px solid $backgroundDefault',
        cursor: 'pointer',
      }}
    >
      <Accordion.Header>
        <Flex align="center" css={{ width: '100%', justifyContent: 'space-between' }}>
          <Text variant="lg" css={{ mr: '$2' }}>
            {name}
          </Text>
          {properties ? (
            properties.success ? (
              <Text variant="body2" css={{ color: '$success', mx: '$6' }}>
                Passed
              </Text>
            ) : (
              <Text variant="body2" css={{ color: '$error', mx: '$6' }}>
                Failed
              </Text>
            )
          ) : (
            <Loading />
          )}
        </Flex>
      </Accordion.Header>
      <Accordion.Content>
        <Flex direction="column" css={{ overflowX: 'auto' }}>
          {description && (
            <Text variant="body1" css={{ my: '$4' }}>
              {description}
            </Text>
          )}
          {properties && (
            <>
              {properties.errorMessage && (
                <Text variant="body1" css={{ my: '$4' }}>
                  Error: {properties.errorMessage}
                </Text>
              )}
              {properties.info && (
                <Text variant="body1" css={{ my: '$4' }}>
                  Info:
                  <pre>{JSON.stringify(properties.info, null, '\t')}</pre>
                </Text>
              )}
            </>
          )}
        </Flex>
      </Accordion.Content>
    </Accordion.Item>
  );
};

const sigmoid = (z: number) => {
  return 1 / (1 + Math.exp(-z));
};

const AUDIO_LEVEL_THRESHOLD = 35;

function useAudioLevelStyles(track: MediaStreamTrack, ref: MutableRefObject<HTMLVideoElement | null>) {
  const audioLevelMonitor = useRef<TrackAudioLevelMonitor | null>(null);
  const { theme } = useTheme();
  const color = theme.colors.primary_default.value;
  const getStyle = useCallback(
    (level: number) => {
      const style = {
        transition: 'box-shadow 0.4s ease-in-out',
        'box-shadow': level
          ? `0px 0px ${24 * sigmoid(level)}px ${color}, 0px 0px ${16 * sigmoid(level)}px ${color}`
          : '',
      };
      return style;
    },
    [color],
  );

  useEffect(() => {
    if (track) {
      audioLevelMonitor.current = new TrackAudioLevelMonitor(track, (level: number) => {
        if (!ref.current) {
          return;
        }
        level = level > AUDIO_LEVEL_THRESHOLD ? level : 0;

        const styles = getStyle(level);
        for (const key in styles) {
          //@ts-ignore
          ref.current.style[key] = styles[key];
        }
      });
      audioLevelMonitor.current.start();
    }

    return () => {
      audioLevelMonitor.current?.stop();
    };
  }, [track, ref, getStyle]);
}

const VideoTile = React.memo(
  ({ videoTrack, audioTrack }: { videoTrack: MediaStreamTrack; audioTrack: MediaStreamTrack }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    useAudioLevelStyles(audioTrack, videoRef);

    useEffect(() => {
      if (videoRef.current && videoTrack) {
        videoRef.current.srcObject = new MediaStream([videoTrack]);
      }
    }, [videoTrack]);

    return (
      <Flex direction="column" css={{ w: '60%' }}>
        {videoTrack && (
          <>
            <StyledVideo autoPlay muted playsInline controls={false} ref={videoRef} mirror={true} />
            <Text css={{ textAlign: 'center', mb: '$3', mt: '$10' }}>Camera Used: {videoTrack.label}</Text>
          </>
        )}
        {audioTrack && <Text css={{ textAlign: 'center', my: '$3' }}>Microphone Used: {audioTrack.label}</Text>}
      </Flex>
    );
  },
);

const Header = () => {
  return (
    <Flex css={{ p: '$8' }}>
      <Flex align="center">
        <Logo />
        <VerticalDivider css={{ mx: '$4' }} />
        <Text variant="h5">Diagnostics</Text>
      </Flex>
    </Flex>
  );
};

const downloadJson = (obj: object, fileName: string) => {
  const a = document.createElement('a');
  const file = new Blob([JSON.stringify(obj, null, 2)], {
    type: 'application/json',
  });
  a.href = URL.createObjectURL(file);
  a.download = `${fileName}.json`;
  a.click();
};

const QUERY_PARAM_AUTH_TOKEN = 'token';
const env = process.env.REACT_APP_ENV || 'prod';

export const Diagnostics = () => {
  const [results, setResults] = useState<HMSDiagnosticsOutputValue[]>([]);
  const [jsonResult, setJsonResult] = useState<HMSDiagnosticsOutput>();
  const authToken = useSearchParam(QUERY_PARAM_AUTH_TOKEN);

  // const tokenEndpoint = useTokenEndpoint();
  // const [token, setToken] = useState(null);
  /* useEffect(() => {
    if (authToken) {
      setToken(authToken);
      return;
    }
    if (!tokenEndpoint || !urlRoomId) {
      return;
    }
    const getTokenFn = !userRole ? () => getUserToken(v4()) : () => getToken(tokenEndpoint, v4(), userRole, urlRoomId);
    getTokenFn()
      .then(token => {
        setToken(token);
      })
      .catch(error => {
        setError(convertTokenError(error));
      });
  }, [tokenEndpoint, urlRoomId, userRole, authToken]); */

  useEffect(() => {
    if (authToken) {
      diagnostics
        .start(
          {
            authToken,
            initEndpoint: `https://${env}-init.100ms.live/`,
          },
          {
            onUpdate: update => {
              setResults(res => {
                if (res.find(item => item.id === update.id)) {
                  return res;
                } else {
                  return res.concat(update);
                }
              });
            },
          },
        )
        .then(res => {
          console.log(JSON.stringify(res, null, '\t'));
          setJsonResult(res);
        });
    }
  }, [authToken]);

  const videoTrack: MediaStreamTrack = useMemo(
    () => results?.find(item => item?.name.toLowerCase().includes('camera'))?.info?.videoTrack,
    [results],
  );

  const audioTrack: MediaStreamTrack = useMemo(
    () => results?.find(item => item?.name.toLowerCase().includes('microphone'))?.info?.audioTrack,
    [results],
  );

  if (!authToken) {
    return <ErrorDialog title="Missing token">Auth token required to diagnose a session is missing</ErrorDialog>;
  }

  return (
    <Flex direction="column" css={{ size: '100%', overflowY: 'auto', bg: '$background_default' }}>
      <Header />
      {results && (
        <Flex>
          <Flex
            direction="column"
            css={{
              w: '40%',
              m: '$8',
            }}
          >
            <Accordion.Root defaultValue={['WebRTC']} type="multiple">
              {HMSDiagnosticsChecks.map(name => {
                const checkResults = results.filter(check => check.name === name);
                // check loading
                if (checkResults.length === 0) {
                  return <DiagnosticsItem key={name} name={name as HMSDiagnosticsCheck} />;
                } else {
                  return checkResults.map(item => <DiagnosticsItem key={item.id} name={item.name} properties={item} />);
                }
              })}
            </Accordion.Root>
            {jsonResult && (
              <Flex css={{ w: '100%', justifyContent: 'center', my: '$10' }}>
                <Button onClick={() => downloadJson(jsonResult, 'diagnostics_result')}>Download Results</Button>
              </Flex>
            )}
          </Flex>
          <Flex
            direction="column"
            css={{
              width: '60%',
              pt: '$20',
              alignItems: 'center',
            }}
          >
            <VideoTile videoTrack={videoTrack} audioTrack={audioTrack} />
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};
