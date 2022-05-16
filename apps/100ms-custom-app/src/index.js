import React from 'react';
import { createRoot } from 'react-dom/client';
import LogRocket from 'logrocket';
import setupLogRocketReact from 'logrocket-react';
import App from './App';
import reportWebVitals from './reportWebVitals';
import '100ms_edtech_template/dist/index.css';
import './index.css';

if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_LOGROCKET_ID) {
  const shouldInitLogRocket = () => {
    console.log("BlackListed Domains",process.env.REACT_APP_LOGROCKET_BLACKLIST);
    return true;
  };

  if (shouldInitLogRocket()) {
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
