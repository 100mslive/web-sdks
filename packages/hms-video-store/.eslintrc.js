// These rules are merged into the out of box rules coming from tsdx - https://github.com/formium/tsdx/blob/master/src/createEslintConfig.ts
module.exports = {
  rules: {
    complexity: ['error', 6], // if a function is getting too complex it should be broken down
    curly: ['error', 'all'], // use curly brace even for single line functions
    'comma-dangle': ['error', 'always-multiline'], // easier to see git diff
    'prefer-template': ['error'], // easier to read code when variables are used
  },
  parserOptions: {
    ecmaVersion: 2017,
  },

  env: {
    es6: true,
  },
};
