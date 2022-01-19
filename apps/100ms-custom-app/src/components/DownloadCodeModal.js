import React, { Component } from 'react';
import Modal from './Modal';
import Devider from './Devider';

import iconDownload from '../assets/images/icons/icon-download.svg';
import iconGithub from '../assets/images/icons/icon-github.svg';

class DownloadCodeModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openedIndex: 0,
    };
    this.accordions = [
      {
        title: 'Download .env',
        description: 'Download .env file containing your customisations.',
        buttonText: () => (
          <React.Fragment>
            <img src={iconDownload} className="mr-2" alt="download" />
            Download
          </React.Fragment>
        ),
        buttonClick: () => {
          this.props.downloadEnv();
          this.setState({ openedIndex: this.state.openedIndex + 1 });
        },
      },
      {
        title: 'Fork Repo from Github',
        description: 'Fork the source repo and replace example.env with your .env',
        buttonText: () => (
          <React.Fragment>
            <img src={iconGithub} className="mr-2" alt="download" />
            Fork Repository
          </React.Fragment>
        ),
        buttonClick: () => {
          window.open('https://github.com/100mslive/100ms-web');
        },
      },
    ];
  }

  renderAccordion(index, isOpened, { title, description, buttonText, buttonClick }) {
    const { theme } = this.props;
    return (
      <div
        className={`overflow-hidden mt-4 bg-gray-cool2 px-6 py-6 rounded-xl ${
          isOpened ? 'text-white' : 'text-gray-cool3'
        }`}
      >
        <div className="flex items-center font-medium">
          <span
            className={`mr-4  inline-flex items-center justify-center h-8 w-8 rounded-full text-lg ${
              isOpened ? 'text-white bg-gray-cool1 ' : 'text-gray-cool5 bg-gray-cool3'
            }`}
          >
            {index + 1}
          </span>
          <span className=" text-xl">{title}</span>
        </div>
        <div
          className={`overflow-hidden ${isOpened ? 'mt-4' : 'mt-0'}`}
          style={{ maxHeight: isOpened ? '100%' : '0px' }}
        >
          {description && <div className="mb-5 text-gray-cool5">{description}</div>}
          <button
            onClick={() => {
              buttonClick();
            }}
            className={`mt-2 rounded-lg px-6 py-2 hover:bg-opacity-80 text-sm focus:outline-none flex items-center ${
              theme === 'dark'
                ? 'bg-blue-standard text-white'
                : ' bg-white border hover:bg-gray-3 hover:bg-opacity-10 shadow-sm text-black'
            }`}
          >
            {buttonText()}
          </button>
        </div>
      </div>
    );
  }

  render() {
    const { openedIndex } = this.state;
    const { theme } = this.props;
    return (
      <Modal>
        <div
          style={{ width: '630px' }}
          className={`py-6 px-6 rounded-xl ${
            theme === 'dark' ? 'bg-gray-cool1 text-white' : 'bg-white shadow-lg text-black'
          }`}
        >
          <div className="flex justify-between mb-4">
            <div className="text-2xl font-semibold">Download Code</div>
            <button
              onClick={() => this.props.closeModal()}
              type="button"
              className="close"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span
                className={`focus:outline-none  text-2xl text-gray-cool4 ${
                  theme === 'dark' ? 'text-white' : ' text-black'
                }`}
                aria-hidden="true"
              >
                &times;
              </span>
            </button>
          </div>
          <Devider />
          <div className="mt-8">
            {this.accordions.map((accordion, index) => {
              const isOpened = index === openedIndex;
              return (
                <div
                  key={index}
                  className={`${isOpened ? 'cursor-auto' : 'cursor-pointer'}`}
                  onClick={() => {
                    !isOpened && this.setState({ openedIndex: index });
                  }}
                >
                  {this.renderAccordion(index, isOpened, accordion)}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    );
  }
}

export default DownloadCodeModal;
