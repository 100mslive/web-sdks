import React, { Component, Suspense } from 'react';
import cookies from 'js-cookies';
import axios from 'axios';
import { Box, Flex, Loading } from '@100mslive/react-ui';
import { EdtechComponent as HMSEdtechTemplate } from '100ms_edtech_template';

// icons
import logoLight from './assets/images/logo-on-white.png';
import logoDark from './assets/images/logo-on-black.png';

const Header = React.lazy(() => import('./components/Header'));
const RoomSettings = React.lazy(() => import('./components/RoomSettings'));
const ErrorModal = React.lazy(() => import('./components/ErrorModal'));
const hostname = process.env.REACT_APP_HOST_NAME || window.location.hostname;

class App extends Component {
  constructor() {
    super();
    this.state = {
      activeTab: 'theme',
      modal: false,
      loading: true,
      showHeader: true,
      userEmail: null,
      onlyEmail: false,
      roleNames: null,
      roomJoinToken: null,
      roomLinks: null,
      roomCode: null,
      savingData: false,
      error: null,

      // user's settings
      final_state: {
        theme: 'dark',
        tile_shape: '1-1',
        font: 'Inter',
        avatars: 'initial',
        brand_color: '#2F80FF',
        logo_obj: null,
        logo_url: null,
        logo_name: null,
      },
      temporary_state: {
        theme: 'dark',
        tile_shape: '1-1',
        font: 'Inter',
        avatars: 'initial',
        brand_color: '#2F80FF',
        logo_obj: null,
        logo_url: null,
        logo_name: null,
        metadataFields: {
          clicks: 0,
          metadata: '',
        },
      },
    };
  }

  componentDidMount() {
    this.extractUrlCode();
    this.fetchData();
  }

  fetchUserToken = async name => {
    return await this.getRoomDetails(this.getToken(), name);
  };

  getRoomDetails = async (jwt, name) => {
    const code = this.extractUrlCode();
    axios.create({ baseURL: process.env.REACT_APP_BACKEND_API, timeout: 2000 });
    const url = `${process.env.REACT_APP_BACKEND_API}get-token`;
    var headers = {};
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

  extractUrlCode = () => {
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
    this.setState({ roomCode });
    return roomCode;
  };

  getToken = () => {
    try {
      const cookieName = process.env.REACT_APP_ENV === 'qa' ? 'authUser-qa' : 'authUser';
      const authUser = JSON.parse(cookies.getItem(cookieName));
      const token = authUser?.token;
      this.setState({ userEmail: authUser?.email });
      return token;
    } catch (e) {
      // user not logged in
      this.setState({ showHeader: false });
      console.log(e);
    }
  };

  fetchData = async () => {
    const jwt = this.getToken();
    axios.create({ baseURL: process.env.REACT_APP_API_SERVER, timeout: 2000 });
    var url = `${
      process.env.REACT_APP_BACKEND_API
    }apps/get-details?domain=${hostname}&room_id=${this.extractUrlCode()}`;

    console.log('url', url);
    let headers = {};
    if (jwt) {
      headers = {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      };
    } else {
      headers = {
        'Content-Type': 'application/json',
      };
    }

    let mapTileShape = shape => {
      if (shape === 'SQUARE') {
        return '1-1';
      } else if (shape === 'WIDE') {
        return '16-9';
      } else if (shape === 'LANDSCAPE') {
        return '4-3';
      }
      return shape;
    };

    let mapFromBackend = data => {
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

    const getWithRetry = async (url, headers) => {
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

    getWithRetry(url, headers)
      .then(res => {
        if (res.data.success) {
          let prevSettings = res.data;
          const { app_type, app_name } = res.data;
          console.log(res.data);
          prevSettings = mapFromBackend(prevSettings);
          prevSettings = {
            theme: prevSettings.theme.toLowerCase(),
            tile_shape: mapTileShape(prevSettings.tile_shape),
            font: prevSettings.font,
            avatars: prevSettings.video_off_avatars,
            brand_color: prevSettings.color,
            logo_obj: null,
            logo_url: prevSettings.logo,
            logo_name: null,
            metadataFields: {
              clicks: 0,
              metadata: prevSettings.metadata,
            },
            plugins: {
              chat: prevSettings.chat,
              'screen-share': prevSettings.screenshare,
              'universal-annotation': prevSettings.annotation,
              'virtual-bg': prevSettings.background,
              spotlight: prevSettings.spotlight,
              'raise-hand': prevSettings.raise_hand,
              'google-drive': prevSettings.google_drive,
              youtube: prevSettings.youtube,
            },
          };
          this.setState({
            loading: false,
            onlyEmail: res.data.same_user,
            final_state: prevSettings,
            temporary_state: prevSettings,
            roleNames: res.data.role,
            roomLinks: res.data.room_links,
            app_name,
            app_type,
            error: null,
          });
        } else {
          console.error('get-details failure', res.data);
          throw Error('something went wrong, success is not true!');
        }
      })
      .catch(err => {
        const errorMessage = `[FetchData - get-details] ${err.message} ${err.toJSON && JSON.stringify(err.toJSON())}`;
        let error = {
          title: 'Something went wrong',
          body: errorMessage,
        };
        if (err.response && err.response.status === 404) {
          error = {
            title: 'Link is invalid',
            body: 'Please make sure the domain name is right',
          };
        }
        this.setState({
          loading: false,
          error,
        });
        console.error(errorMessage);
      });
    return this.state.temporary_state.logo_url;
  };

  storeSettings = async jwt => {
    const mapTileShape = value => {
      return value === '1-1' ? 'SQUARE' : value === '16-9' ? 'WIDE' : 'LANDSCAPE';
    };

    const currentSettings = this.state.temporary_state;
    const logoFile = currentSettings.logo_obj;
    let formData = new FormData();
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    formData.append('color', currentSettings.brand_color);
    formData.append('font', currentSettings.font.toUpperCase());
    formData.append('tile_shape', mapTileShape(currentSettings.tile_shape));
    formData.append('theme', currentSettings.theme.toUpperCase());
    formData.append('app_type', this.state.app_type);
    formData.append('app_name', this.state.app_name);
    formData.append('subdomain', hostname);
    formData.append('metadata', currentSettings.metadataFields.metadata);

    this.setState({ savingData: true });

    axios.create({ baseURL: process.env.REACT_APP_BACKEND_API, timeout: 2000 });
    const url = `${process.env.REACT_APP_BACKEND_API}apps/details`;

    const headers = {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'multipart/form-data',
    };

    await axios
      .post(url, formData, { headers: headers })
      .then(res => {
        if (res.data.success) {
          console.log('Details saves successfully!');
        } else {
          throw Error('Error while storing the data!');
        }
      })
      .catch(err => {
        console.log(err);
      });
    this.setState({ savingData: false });
  };

  changeSettings = (key, value) => {
    this.setState({
      temporary_state: {
        ...this.state.temporary_state,
        [key]: value,
      },
    });
  };

  toggleModal = () => {
    this.setState({ modal: !this.state.modal });
    this.changeSettings('metadataFields', {
      ...this.state.temporary_state.metadataFields,
      clicks: 0,
    });
  };

  content = () => {
    switch (this.state.activeTab) {
      case 'theme':
        return (
          <RoomSettings
            handleLogoChange={this.handleLogoChange}
            settings={this.state.temporary_state}
            change={this.changeSettings}
          />
        );
      default:
        return null;
    }
  };

  handleLogoChange = e => {
    if (e.target.files && e.target.files[0]) {
      const logo_name = e.target.files[0].name;
      const logo_url = URL.createObjectURL(e.target.files[0]);
      const logo_obj = e.target.files[0];
      this.setState({
        temporary_state: {
          ...this.state.temporary_state,
          logo_obj,
          logo_url,
          logo_name,
        },
      });
    }
  };

  saveDetails = () => {
    const token = this.getToken();
    this.setState({
      final_state: this.state.temporary_state,
      modal: false,
    });
    this.storeSettings(token);
  };

  render() {
    if (this.state.loading) {
      return (
        <Flex justify="center" align="center" css={{ size: '100%' }}>
          <Loading size={100} />
        </Flex>
      );
    }
    return (
      <Flex direction="column" css={{ size: '100%', overflow: 'hidden', bg: '$mainBg' }}>
        {this.state.error && (
          <Suspense fallback={<Box />}>
            <ErrorModal title={this.state.error.title} body={this.state.error.body} />
          </Suspense>
        )}
        {this.state.onlyEmail && (
          <Suspense fallback={<Box />}>
            <Header
              savingData={this.state.savingData}
              refreshData={this.fetchData}
              settings={this.state.temporary_state}
              roleNames={this.state.roleNames}
              roomLinks={this.state.roomLinks}
              onlyEmail={this.state.onlyEmail}
              email={this.state.userEmail}
              toggleModal={this.toggleModal}
            />
          </Suspense>
        )}
        <HMSEdtechTemplate
          tokenEndpoint={`${process.env.REACT_APP_BACKEND_API + hostname}/`}
          themeConfig={{
            aspectRatio: this.state.temporary_state.tile_shape,
            font: this.state.temporary_state.font,
            color: this.state.temporary_state.brand_color,
            theme: this.state.temporary_state.theme,
            showChat: this.state.temporary_state.plugins.chat.toString(),
            showScreenshare: this.state.temporary_state.plugins['screen-share'].toString(),
            logo:
              this.state.temporary_state.logo_url ||
              (this.state.temporary_state.theme === 'dark' ? logoDark : logoLight),
            showAvatar: 'true',
            avatarType: this.state.temporary_state.avatars,
            logoClass: 'h-12',
            headerPresent: this.state.showHeader.toString(),
            metadata: this.state.temporary_state.metadataFields.metadata,
          }}
          getUserToken={this.fetchUserToken}
        />
        {this.state.modal && (
          <Suspense fallback={<div>Loading...</div>}>
            <RoomSettings
              onClose={this.toggleModal}
              handleLogoChange={this.handleLogoChange}
              settings={this.state.temporary_state}
              change={this.changeSettings}
              onSave={this.saveDetails}
              onCancel={() => {
                this.setState({
                  temporary_state: this.state.final_state,
                  modal: false,
                });
              }}
            />
          </Suspense>
        )}
      </Flex>
    );
  }
}

export default App;
