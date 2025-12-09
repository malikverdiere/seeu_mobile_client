const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    assetExts: [...defaultConfig.resolver.assetExts, 'mp3', 'svg'],
  },
  logger: {
    filter: (message) => {
      if (message.includes('Please use `getApp()`') || 
          message.includes('This method is deprecated') ||
          message.includes('React Native Firebase namespaced API')) {
        return false;
      }
      return true;
    }
  }
};

module.exports = mergeConfig(defaultConfig, config);