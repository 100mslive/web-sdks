const dependencyMapping = {
  'hms-video-web': [
    'hms-video-web',
    'hms-video-store',
    'hms-noise-suppression',
    'hms-virtual-background',
    'react-sdk',
    'react-ui',
  ],
  'hms-video-store': ['hms-video-store', 'react-sdk', 'react-ui'],
  'react-sdk': ['react-sdk', 'react-ui'],
  'react-icons': ['react-icons', 'react-ui'],
  'react-ui': ['react-ui'],
};

module.exports = { dependencyMapping };
