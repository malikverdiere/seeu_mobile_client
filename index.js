/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { Settings } from 'react-native-fbsdk-next';
import { backgroundMessageFCM } from './Components/Notification';
import 'react-native-get-random-values';

LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
    'Clarity supports android only for now',
    'Please use `getApp()`',
    'This method is deprecated (as well as all React Native Firebase namespaced API)'
])

Settings.setAppID("352956057581787")
Settings.initializeSDK()

backgroundMessageFCM()

AppRegistry.registerComponent(appName, () => App);
