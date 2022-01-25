import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Divider from './Divider';
import DownloadCodeModal from './DownloadCodeModal';
import { AppAnalytics } from '../helpers/analytics_helpers';

// images
import logo from '../assets/images/100ms_logo.svg';
import darkLogo from '../assets/images/100ms_dark.svg';

// icons
import copy from '../assets/images/icons/copy.svg';
import copyWhite from '../assets/images/icons/copy-white.svg';
import iconEdit from '../assets/images/icons/icon-edit.svg';
import iconCode from '../assets/images/icons/icon-code.svg';

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
    email = email.toLowerCase();
    for (let i = 0; i < email.length; i++) {
      if (email[i] === '@') {
        break;
      }
      if (email[i] >= 'a' && email[i] <= 'z') {
        initials += email[i];
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
    }\nREACT_APP_LOGO=${logo || ''}\nREACT_APP_FONT=${settings.font}\nREACT_APP_SHOW_CHAT=${
      settings.plugins.chat
    }\nREACT_APP_SHOW_SCREENSHARE=${
      settings.plugins['screen-share']
    }\nREACT_APP_VIDEO_AVATAR=true\nREACT_APP_TOKEN_GENERATION_ENDPOINT=${`${
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

  const copyToClipboard = containerid => {
    const cont = document.getElementById(containerid);
    let str = cont.innerHTML;
    cont.style.color = '#2A70DE';
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setTimeout(() => {
      cont.style.color = '#B0C3DB';
    }, 2000);
  };

  return (
    <>
      <div
        className={`${
          theme === 'dark' ? 'text-white bg-black' : 'text-black bg-white'
        } w-100 p-3 bg-transparent flex justify-between items-center border-b border-gray-cool4`}
      >
        <img
          onClick={() => {
            window.open(process.env.REACT_APP_DASHBOARD_LINK);
          }}
          className="h-6 hover:cursor-pointer"
          src={theme === 'dark' ? logo : darkLogo}
          alt="100ms logo"
        />
        <div className="flex items-center">
          {onlyEmail && (
            <>
              {roomLinks && Object.keys(roomLinks).length > 0 && (
                <button
                  onClick={() => {
                    togModal(!modal);
                    AppAnalytics.track('invite.clicked');
                  }}
                  className={`rounded-lg px-3 py-1.5 hover:bg-opacity-80 text-sm focus:outline-none mr-4 sm:flex sm:items-center ${
                    theme === 'dark'
                      ? 'bg-blue-standard text-white'
                      : ' bg-white border hover:bg-gray-3 hover:bg-opacity-10 shadow-sm text-black'
                  }`}
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
                </button>
              )}
              <a
                target="_blank"
                href="https://100ms.live/contact"
                rel="noreferrer"
                className=" rounded-lg relative px-3 py-2 bg-gray-cool2 text-white hover:bg-opacity-80 mr-4 text-sm focus:outline-none flex items-center"
              >
                Schedule a demo
              </a>
              <button
                onClick={() => {
                  setCodeModal(true);
                }}
                className=" rounded-lg relative px-3 py-1.5 bg-gray-cool2 text-white hover:bg-opacity-80 mr-4 text-sm focus:outline-none flex items-center"
              >
                <img alt="code" src={iconCode} />
                {savingData && <div className="w-full h-full z-50 absolute top-0 left-0 bg-black opacity-40"></div>}
              </button>
              <button
                onClick={toggleModal}
                className="rounded-lg px-3 py-1.5 bg-gray-cool2 text-white hover:bg-opacity-80 text-sm focus:outline-none"
              >
                <img alt="edit" src={iconEdit} />
              </button>
            </>
          )}
          <div
            className="ml-4 flex items-center justify-center rounded-full h-8 w-8"
            style={{ backgroundColor: `${randomColor}` }}
          >
            {getEmailInitials()}
          </div>
        </div>
      </div>
      {codeModal && (
        <DownloadCodeModal downloadEnv={downloadCode} theme={theme} closeModal={() => setCodeModal(false)} />
      )}
      {modal && (
        <Modal>
          <div
            className={`max-w-screen-md min-h-[530px] flex flex-col w-3/4 py-4 px-5 rounded-xl ${
              theme === 'dark' ? 'bg-gray-cool1 text-white' : 'bg-white shadow-lg text-black'
            }`}
          >
            <div className="flex justify-between mb-4">
              <h5 className="h5 text-xl font-semibold">Roles Urls</h5>
              <button
                onClick={() => togModal(false)}
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span
                  className={`focus:outline-none font-semibold text-xl ${
                    theme === 'dark' ? 'text-white' : ' text-black'
                  }`}
                  aria-hidden="true"
                >
                  &times;
                </span>
              </button>
            </div>
            <Divider />
            <div className="mt-4 px-2">
              <ul>
                {Object.keys(roomLinks).map((role, index) => {
                  const roomRole = roomLinks[role];
                  if (roomRole.is_active) {
                    let role_url = `https://${window.location.hostname}/preview/${roomRole.identifier}`;
                    return (
                      <React.Fragment key={index}>
                        <li className="my-4 flex items-center">
                          <div className="font-medium mr-2 capitalize min-w-[160px] overflow-hidden overflow-ellipsis whitespace-nowrap max-w-[200px]">
                            {role}
                          </div>
                          <div
                            className={`overflow-hidden flex flex-grow justify-between text-sm font-medium py-1.5 px-2 border rounded-md border-gray-cool3 ${
                              theme === 'dark' ? 'bg-gray-cool1 text-gray-cool5' : ' bg-white'
                            }`}
                          >
                            <div
                              id={`role-url-${index}`}
                              className="overflow-hidden overflow-ellipsis whitespace-nowrap"
                              key={index}
                            >{`${role_url}`}</div>
                            <button
                              className="focus:outline-none flex-shrink-0 ml-2"
                              onClick={() => {
                                copyToClipboard(`role-url-${index}`);
                              }}
                            >
                              <img
                                src={theme === 'dark' ? copyWhite : copy}
                                className="w-4 cursor-pointer"
                                alt="copy icon"
                              />
                            </button>
                          </div>
                        </li>
                        <Divider />
                      </React.Fragment>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
