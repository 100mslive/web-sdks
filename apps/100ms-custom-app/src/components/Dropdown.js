import React, { useState, useEffect, Component } from 'react';
import ReactDOM from 'react-dom';
import caret from '../assets/images/icons/up-caret.svg';
import check from '../assets/images/icons/tick.svg';

export default function Dropdown({ options, defaultValue, values, selectedOption }) {
  const [currentValue, setCurrentValue] = useState(0);
  const [showDropDown, setShowDropDown] = useState(false);
  const [dropdown_id, setId] = useState('');

  useEffect(() => {
    selectedOption(options[currentValue]);
    // eslint-disable-next-line
  }, [currentValue]);

  useEffect(() => {
    setId(randomId());
    if (defaultValue) {
      let toBeIndex = options.indexOf(defaultValue);
      setCurrentValue(toBeIndex === -1 ? 0 : toBeIndex);
    }
    // eslint-disable-next-line
  }, []);

  function randomId() {
    return Math.random().toString(36).replace('0.', 'dropdown_');
  }

  return (
    <>
      <button
        id={dropdown_id}
        className="relative cursor-pointer focus:outline-none"
        onBlur={() => {
          setShowDropDown(false);
        }}
        onFocus={() => {
          setShowDropDown(true);
        }}
      >
        <div className=" bg-gray-cool2 focus:bg-gray-cool3 py-2 px-3 text-sm font-medium rounded-lg cursor-pointer outline-none focus:outline-none appearance-none">
          <span className="mr-4">{options[currentValue]}</span>
        </div>
        <img
          className={`absolute top-1/2 transform -translate-y-1/2 right-2 ${showDropDown ? '' : 'rotate-180'}`}
          src={caret}
          alt="caret icon"
        />
      </button>
      {showDropDown && (
        <DropDownItems parentId={dropdown_id}>
          <button className={`flex cursor-pointer text-white mt-2 text-sm flex-col z-50 bg-gray-cool2 rounded-lg py-1`}>
            {values
              ? values.map((option, index) => {
                  return (
                    <div
                      onClick={() => {
                        setCurrentValue(index);
                      }}
                      key={index}
                      className="relative min-w-[400px] max-w-sm pr-5 hover:bg-gray-cool3"
                    >
                      <div className={`${currentValue === index ? '' : 'hover:opacity-80'} mt-0.5 p-3`}>{option}</div>
                      <div className={`${currentValue === index ? 'visible' : 'invisible'} bg-gray-cool1 h-full`}>
                        <img
                          className="w-5 h-5 absolute top-1/2 transform -translate-y-1/2 right-2"
                          src={check}
                          alt="check icon"
                        />
                      </div>
                    </div>
                  );
                })
              : options.map((option, index) => {
                  return (
                    <div
                      onClick={() => {
                        setCurrentValue(index);
                      }}
                      key={index}
                      className="relative min-w-[200px] max-w-sm pr-5 hover:bg-gray-cool3"
                    >
                      <div
                        className={`${currentValue === index ? '' : 'hover:opacity-80'} hover:bg-gray-cool3 mt-0.5 p-3`}
                      >
                        {option}
                      </div>
                      <div className={`${currentValue === index ? 'visible' : 'invisible'} bg-gray-cool1 h-full`}>
                        <img
                          className="w-5 h-5 absolute top-1/2 transform -translate-y-1/2 right-2"
                          src={check}
                          alt="check icon"
                        />
                      </div>
                    </div>
                  );
                })}
          </button>
        </DropDownItems>
      )}
    </>
  );
}

class DropDownItems extends Component {
  constructor(props) {
    super(props);
    this.el = document.getElementById('dropdown-root');
    this.parent = document.getElementById(this.props.parentId);
  }

  componentDidMount() {
    const rect = this.parent.getBoundingClientRect();

    let topPos = rect.top + window.scrollY + 35;
    let rightPos = window.innerWidth - (rect.right + window.scrollX);

    const bounding = this.el.getBoundingClientRect();
    const isOut = this.isOutOfViewport(bounding);

    if (isOut.left) {
      rightPos -= this.el.offsetWidth;
    }

    if (isOut.bottom) {
      topPos -= this.el.offsetHeight;
    }

    this.el.style.top = `${topPos}px`;
    this.el.style.right = `${rightPos}px`;
  }

  isOutOfViewport = bounding => {
    var out = {};
    out.top = bounding.top < 0;
    out.left = bounding.left < 0;
    out.bottom = bounding.bottom > (window.innerHeight || document.documentElement.clientHeight);
    out.right = bounding.right > (window.innerWidth || document.documentElement.clientWidth);

    return out;
  };

  render() {
    // this.el.innerHTML = ''; // removing older dropdowns
    return ReactDOM.createPortal(this.props.children, this.el);
  }
}
