import React, { Suspense, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import merge from 'lodash.merge';
import { Flex, Loading } from '@100mslive/react-ui';
import {
  apiBasePath,
  getAuthInfo,
  getRoomCodeFromUrl,
  getWithRetry,
  mapFromBackend,
  mapTileShape,
  storeRoomSettings,
} from './utils/utils';

import logoLight from './assets/images/logo-on-white.png';
import logoDark from './assets/images/logo-on-black.png';
import LogRocket from 'logrocket';

const Header = React.lazy(() => import('./components/Header'));
const RoomSettings = React.lazy(() => import('./components/RoomSettings'));
const ErrorModal = React.lazy(() => import('./components/ErrorModal'));
const HMSEdtechTemplate = React.lazy(() =>
  import('100ms_edtech_template').then(module => ({ default: module.EdtechComponent })),
);
let hostname = window.location.hostname;
if (!hostname.endsWith('app.100ms.live')) {
  hostname = process.env.REACT_APP_HOST_NAME || hostname;
} else if (hostname.endsWith('dev-app.100ms.live')) {
  // route dev-app appropriately to qa or prod
  const envSuffix = process.env.REACT_APP_ENV === 'prod' ? 'app.100ms.live' : 'qa-app.100ms.live';
  hostname = hostname.replace('dev-app.100ms.live', envSuffix);
} else if (hostname.endsWith('qa-app.100ms.live') && process.env.REACT_APP_ENV === 'prod') {
  hostname = hostname.replace('qa-app.100ms.live', 'app.100ms.live');
}

const App = () => {
  const prevSavedSettings = useRef({});
  const appInfo = useRef({ app_type: '', app_name: '' });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [onlyEmail, setOnlyEmail] = useState(false);
  const [error, setError] = useState('');
  const [roomLinks, setRoomLinks] = useState({});
  const [settings, setSettings] = useState({
    theme: 'dark',
    tile_shape: '1-1',
    font: 'Inter',
    avatars: 'initial',
    brand_color: '#2F80FF',
    logo_obj: null,
    logo_url: null,
    logo_name: null,
    recording_url: '',
    metadataFields: {
      clicks: 0,
      metadata: '',
    },
  });

  useEffect(() => {
    const code = getRoomCodeFromUrl();
    if (code) {
      fetchData();
    }
  }, []);
  useEffect(() => {
    setUpdateMetadataOnWindow();
  }, [settings]); //eslint-disable-line

  const setUpdateMetadataOnWindow = () => {
    if (!window.__hmsApp) {
      window.__hmsApp = {};
    }
    window.__hmsApp.updateMetadata = async metadata => {
      try {
        const currentMetadata = !settings.metadataFields.metadata ? {} : JSON.parse(settings.metadataFields.metadata);
        const metaUpdate = JSON.stringify(merge(currentMetadata, metadata));
        console.log(metaUpdate);
        await storeRoomSettings({
          hostname,
          appInfo: appInfo.current,
          settings: {
            ...settings,
            metadataFields: {
              ...settings.metadataFields,
              metadata: metaUpdate,
            },
          },
        });
        changeSettings('metadataFields', {
          ...settings.metadataFields,
          metadata: metaUpdate,
        });
      } catch (error) {
        console.error(error);
      }
    };
  };

  const getRoomDetails = async name => {
    const code = getRoomCodeFromUrl();
    if (!code) {
      LogRocket.track('roomIdNull', window.location.pathname);
      return;
    }
    const jwt = getAuthInfo().token;
    const url = `${apiBasePath}get-token`;
    let headers;
    if (jwt) {
      headers = {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        subdomain: hostname,
      };
    } else {
      headers = {
        'Content-Type': 'application/json',
        subdomain: hostname,
      };
    }

    let formData = new FormData();
    formData.append('code', code);
    formData.append('user_id', name);

    return await axios
      .post(url, formData, { headers: headers })
      .then(res => {
        try {
          return res.data.token;
        } catch (err) {
          throw Error(err);
        }
      })
      .catch(err => {
        throw err;
      });
  };

  const fetchData = async () => {
    const jwt = getAuthInfo().token;
    const code = getRoomCodeFromUrl();
    const url = `${apiBasePath}apps/get-details?domain=${hostname}&room_id=${code}`;
    const headers = {};
    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
    }
    headers['Content-Type'] = 'application/json';

    getWithRetry(url, headers)
      .then(res => {
        if (res.data.success) {
          let prevSettings = res.data;
          const { app_type, app_name } = res.data;
          prevSettings = mapFromBackend(prevSettings);
          prevSettings = {
            theme: prevSettings.theme.toLowerCase(),
            tile_shape: mapTileShape(prevSettings.tile_shape),
            font: prevSettings.font,
            avatars: prevSettings.video_off_avatars,
            brand_color: prevSettings.color,
            logo_obj: null,
            logo_url: prevSettings.logo,
            recording_url: prevSettings.recording_url,
            logo_name: null,
            metadataFields: {
              clicks: 0,
              metadata: prevSettings.metadata,
            },
          };
          setOnlyEmail(res.data.same_user);
          prevSavedSettings.current = Object.assign({}, prevSettings);
          appInfo.current = { app_name, app_type };
          setRoomLinks(res.data.room_links);
          setSettings(prevSettings);
        }
      })
      .catch(err => {
        const errorMessage = `[FetchData - get-details] ${err.message} ${err.toJSON && JSON.stringify(err.toJSON())}`;
        let error = {
          title: 'Something went wrong',
          body: errorMessage,
        };
        LogRocket.track('getDetailsError', error);
        if (err.response && err.response.status === 404) {
          error = {
            title: 'Link is invalid',
            body: 'Please make sure the domain name is right',
          };
        }
        setError(error);
        console.error(errorMessage);
      });
  };

  const storeSettings = async () => {
    setSavingSettings(true);
    await storeRoomSettings({
      hostname,
      appInfo: appInfo.current,
      settings,
    });
    setSavingSettings(false);
  };

  const changeSettings = (key, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value,
    }));
  };

  const toggleModal = () => {
    setShowSettingsModal(value => !value);
    changeSettings('metadataFields', {
      ...settings.metadataFields,
      clicks: 0,
    });
  };

  const handleLogoChange = e => {
    if (e.target.files && e.target.files[0]) {
      const logo_name = e.target.files[0].name;
      const logo_url = URL.createObjectURL(e.target.files[0]);
      const logo_obj = e.target.files[0];
      setSettings(value => ({
        ...value,
        logo_obj,
        logo_url,
        logo_name,
      }));
    }
  };

  const saveDetails = () => {
    prevSavedSettings.current = settings;
    setShowSettingsModal(false);
    storeSettings();
  };

  return (
    <Flex direction="column" css={{ size: '100%', overflowY: 'hidden', bg: '$mainBg' }}>
      {error && (
        <Suspense fallback={null}>
          <ErrorModal title={error.title} body={error.body} />
        </Suspense>
      )}
      {onlyEmail && (
        <Suspense fallback={null}>
          <Header
            savingData={savingSettings}
            refreshData={fetchData}
            settings={settings}
            roomLinks={roomLinks}
            onlyEmail={onlyEmail}
            toggleModal={toggleModal}
          />
        </Suspense>
      )}

      {!error && (
        <Suspense
          fallback={
            <Flex justify="center" align="center" css={{ size: '100%' }}>
              <Loading size={100} />
            </Flex>
          }
        >
          <HMSEdtechTemplate
            tokenEndpoint={`${apiBasePath + hostname}/`}
            themeConfig={{
              aspectRatio: settings.tile_shape,
              font: settings.font,
              color: settings.brand_color,
              theme: settings.theme,
              logo: settings.logo_url || (settings.theme === 'dark' ? logoDark : logoLight),
              headerPresent: String(!!getAuthInfo().userEmail),
              metadata: settings.metadataFields.metadata,
              recordingUrl: settings.recording_url,
            }}
            getUserToken={getRoomDetails}
            getDetails={fetchData}
          />
        </Suspense>
      )}
      {showSettingsModal && (
        <Suspense fallback={null}>
          <RoomSettings
            onClose={toggleModal}
            handleLogoChange={handleLogoChange}
            settings={settings}
            change={changeSettings}
            onSave={saveDetails}
            onCancel={() => {
              setSettings(Object.assign({}, prevSavedSettings.current));
              setShowSettingsModal(false);
            }}
          />
        </Suspense>
      )}
    </Flex>
  );
};

export default App;
