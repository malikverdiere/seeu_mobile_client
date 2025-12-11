const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {getDefaultConfig: getDefaultExpoConfig} = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const expoConfig = getDefaultExpoConfig(__dirname);

module.exports = mergeConfig(defaultConfig, expoConfig);

