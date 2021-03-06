module.exports = {
  root: true,
  extends: '@react-native-community',
  plugins: ['import'],
  settings: {
    'import/resolver': {
      node: {
        paths: ['src'],
        alias: {
          '~': './src',
        },
      },
    },
  },
  rules: {
    'no-catch-shadow': false,
  },
};
