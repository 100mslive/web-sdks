const dependencyMapping = {
  'hms-video-web': [
    'hms-video-web',
    'hms-video-store',
    'hms-noise-suppression',
    'hms-virtual-background',
    'react-sdk',
    'react-ui',
    'roomkit-react',
  ],
  'hms-video-store': ['hms-video-store', 'react-sdk', 'react-ui', 'roomkit-react'],
  'react-sdk': ['react-sdk', 'react-ui', 'roomkit-react'],
  'react-icons': ['react-icons', 'react-ui', 'roomkit-react'],
  'react-ui': ['react-ui'],
  'roomkit-react': ['roomkit-react'],
};

module.exports = { dependencyMapping };
