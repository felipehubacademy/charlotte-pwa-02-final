module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    // NativeWind v4: no babel plugin needed (CSS processing runs in Metro)
    // Reanimated v4: no babel plugin needed (worklets handle it at runtime)
  };
};
