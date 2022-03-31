import React, { Fragment } from 'react';
import Divider from './Divider';
import chat from '../assets/images/plugins/chat.svg';
import shareScreen from '../assets/images/plugins/share-screen.svg';

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
];

export default function Plugins(props) {
  const handlePlugins = e => {
    props.change('plugins', {
      ...props.settings.plugins,
      [e.target.getAttribute('data-pluggin')]: e.target.checked,
    });
  };

  return (
    <Fragment>
      {pluginsAndApps.map((plugin, index) => {
        return (
          <React.Fragment key={index}>
            <div className="flex justify-end items-start mt-5 mb-5 text-gray-cool5">
              <img className="w-5 mt-0.5" src={plugin.icon} alt={`${plugin.name} pluggin`} />
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
                  id={`${plugin.id}-pluggin`}
                  checked={props.settings.plugins[plugin.id]}
                />
                <label className="custom-toggle-label" htmlFor={`${plugin.id}-pluggin`}></label>
              </div>
            </div>
            <Divider />
          </React.Fragment>
        );
      })}
    </Fragment>
  );
}
