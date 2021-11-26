module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-min-length': [2, 'always', 5],
    'type-enum': [
      2,
      'always',
      ['build', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test', 'lint'],
    ],
  },
};
