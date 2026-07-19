module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins: [
      // Required for react-native-reanimated 4.x + react-native-worklets.
      // This plugin transforms `'worklet'` directives so worklet functions
      // can run on the UI thread. Must be listed last among plugins.
      'react-native-reanimated/plugin',
    ],
  };
};
