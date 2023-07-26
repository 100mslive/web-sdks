module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  // stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/addon-a11y', 'storybook-dark-mode'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      builder: {}
    },
  },
  webpackFinal: async config => {
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
      use: [{
        loader: 'esbuild-loader',
        options: {
          loader: 'jsx',
          target: 'es6'
        }
      }]
    });
    return config;
  },
  docs: {
    autodocs: true
  }
};
