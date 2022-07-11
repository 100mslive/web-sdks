/* eslint-disable */
// Storage polyfill by Remy Sharp
// https://gist.github.com/350433
// Needed for IE7-

import HMSLogger from './logger';

// Dependencies:
//  JSON (use json2.js if necessary)

// Tweaks by Joshua Bell (inexorabletash@gmail.com)
//  * URI-encode item keys
//  * Use String() for stringifying
//  * added length

if (!window.localStorage || !window.sessionStorage)
  (function () {
    var Storage = function (type: string) {
      HMSLogger.w(`Polyfillling ${type} storage using cookies`);

      function createCookie(name: string, value: string, days: number) {
        var date, expires;

        if (days) {
          date = new Date();
          date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
          expires = '; expires=' + date.toUTCString();
        } else {
          expires = '';
        }
        document.cookie = name + '=' + value + expires + '; path=/';
      }

      function readCookie(name: string) {
        var nameEQ = name + '=',
          ca = document.cookie.split(';'),
          i,
          c;

        for (i = 0; i < ca.length; i++) {
          c = ca[i];
          while (c.charAt(0) == ' ') {
            c = c.substring(1, c.length);
          }

          if (c.indexOf(nameEQ) == 0) {
            return c.substring(nameEQ.length, c.length);
          }
        }
        return null;
      }

      function setData(data: any) {
        data = JSON.stringify(data);
        if (type == 'session') {
          window.name = data;
        } else {
          createCookie('localStorage', data, 365);
        }
      }

      function clearData() {
        if (type == 'session') {
          window.name = '';
        } else {
          createCookie('localStorage', '', 365);
        }
      }

      function getData() {
        var data = type == 'session' ? window.name : readCookie('localStorage');
        return data ? JSON.parse(data) : {};
      }

      // initialise if there's already data
      var data = getData();

      function numKeys() {
        var n = 0;
        for (var k in data) {
          if (data.hasOwnProperty(k)) {
            n += 1;
          }
        }
        return n;
      }

      return {
        clear: function () {
          data = {};
          clearData();
          this.length = numKeys();
        },
        getItem: function (key: string) {
          key = encodeURIComponent(key);
          return data[key] === undefined ? null : data[key];
        },
        key: function (i: number) {
          // not perfect, but works
          var ctr = 0;
          for (var k in data) {
            if (ctr == i) return decodeURIComponent(k);
            else ctr++;
          }
          return null;
        },
        removeItem: function (key: string) {
          key = encodeURIComponent(key);
          delete data[key];
          setData(data);
          this.length = numKeys();
        },
        setItem: function (key: string, value: string) {
          key = encodeURIComponent(key);
          data[key] = String(value);
          setData(data);
          this.length = numKeys();
        },
        length: 0,
      };
    };

    // @ts-ignore
    if (!window.localStorage) window.localStorage = new Storage('local');
    // @ts-ignore
    if (!window.sessionStorage) window.sessionStorage = new Storage('session');
  })();

export {};
