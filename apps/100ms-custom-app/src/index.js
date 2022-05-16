import React from 'react';
import { createRoot } from 'react-dom/client';
import LogRocket from 'logrocket';
import setupLogRocketReact from 'logrocket-react';
import App from './App';
import reportWebVitals from './reportWebVitals';
import '100ms_edtech_template/dist/index.css';
import './index.css';

if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_LOGROCKET_ID) {
  const shouldBlacklistDomainForLogRocket = () => {
    console.log('BlackListed Domains', process.env.REACT_APP_LOGROCKET_BLACKLIST);
    console.log('ENV', process.env);
    if (process.env.REACT_APP_LOGROCKET_BLACKLIST) {
      const domains = process.env.REACT_APP_LOGROCKET_BLACKLIST.split(',');
      if (domains.length !== 0) {
        const myDomain = window.location.hostname;
        console.log(`checking if ${myDomain} is in blacklisted domain list: ${domains}`);
        if (domains.includes(myDomain)) {
          console.log('Returning true');
          return true;
        }
      }
    }

    console.log('Returning false');
    return false;
  };

  if (shouldBlacklistDomainForLogRocket()) {
    console.log(`the domain ${window.location.hostname} has been blacklisted from registering to logrocket.`);
  } else {
    console.log('Domain not blacklisted, initializing logrocket');
    LogRocket.init(process.env.REACT_APP_LOGROCKET_ID);
    setupLogRocketReact(LogRocket);
  }
}

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
