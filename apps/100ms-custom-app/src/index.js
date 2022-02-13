import React from 'react';
import ReactDOM from 'react-dom';
import LogRocket from 'logrocket';
import setupLogRocketReact from 'logrocket-react';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './index.css';
import '100ms_edtech_template/dist/index.css';

if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_LOGROCKET_ID) {
  /**
   * TODO: starting logrocket in a timeout because it's not picking up the stitches styles otherwise for
   * some reason, and the recording appears broken. The timeout appears to be somehow solving the issue,
   * more details will be need to looked into to figure out the exact cause. It's likely that the stitches library
   * is doing something at runtime after loading which needs to be waited on before styles are ready.
   * It's probably related to the numbers here - https://stitches.dev/docs/benchmarks
   */
  setTimeout(() => {
    LogRocket.init(process.env.REACT_APP_LOGROCKET_ID);
    setupLogRocketReact(LogRocket);
  }, 3000);
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
