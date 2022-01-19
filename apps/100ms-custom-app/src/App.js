import React, { Component } from 'react';
import cookies from 'js-cookies';
import axios from 'axios';
import { EdtechComponent as HMSEdtechTemplate } from '100ms-edtech-template';

// components
import Modal from './components/Modal';
import Header from './components/Header';
import Devider from './components/Devider';
import ErrorModal from './components/ErrorModal';

// icons
import chat from './assets/images/plugins/chat.svg';
import caret from './assets/images/icons/up-caret.svg';
// import googleDrive from "./assets/images/plugins/google-drive.svg";
// import hand from "./assets/images/plugins/hand.svg";
import shareScreen from './assets/images/plugins/share-screen.svg';
// import spotlight from "./assets/images/plugins/spotlight.svg";
// import universelAnnotation from "./assets/images/plugins/universel-annotation.svg";
// import virtualBg from "./assets/images/plugins/virtual-bg.svg";
// import youtube from "./assets/images/plugins/youtube.svg";
import info from './assets/images/icons/info.svg';
import Dropdown from './components/Dropdown';
import GridLayout from './assets/images/icons/grid-view.svg';
import SpeakerLayout from './assets/images/icons/speaker-view.svg';
// import pebbleIcons from './assets/images/icons/pebble-icons.svg'
import initialIcons from './assets/images/icons/initial-icons.svg';
import logoLight from './assets/images/logo-on-white.png';
import logoDark from './assets/images/logo-on-black.png';
import 'react-toastify/dist/ReactToastify.css';
import './tailwind.css';

const hostname = window.location.hostname;

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
        plugins: {
          chat: true,
          'screen-share': true,
          'universal-annotation': true,
          'virtual-bg': true,
          spotlight: true,
          'raise-hand': true,
          'google-drive': true,
          youtube: true,
        },
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
        plugins: {
          chat: true,
          'screen-share': true,
          'universal-annotation': true,
          'virtual-bg': true,
          spotlight: true,
          'raise-hand': true,
          'google-drive': true,
          youtube: true,
        },
      },
      teacher_layout: null,
      sidebarContent: null,
      student_layout: null,
      allowedOnStage: null,
      roleOnNew: null,
      hostRole: null,
      participantsLive: {
        'ajay.trivedi@company.com': null,
        'samir.bharadwaj@company.com': null,
        'surabhi.kumar@company.com': null,
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
    const url = process.env.REACT_APP_BACKEND_API + 'get-token';
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
        if (path[i] === '/') break;
        roomCode += path[i];
      }
      if (roomCode.trim() === '') roomCode = null;
    }
    this.setState({ roomCode });
    return roomCode;
  };

  getToken = () => {
    try {
      const authUser = JSON.parse(cookies.getItem('authUser'));
      const token = authUser.token;
      this.setState({ userEmail: authUser.email });
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
    var url =
      process.env.REACT_APP_BACKEND_API + 'apps/get-details?domain=' + hostname + '&room_id=' + this.extractUrlCode();

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
      if (shape === 'SQUARE') return '1-1';
      else if (shape === 'WIDE') return '16-9';
      else if (shape === 'LANDSCAPE') return '4-3';
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
    const getBoolean = value => {
      return value ? '1' : '0';
    };

    const mapTileShape = value => {
      return value === '1-1' ? 'SQUARE' : value === '16-9' ? 'WIDE' : 'LANDSCAPE';
    };

    const mapAvatars = value => {
      switch (value) {
        case 'initial':
          return 'initials';
        case 'pebble':
          return 'pebble people';
        default:
          return 'none';
      }
    };

    const currentSettings = this.state.temporary_state;
    const logoFile = currentSettings.logo_obj;
    let formData = new FormData();
    if (logoFile) formData.append('logo', logoFile);

    formData.append('color', currentSettings.brand_color);
    formData.append('font', currentSettings.font.toUpperCase());
    formData.append('tile_shape', mapTileShape(currentSettings.tile_shape));
    formData.append('theme', currentSettings.theme.toUpperCase());
    formData.append('video_off_avatars', mapAvatars(currentSettings.avatars));
    formData.append('chat', getBoolean(currentSettings.plugins.chat));
    formData.append('screenshare', getBoolean(currentSettings.plugins['screen-share']));
    formData.append('annotation', getBoolean(currentSettings.plugins['universal-annotation']));
    formData.append('background', getBoolean(currentSettings.plugins['virtual-bg']));
    formData.append('spotlight', getBoolean(currentSettings.plugins.spotlight));
    formData.append('raise_hand', getBoolean(currentSettings.plugins['raise-hand']));
    formData.append('google_drive', getBoolean(currentSettings.plugins['google-drive']));
    formData.append('youtube', getBoolean(currentSettings.plugins.youtube));
    formData.append('app_type', this.state.app_type);
    formData.append('app_name', this.state.app_name);
    formData.append('subdomain', hostname);
    formData.append('metadata', currentSettings.metadataFields.metadata);

    this.setState({ savingData: true });

    axios.create({ baseURL: process.env.REACT_APP_BACKEND_API, timeout: 2000 });
    const url = process.env.REACT_APP_BACKEND_API + 'apps/details';

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
      case 'plugins':
        return <Plugins settings={this.state.temporary_state} change={this.changeSettings} />;
      case 'participants-roles':
        return <Roles settings={this.state.temporary_state} change={this.changeSettings} />;
      default:
        return <Layout settings={this.state.temporary_state} change={this.changeSettings} />;
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
    Object.keys(this.state.temporary_state).forEach(key => {
      if (this.state.temporary_state[key] !== this.state.final_state[key]) {
      }
    });
    this.setState({
      final_state: this.state.temporary_state,
      modal: false,
    });
    this.storeSettings(token);
  };

  render() {
    const { error } = this.state;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {error ? (
          <div className="bg-black h-full">
            <ErrorModal title={error.title} body={error.body} />
          </div>
        ) : this.state.loading ? (
          <div className="flex items-center h-full justify-center">
            <div className="custom-loader"></div>
          </div>
        ) : (
          <>
            {this.state.onlyEmail && (
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
            )}
            <HMSEdtechTemplate
              tokenEndpoint={process.env.REACT_APP_BACKEND_API + hostname + '/'}
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
                logoClass: 'h-16',
                headerPresent: this.state.showHeader.toString(),
                metadata: this.state.temporary_state.metadataFields.metadata,
              }}
              getUserToken={this.fetchUserToken}
            />
            {this.state.modal && (
              <Modal>
                <div className="max-w-screen-md min-h-[530px] flex flex-col justify-between w-3/4 py-5 px-2.5 text-white rounded-xl bg-gray-cool6">
                  <div>
                    <div className="flex items-center px-2.5 mb-4">
                      <h2 className="font-semibold text-2xl">Customise your app</h2>
                      <button
                        onClick={() => this.toggleModal()}
                        type="button"
                        className="close ml-auto"
                        data-dismiss="modal"
                        aria-label="Close"
                      >
                        <span className={`focus:outline-none  text-2xl text-gray-cool4 text-white`} aria-hidden="true">
                          &times;
                        </span>
                      </button>
                    </div>
                    <Devider />
                    <div className="mt-4 mb-10 flex">
                      <div className="w-60">
                        {/* <div onClick={() => {
                    this.setState({ activeTab: "layout" });
                  }} className={`w-full p-5 rounded-lg mb-2.5 cursor-pointer hover:bg-gray-cool2 hover:bg-opacity-40 ${this.state.activeTab === "layout" ? "bg-gray-cool2 text-white" : " text-gray-cool5"}`}>
                    Layout
                            </div> */}
                        <div
                          onClick={() => {
                            this.setState({ activeTab: 'theme' });
                            this.changeSettings('metadataFields', {
                              ...this.state.temporary_state.metadataFields,
                              clicks: this.state.temporary_state.metadataFields.clicks + 1,
                            });
                          }}
                          className={`w-full p-5 rounded-lg mb-2.5 cursor-pointer hover:bg-gray-cool2 hover:bg-opacity-40 ${
                            this.state.activeTab === 'theme' ? 'bg-gray-cool2 text-white' : ' text-gray-cool5'
                          }`}
                        >
                          Theme
                        </div>
                        {/* <div onClick={() => {
                            this.setState({ activeTab: "plugins" });
                          }} className={`w-full p-5 rounded-lg mb-2.5 cursor-pointer hover:bg-gray-cool2 hover:bg-opacity-40 ${this.state.activeTab === "plugins" ? "bg-gray-cool2 text-white" : " text-gray-cool5"}`}>
                            Plugins
                            </div> */}
                        {/* <div onClick={() => {
                    this.setState({ activeTab: "participants-roles" });
                  }} className={`w-full p-5 rounded-lg mb-2.5 cursor-pointer hover:bg-gray-cool2 hover:bg-opacity-40 ${this.state.activeTab === "participants-roles" ? "bg-gray-cool2 text-white" : " text-gray-cool5"}`}>
                    Participants roles
                            </div> */}
                      </div>
                      <div className="w-full flex-grow py-2.5 px-5 h-full overflow-y-auto custom-scroll-bar">
                        {this.content()}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Devider />
                    <div className="mt-5 justify-end items-end flex">
                      <button
                        onClick={() => {
                          this.setState({
                            temporary_state: this.state.final_state,
                            modal: false,
                          });
                        }}
                        className=" rounded-lg px-9 py-2.5 bg-gray-cool2 text-white hover:bg-opacity-70 text-sm focus:outline-none mr-4 sm:block hidden"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={this.saveDetails}
                        className=" rounded-lg px-9 py-2.5 bg-blue-standard text-white hover:bg-opacity-70 text-sm focus:outline-none"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </Modal>
            )}
          </>
        )}
      </div>
    );
  }
}

export default App;

class Layout extends Component {
  constructor() {
    super();
    this.state = {};
  }
  render() {
    return (
      <>
        <div className=" text-xl">What a teacher sees</div>
        <div className="flex justify-between items-center mt-5 mb-4">
          <span className=" text-gray-cool5 text-sm font-normal">Layout</span>
          <Dropdown
            values={[
              <div className="flex">
                <img className="w-12 mr-4" src={GridLayout} alt="grid layout icon" />
                <div className="flex flex-col">
                  <div className="text-sm">Grid View</div>
                  <div className="text-xs">
                    Participants will be in a grid. You can choose to allow one role’s participants to be in a sidebar.
                  </div>
                </div>
              </div>,
              <div className="flex">
                <img className="w-12 mr-4" src={SpeakerLayout} alt="grid layout icon" />
                <div className="flex flex-col">
                  <div className="text-sm">Speaker View</div>
                  <div className="text-xs">
                    Active speaker will be shown prominently. You can choose to allow select roles to be on stage.{' '}
                  </div>
                </div>
              </div>,
            ]}
            options={['Grid View', 'Speaker View']}
            selectedOption={option => {
              this.setState({ teacher_layout: option });
            }}
          />
        </div>
        <Devider />
        <div className="flex justify-between items-center mt-4 mb-4">
          <span className=" text-gray-cool5 text-sm font-normal">Sidebar should show...</span>
          <Dropdown
            options={['No sidebar', 'teachers', 'students']}
            selectedOption={option => {
              this.setState({ sidebarContent: option });
            }}
          />
        </div>
        <Devider />
        <div className=" text-xl mt-10">What a student sees</div>
        <div className="flex justify-between items-center mt-5 mb-4">
          <span className=" text-gray-cool5 text-sm font-normal">Layout</span>
          <Dropdown
            values={[
              <div className="flex">
                <img className="w-12 mr-4" src={GridLayout} alt="grid layout icon" />
                <div className="flex flex-col">
                  <div className="text-sm">Grid View</div>
                  <div className="text-xs">
                    Participants will be in a grid. You can choose to allow one role’s participants to be in a sidebar.
                  </div>
                </div>
              </div>,
              <div className="flex">
                <img className="w-12 mr-4" src={SpeakerLayout} alt="grid layout icon" />
                <div className="flex flex-col">
                  <div className="text-sm">Speaker View</div>
                  <div className="text-xs">
                    Active speaker will be shown prominently. You can choose to allow select roles to be on stage.{' '}
                  </div>
                </div>
              </div>,
            ]}
            options={['Grid View', 'Speaker View']}
            selectedOption={option => {
              this.setState({ student_layout: option });
            }}
          />
        </div>
        <Devider />
        <div className="flex justify-between items-center mt-4 mb-4">
          <span className=" text-gray-cool5 text-sm font-normal">Allowed on stage</span>
          <Dropdown
            options={['No sidebar', 'teachers', 'students']}
            selectedOption={option => {
              this.setState({ allowedOnStage: option });
            }}
          />
        </div>
        <Devider />
        <div className=" text-gray-cool5 text-sm font-normal mt-10">
          You can add more roles from{' '}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://dashboard.100ms.live/roles"
            className="text-blue-500 hover:text-blue-600"
          >
            Dashboard / Roles
          </a>
        </div>
      </>
    );
  }
}

function RoomSettings(props) {
  return (
    <>
      <div className="flex justify-between items-center mt-4 mb-4">
        <span className=" text-gray-cool5 text-sm font-normal">Logo</span>
        <div className="flex items-center">
          <span className="text-gray-cool5 text-sm font-normal mr-1 w-16 overflow-hidden overflow-ellipsis whitespace-nowrap">
            {props.settings.logo_name}
          </span>
          <button
            onClick={() => {
              document.getElementById('user-custom-logo').click();
            }}
            className=" rounded-lg px-3 py-2 bg-gray-cool2 text-white hover:bg-opacity-70 text-sm focus:outline-none sm:flex sm:items-center"
          >
            <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10.4167 17.917V10.417"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.08333 13.7503L10.4167 10.417L13.75 13.7503"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.75 17.7311C15.0954 17.4245 16.3302 16.7527 17.3184 15.7896C18.3067 14.8266 19.0101 13.6095 19.3512 12.2724C19.6923 10.9353 19.6579 9.53005 19.2518 8.21125C18.8457 6.89245 18.0836 5.71126 17.0495 4.79766C16.0153 3.88406 14.7491 3.27348 13.3903 3.03312C12.0315 2.79275 10.6327 2.93193 9.3479 3.43532C8.06309 3.93871 6.94206 4.78681 6.10819 5.88627C5.27432 6.98573 4.75995 8.29393 4.62167 9.6669C3.61213 9.87172 2.71426 10.4432 2.10134 11.2712C1.48841 12.0991 1.2039 13.1247 1.30271 14.15C1.40151 15.1754 1.87664 16.1278 2.63637 16.8234C3.39611 17.5191 4.3866 17.9086 5.41667 17.9169H7.08333"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="ml-2">Upload</span>
          </button>
        </div>
      </div>
      <Devider />
      <div className="flex justify-between items-center mb-4 mt-4">
        <span className=" text-gray-cool5 text-sm font-normal">Appearance</span>
        <div className=" flex bg-gray-cool2 text-gray-cool5 rounded-lg max-w-xsm">
          <button
            onClick={() => {
              props.change('theme', 'dark');
            }}
            className={` py-1 px-10 m-1 rounded text-sm font-normal focus:outline-none ${
              props.settings.theme === 'dark' ? 'bg-gray-cool3 text-white' : ''
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => {
              props.change('theme', 'light');
            }}
            className={` py-1 px-10 m-1 rounded text-sm font-normal focus:outline-none ${
              props.settings.theme === 'light' ? 'bg-gray-cool3 text-white' : ''
            }`}
          >
            Light
          </button>
        </div>
      </div>
      <Devider />
      <div className="flex justify-between items-center mt-4 mb-4">
        <span className=" text-gray-cool5 text-sm font-normal">Brand color</span>
        <div className=" flex bg-gray-cool2 text-gray-cool5 rounded-lg max-w-xsm overflow-hidden">
          <button
            onFocus={() => {
              document.getElementById('customise-color-picker').click();
            }}
            onClick={() => {
              document.getElementById('customise-color-picker').click();
            }}
            className="flex justify-between items-center focus:outline-none"
          >
            <div className="py-1.5 pr-2 pl-3 bg-gray-cool7">
              <input
                id="customise-color-picker"
                className="form-control"
                type="color"
                onChange={e => {
                  props.change('brand_color', e.target.value);
                }}
                value={props.settings.brand_color}
              />
            </div>
            <span className="customise-dropdown-btn-header text-sm font-light pl-2 pr-4 text-white">
              {props.settings.brand_color}
            </span>
          </button>
        </div>
      </div>
      <Devider />
      <div className="flex justify-between items-center mt-4 mb-4">
        <span className=" text-gray-cool5 text-sm font-normal">Tile shape</span>
        <div className=" flex items-center text-gray-cool5 duration-500 rounded-lg max-w-xsm">
          <button
            onClick={() => {
              props.change('tile_shape', '1-1');
            }}
            className={` my-1 mx-2 p-0.5 rounded-lg text-sm font-normal focus:outline-none border ${
              props.settings.tile_shape === '1-1' ? 'border-blue-standard' : ' border-gray-cool6'
            }`}
          >
            <div className="flex items-center justify-center w-20 h-20 bg-gray-cool2 rounded-md">Square</div>
          </button>
          <button
            onClick={() => {
              props.change('tile_shape', '4-3');
            }}
            className={` my-1 mx-2 p-0.5 rounded-lg text-sm font-normal focus:outline-none border ${
              props.settings.tile_shape === '4-3' ? 'border-blue-standard' : ' border-gray-cool6'
            }`}
          >
            <div className="flex items-center justify-center w-28 h-20 bg-gray-cool2 rounded-md">Landscape</div>
          </button>
          <button
            onClick={() => {
              props.change('tile_shape', '16-9');
            }}
            className={` my-1 mx-2 p-0.5 rounded-lg text-sm font-normal focus:outline-none border ${
              props.settings.tile_shape === '16-9' ? 'border-blue-standard' : ' border-gray-cool6'
            }`}
          >
            <div className="flex items-center justify-center w-36 h-20 bg-gray-cool2 rounded-md">Wide</div>
          </button>
        </div>
      </div>
      <Devider />
      <div className="flex justify-between items-center mt-4 mb-4">
        <span className=" text-gray-cool5 text-sm font-normal">Font</span>
        <div className="relative">
          <select
            defaultValue={props.settings.font}
            onChange={e => {
              props.change('font', e.target.value);
            }}
            className=" appearance-none bg-gray-cool2 pr-10 focus:bg-gray-cool3 py-2 pl-3 text-sm font-medium rounded-lg cursor-pointer"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Lato">Lato</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Open Sans">Open Sans</option>
            <option value="IBM Plex Sans">IBM Plex Sans</option>
          </select>
          <img
            className={`absolute top-1/2 transform -translate-y-1/2 right-2`}
            style={{ transform: [{ rotate: '90deg' }] }}
            src={caret}
            alt="caret icon"
          />
        </div>
      </div>
      <Devider />
      <div className="flex justify-between items-center mt-4 mb-4">
        <span className=" text-gray-cool5 text-sm font-normal">Video-off avatars</span>
        <Dropdown
          values={[
            // <div className="flex items-center justify-between" >
            //   <span className="text-sm font-normal">Pebble People</span>
            //   <img src={pebbleIcons} alt="pebble people icons" />
            // </div>,
            <div className="flex items-center justify-between">
              <span className="text-sm font-normal">Initials</span>
              <img src={initialIcons} alt="Initial avatar icons" />
            </div>,
          ]}
          options={[
            // "Pebble People",
            'Initials',
          ]}
          defaultValue={'Initials'}
          selectedOption={option => {
            let avatarName;
            switch (option) {
              case 'Pebble People':
                avatarName = 'pebble';
                break;
              default:
                avatarName = 'initial';
            }
            props.change('avatars', avatarName);
          }}
        />
      </div>
      <Devider />
      {props.settings.metadataFields.clicks > 4 && (
        <>
          <div className="flex justify-between items-center mt-4 mb-4">
            <span className=" text-gray-cool5 text-sm font-normal">Metadata</span>
            <div className=" flex bg-gray-cool2 text-black rounded-lg max-w-xsm overflow-hidden">
              <textarea
                id="metadata"
                className="form-control"
                onChange={e => {
                  props.change('metadataFields', {
                    ...props.settings.metadataFields,
                    metadata: e.target.value,
                  });
                }}
                value={props.settings.metadataFields.metadata}
              />
            </div>
          </div>
          <Devider />
        </>
      )}
      <input
        onChange={props.handleLogoChange}
        type="file"
        accept="image/*"
        className="absolute bottom-0 right-0 hidden"
        name="logo"
        id="user-custom-logo"
      />
    </>
  );
}

function Plugins(props) {
  const handlePlugins = e => {
    props.change('plugins', {
      ...props.settings.plugins,
      [e.target.getAttribute('data-pluggin')]: e.target.checked,
    });
  };

  const renderPluginsAndAppsColumn = () => {
    const pluginsAndApps = [
      {
        name: 'Chat',
        id: 'chat',
        icon: chat,
        description: 'Chat with and send files to all participants, or in private. Get chat logs after the call.',
      },
      {
        name: 'Screen Share',
        id: 'screen-share',
        icon: shareScreen,
        description: 'Participants can share their screen or view others’ screens.',
      },
      // {
      //   name: "Universal Annotation",
      //   id: "universal-annotation",
      //   icon: universelAnnotation,
      //   description: "Annotate over any app or any screen share. Decide who can annotate any time."
      // },
      // {
      //   name: "Virtual Backgrounds",
      //   id: "virtual-bg",
      //   icon: virtualBg,
      //   description: "Use virtual backgrounds for privacy or branding. Upload your own if you wish."
      // },
      // {
      //   name: "Spotlight",
      //   id: "spotlight",
      //   icon: spotlight,
      //   description: "Participants can be brought on stage for all participants to see."
      // },
      // {
      //   name: "Raise Hand",
      //   id: "raise-hand",
      //   icon: hand,
      //   description: "Ask for the presenter’s attention without interrupting them or distracting others."
      // },
      // {
      //   name: "Google Drive",
      //   id: "google-drive",
      //   icon: googleDrive,
      //   description: "Present Docs, Slides or Sheets directly. Annotate with Universal Annotation."
      // },
      // {
      //   name: "YouTube",
      //   id: "youtube",
      //   icon: youtube,
      //   description: "Present a YouTube video in high quality. Annotate with Universal Annotation."
      // },
    ];

    return pluginsAndApps.map((plugin, index) => {
      return (
        <React.Fragment key={index}>
          <div className="flex justify-end items-start mt-5 mb-5 text-gray-cool5">
            <img className="w-5 mt-0.5" src={plugin.icon} alt={plugin.name + ' pluggin'} />
            <div className="flex flex-col flex-grow">
              <div className="flex justify-between items-center ml-2">
                <div className="text-base font-normal">{plugin.name}</div>
              </div>
              <div className="pl-2 text-sm mt-0.5">{plugin.description}</div>
            </div>
            <div>
              <input
                className="custom-toggle"
                onChange={handlePlugins}
                data-pluggin={plugin.id}
                type="checkbox"
                id={plugin.id + '-pluggin'}
                checked={props.settings.plugins[plugin.id]}
              />
              <label className="custom-toggle-label" htmlFor={plugin.id + '-pluggin'}></label>
            </div>
          </div>
          <Devider />
        </React.Fragment>
      );
    });
  };
  return <>{renderPluginsAndAppsColumn()}</>;
}

function Roles(props) {
  return (
    <>
      <div className=" py-3 px-9 flex items-center bg-gray-cool2 rounded-lg">
        <img src={info} alt="info icon" />
        <div className="text-sm font-normal ml-2">These settings will apply to this demo session only.</div>
      </div>
      <div className="flex justify-between mt-6 mb-4">
        <span className=" text-gray-cool5 text-sm font-normal">Role to assign to every new participant</span>
        <Dropdown
          options={['student', 'teacher']}
          selectedOption={option => {
            props.change('roleOnNew', option);
          }}
        />
      </div>
      <Devider />
      <div className=" text-xl mt-10">Participants in room</div>
      <div className="flex justify-between mt-5 mb-4">
        <span className=" text-gray-cool5 text-sm font-normal">Sanjana Mishra (You)</span>
        <Dropdown
          options={['teacher', 'student']}
          selectedOption={option => {
            props.change('hostRole', option);
          }}
        />
      </div>
      <Devider />
      {Object.keys(props.settings.participantsLive).map((key, index) => {
        return (
          <React.Fragment key={index}>
            <div className="flex justify-between mt-5 mb-4">
              <span className=" text-gray-cool5 text-sm font-normal">{key}</span>
              <Dropdown
                options={['student', 'teacher']}
                selectedOption={option => {
                  props.change('participantsLive', {
                    ...props.settings.participantsLive,
                    [key]: option,
                  });
                }}
              />
            </div>
            <Devider />
          </React.Fragment>
        );
      })}
    </>
  );
}
