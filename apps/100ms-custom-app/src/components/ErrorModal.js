import React from 'react';
import Modal from './Modal';

const defaultClasses = {
  root: 'z-50 relative overflow-y-auto',
  containerRoot: 'flex items-center justify-center absolute pt-4 px-4 pb-20 text-center sm:block sm:p-0',
  spanRoot: 'hidden sm:inline-block sm:align-middle sm:h-screen',
  boxTransition:
    'focus:outline-none insert-y-20 inline-block align-bottom text-left overflow-hidden transform transition-all sm:align-middle sm:max-w-lg sm:w-full',
  boxRoot:
    'flex flex-col bg-gray-100 rounded-lg sm:items-start md:w-100 focus:outline-none rounded-tr-lg text-center font-normal sm:text-left md:text-base text-sm text-gray-500 px-5 py-5',
  header: 'flex flex-grow flex-row items-center mb-4',
  title: 'flex flex-1 text-xl self-center items-center text-white font-medium',
  closeRoot: 'self-start',
  closeButton: 'w-full justify-end text-base font-medium rounded-xl focus:outline-none',
  body: 'w-full text-white text-white',
  footer: 'mt-4 w-full flex justify-end',
};

const styler = className => {
  return defaultClasses[className];
};

const ErrorModal = ({ title, body }) => {
  return (
    <Modal>
      <div className={styler('containerRoot')}>
        <span className={styler('spanRoot')} aria-hidden="true">
          &#8203;
        </span>

        <div className={styler('boxTransition')}>
          <div className={styler('boxRoot')}>
            <div className={styler('header')}>
              <div className={styler('title')}>{title}</div>
              <div className={styler('closeRoot')}></div>
            </div>
            <div className={styler('body')}>{body}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ErrorModal;
