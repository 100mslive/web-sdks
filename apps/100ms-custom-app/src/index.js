import React from 'react';
import { createRoot } from 'react-dom/client';
import { init } from "zipyai";
import App from './App';
import reportWebVitals from './reportWebVitals';
import '100ms_edtech_template/dist/index.css';
import './index.css';

if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_ZIPY_KEY) {
  const shouldBlacklistDomainForLogRocket = () => {
    if (process.env.REACT_APP_LOGROCKET_BLACKLIST) {
      const domains = process.env.REACT_APP_LOGROCKET_BLACKLIST.split(',');
      return domains.includes(window.location.hostname);
    }
  };

  if (shouldBlacklistDomainForLogRocket()) {
    console.debug(`Not initializing zipy for ${window.location.hostname}`);
  } else {
      init(process.env.REACT_APP_ZIPY_KEY);
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
