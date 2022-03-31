import React from 'react';
import Divider from './Divider';
import Dropdown from './Dropdown';
import GridLayout from '../assets/images/icons/grid-view.svg';
import SpeakerLayout from '../assets/images/icons/speaker-view.svg';

export default class Layout extends React.Component {
  constructor() {
    super();
    this.state = {};
  }
  render() {
    return (
      <>
        <div className=" text-xl">What a teacher sees</div>
        <div className="flex justify-between items-center mt-5 mb-4">
          <span className=" text-gray-cool5 text-sm font-normal">Layout</span>
          <Dropdown
            values={[
              <div className="flex">
                <img className="w-12 mr-4" src={GridLayout} alt="grid layout icon" />
                <div className="flex flex-col">
                  <div className="text-sm">Grid View</div>
                  <div className="text-xs">
                    Participants will be in a grid. You can choose to allow one role’s participants to be in a sidebar.
                  </div>
                </div>
              </div>,
              <div className="flex">
                <img className="w-12 mr-4" src={SpeakerLayout} alt="grid layout icon" />
                <div className="flex flex-col">
                  <div className="text-sm">Speaker View</div>
                  <div className="text-xs">
                    Active speaker will be shown prominently. You can choose to allow select roles to be on stage.{' '}
                  </div>
                </div>
              </div>,
            ]}
            options={['Grid View', 'Speaker View']}
            selectedOption={option => {
              this.setState({ teacher_layout: option });
            }}
          />
        </div>
        <Divider />
        <div className="flex justify-between items-center mt-4 mb-4">
          <span className=" text-gray-cool5 text-sm font-normal">Sidebar should show...</span>
          <Dropdown
            options={['No sidebar', 'teachers', 'students']}
            selectedOption={option => {
              this.setState({ sidebarContent: option });
            }}
          />
        </div>
        <Divider />
        <div className=" text-xl mt-10">What a student sees</div>
        <div className="flex justify-between items-center mt-5 mb-4">
          <span className=" text-gray-cool5 text-sm font-normal">Layout</span>
          <Dropdown
            values={[
              <div className="flex">
                <img className="w-12 mr-4" src={GridLayout} alt="grid layout icon" />
                <div className="flex flex-col">
                  <div className="text-sm">Grid View</div>
                  <div className="text-xs">
                    Participants will be in a grid. You can choose to allow one role’s participants to be in a sidebar.
                  </div>
                </div>
              </div>,
              <div className="flex">
                <img className="w-12 mr-4" src={SpeakerLayout} alt="grid layout icon" />
                <div className="flex flex-col">
                  <div className="text-sm">Speaker View</div>
                  <div className="text-xs">
                    Active speaker will be shown prominently. You can choose to allow select roles to be on stage.{' '}
                  </div>
                </div>
              </div>,
            ]}
            options={['Grid View', 'Speaker View']}
            selectedOption={option => {
              this.setState({ student_layout: option });
            }}
          />
        </div>
        <Divider />
        <div className="flex justify-between items-center mt-4 mb-4">
          <span className=" text-gray-cool5 text-sm font-normal">Allowed on stage</span>
          <Dropdown
            options={['No sidebar', 'teachers', 'students']}
            selectedOption={option => {
              this.setState({ allowedOnStage: option });
            }}
          />
        </div>
        <Divider />
        <div className=" text-gray-cool5 text-sm font-normal mt-10">
          You can add more roles from{' '}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://dashboard.100ms.live/roles"
            className="text-blue-500 hover:text-blue-600"
          >
            Dashboard / Roles
          </a>
        </div>
      </>
    );
  }
}
