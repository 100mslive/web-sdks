import React from 'react';
import ReactDOM from 'react-dom';
import { init } from 'zipyai';
import App, { HMSPrebuilt } from './App';
import reportWebVitals from './reportWebVitals';

if (process.env.REACT_APP_ZIPY_KEY) {
  init(process.env.REACT_APP_ZIPY_KEY);
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

export { HMSPrebuilt };

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
