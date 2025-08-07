// utils/location.js
import { PermissionsAndroid, Platform, Linking, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      return false;
    }
  }
  return true;
};

export const checkGPSAndGetLocation = async (onSuccess, onFail) => {
  const permissionGranted = await requestLocationPermission();
  if (!permissionGranted) {
    onFail('Permission denied');
    return;
  }

  Geolocation.getCurrentPosition(
    (position) => {
      onSuccess(position.coords.latitude, position.coords.longitude);
    },
    (error) => {
      if (error.code === 2) {
        // GPS not enabled
        onFail('gps_off');
      } else {
        onFail(error.message);
      }
    },
    {
    enableHighAccuracy: false,  // <--- try false first
    timeout: 15000,  
      maximumAge: 10000,
      forceRequestLocation: true,
      showLocationDialog: true,
    }
  );
};
