
module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  core: {
    builder: 'webpack5',
  },
  addons: [
    '@storybook/addon-links',
    {
      name: '@storybook/addon-essentials',
      options: {
        actions: true,
        controls: false,
        measure: false,
        outline: false,
        backgrounds: false
      }
    },
    '@storybook/addon-controls',
    '@storybook/addon-interactions',
    'storybook-dark-mode'
  ],
  framework: '@storybook/react',
};
