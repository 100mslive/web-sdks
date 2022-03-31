import Divider from './Divider';
import caret from '../assets/images/icons/up-caret.svg';

export default function RoomSettings(props) {
  return (
    <>
      <div className="flex justify-between items-center mt-4 mb-4">
        <span className=" text-gray-cool5 text-sm font-normal">Logo</span>
        <div className="flex items-center">
          <span className="text-gray-cool5 text-sm font-normal mr-1 w-16 overflow-hidden overflow-ellipsis whitespace-nowrap">
            {props.settings.logo_name}
          </span>
          <button
            onClick={() => {
              document.getElementById('user-custom-logo').click();
            }}
            className=" rounded-lg px-3 py-2 bg-gray-cool2 text-white hover:bg-opacity-70 text-sm focus:outline-none sm:flex sm:items-center"
          >
            <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10.4167 17.917V10.417"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.08333 13.7503L10.4167 10.417L13.75 13.7503"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.75 17.7311C15.0954 17.4245 16.3302 16.7527 17.3184 15.7896C18.3067 14.8266 19.0101 13.6095 19.3512 12.2724C19.6923 10.9353 19.6579 9.53005 19.2518 8.21125C18.8457 6.89245 18.0836 5.71126 17.0495 4.79766C16.0153 3.88406 14.7491 3.27348 13.3903 3.03312C12.0315 2.79275 10.6327 2.93193 9.3479 3.43532C8.06309 3.93871 6.94206 4.78681 6.10819 5.88627C5.27432 6.98573 4.75995 8.29393 4.62167 9.6669C3.61213 9.87172 2.71426 10.4432 2.10134 11.2712C1.48841 12.0991 1.2039 13.1247 1.30271 14.15C1.40151 15.1754 1.87664 16.1278 2.63637 16.8234C3.39611 17.5191 4.3866 17.9086 5.41667 17.9169H7.08333"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="ml-2">Upload</span>
          </button>
        </div>
      </div>
      <Divider />
      <div className="flex justify-between items-center mb-4 mt-4">
        <span className=" text-gray-cool5 text-sm font-normal">Appearance</span>
        <div className=" flex bg-gray-cool2 text-gray-cool5 rounded-lg max-w-xsm">
          <button
            onClick={() => {
              props.change('theme', 'dark');
            }}
            className={` py-1 px-10 m-1 rounded text-sm font-normal focus:outline-none ${
              props.settings.theme === 'dark' ? 'bg-gray-cool3 text-white' : ''
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => {
              props.change('theme', 'light');
            }}
            className={` py-1 px-10 m-1 rounded text-sm font-normal focus:outline-none ${
              props.settings.theme === 'light' ? 'bg-gray-cool3 text-white' : ''
            }`}
          >
            Light
          </button>
        </div>
      </div>
      <Divider />
      <div className="flex justify-between items-center mt-4 mb-4">
        <span className=" text-gray-cool5 text-sm font-normal">Brand color</span>
        <div className=" flex bg-gray-cool2 text-gray-cool5 rounded-lg max-w-xsm overflow-hidden">
          <button
            onFocus={() => {
              document.getElementById('customise-color-picker').click();
            }}
            onClick={() => {
              document.getElementById('customise-color-picker').click();
            }}
            className="flex justify-between items-center focus:outline-none"
          >
            <div className="py-1.5 pr-2 pl-3 bg-gray-cool7">
              <input
                id="customise-color-picker"
                className="form-control"
                type="color"
                onChange={e => {
                  props.change('brand_color', e.target.value);
                }}
                value={props.settings.brand_color}
              />
            </div>
            <span className="customise-dropdown-btn-header text-sm font-light pl-2 pr-4 text-white">
              {props.settings.brand_color}
            </span>
          </button>
        </div>
      </div>
      <Divider />
      <div className="flex justify-between items-center mt-4 mb-4">
        <span className=" text-gray-cool5 text-sm font-normal">Tile shape</span>
        <div className=" flex items-center text-gray-cool5 duration-500 rounded-lg max-w-xsm">
          <button
            onClick={() => {
              props.change('tile_shape', '1-1');
            }}
            className={` my-1 mx-2 p-0.5 rounded-lg text-sm font-normal focus:outline-none border ${
              props.settings.tile_shape === '1-1' ? 'border-blue-standard' : ' border-gray-cool6'
            }`}
          >
            <div className="flex items-center justify-center w-20 h-20 bg-gray-cool2 rounded-md">Square</div>
          </button>
          <button
            onClick={() => {
              props.change('tile_shape', '4-3');
            }}
            className={` my-1 mx-2 p-0.5 rounded-lg text-sm font-normal focus:outline-none border ${
              props.settings.tile_shape === '4-3' ? 'border-blue-standard' : ' border-gray-cool6'
            }`}
          >
            <div className="flex items-center justify-center w-28 h-20 bg-gray-cool2 rounded-md">Landscape</div>
          </button>
          <button
            onClick={() => {
              props.change('tile_shape', '16-9');
            }}
            className={` my-1 mx-2 p-0.5 rounded-lg text-sm font-normal focus:outline-none border ${
              props.settings.tile_shape === '16-9' ? 'border-blue-standard' : ' border-gray-cool6'
            }`}
          >
            <div className="flex items-center justify-center w-36 h-20 bg-gray-cool2 rounded-md">Wide</div>
          </button>
        </div>
      </div>
      <Divider />
      <div className="flex justify-between items-center mt-4 mb-4">
        <span className=" text-gray-cool5 text-sm font-normal">Font</span>
        <div className="relative">
          <select
            defaultValue={props.settings.font}
            onChange={e => {
              props.change('font', e.target.value);
            }}
            className=" appearance-none bg-gray-cool2 pr-10 focus:bg-gray-cool3 py-2 pl-3 text-sm font-medium rounded-lg cursor-pointer"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Lato">Lato</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Open Sans">Open Sans</option>
            <option value="IBM Plex Sans">IBM Plex Sans</option>
          </select>
          <img
            className={`absolute top-1/2 transform -translate-y-1/2 right-2`}
            style={{ transform: [{ rotate: '90deg' }] }}
            src={caret}
            alt="caret icon"
          />
        </div>
      </div>
      {/* <Divider /> */}
      {/* <div className="flex justify-between items-center mt-4 mb-4">
          <span className=" text-gray-cool5 text-sm font-normal">Video-off avatars</span>
          <Dropdown
            values={[
              // <div className="flex items-center justify-between" >
              //   <span className="text-sm font-normal">Pebble People</span>
              //   <img src={pebbleIcons} alt="pebble people icons" />
              // </div>,
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal">Initials</span>
                <img src={initialIcons} alt="Initial avatar icons" />
              </div>,
            ]}
            options={[
              // "Pebble People",
              'Initials',
            ]}
            defaultValue={'Initials'}
            selectedOption={option => {
              let avatarName;
              switch (option) {
                case 'Pebble People':
                  avatarName = 'pebble';
                  break;
                default:
                  avatarName = 'initial';
              }
              props.change('avatars', avatarName);
            }}
          />
        </div> */}
      <Divider />
      {props.settings.metadataFields.clicks > 4 && (
        <>
          <div className="flex justify-between items-center mt-4 mb-4">
            <span className=" text-gray-cool5 text-sm font-normal">Metadata</span>
            <div className=" flex bg-gray-cool2 text-black rounded-lg max-w-xsm overflow-hidden">
              <textarea
                id="metadata"
                className="form-control"
                onChange={e => {
                  props.change('metadataFields', {
                    ...props.settings.metadataFields,
                    metadata: e.target.value,
                  });
                }}
                value={props.settings.metadataFields.metadata}
              />
            </div>
          </div>
          <Divider />
        </>
      )}
      <input
        onChange={props.handleLogoChange}
        type="file"
        accept="image/*"
        className="absolute bottom-0 right-0 hidden"
        name="logo"
        id="user-custom-logo"
      />
    </>
  );
}
