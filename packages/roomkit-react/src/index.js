import { init } from 'zipyai';
import { HMSPrebuilt } from './App';
import reportWebVitals from './reportWebVitals';
import './base.css';
import './index.css';

if (process.env.REACT_APP_ZIPY_KEY) {
  init(process.env.REACT_APP_ZIPY_KEY);
}

export { HMSPrebuilt };

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
