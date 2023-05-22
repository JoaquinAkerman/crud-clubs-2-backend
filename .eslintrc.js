module.exports = {
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  extends: ['airbnb-base'],
  plugins: [],
  rules: {
    'no-console': 'off',
    'no-unused-vars': 'warn',
    'linebreak-style': ['error', 'windows'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    radix: 'off',
  },
};
