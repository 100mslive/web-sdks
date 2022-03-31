import React from 'react';
import Divider from './Divider';
import Dropdown from './Dropdown';
import info from '../assets/images/icons/info.svg';

export default function Roles(props) {
  return (
    <>
      <div className=" py-3 px-9 flex items-center bg-gray-cool2 rounded-lg">
        <img src={info} alt="info icon" />
        <div className="text-sm font-normal ml-2">These settings will apply to this demo session only.</div>
      </div>
      <div className="flex justify-between mt-6 mb-4">
        <span className=" text-gray-cool5 text-sm font-normal">Role to assign to every new participant</span>
        <Dropdown
          options={['student', 'teacher']}
          selectedOption={option => {
            props.change('roleOnNew', option);
          }}
        />
      </div>
      <Divider />
      <div className=" text-xl mt-10">Participants in room</div>
      <div className="flex justify-between mt-5 mb-4">
        <span className=" text-gray-cool5 text-sm font-normal">Sanjana Mishra (You)</span>
        <Dropdown
          options={['teacher', 'student']}
          selectedOption={option => {
            props.change('hostRole', option);
          }}
        />
      </div>
      <Divider />
      {Object.keys(props.settings.participantsLive).map((key, index) => {
        return (
          <React.Fragment key={index}>
            <div className="flex justify-between mt-5 mb-4">
              <span className=" text-gray-cool5 text-sm font-normal">{key}</span>
              <Dropdown
                options={['student', 'teacher']}
                selectedOption={option => {
                  props.change('participantsLive', {
                    ...props.settings.participantsLive,
                    [key]: option,
                  });
                }}
              />
            </div>
            <Divider />
          </React.Fragment>
        );
      })}
    </>
  );
}
