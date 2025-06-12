/**
 * @format
 */

import {Alert, AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';


messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage);
  Alert.alert('Background Notification', JSON.stringify(remoteMessage.notification?.body || ""));
});
AppRegistry.registerComponent(appName, () => App);
