import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { Ionicons } from '@expo/vector-icons';
// import * as IntentLauncher from 'expo-intent-launcher';
import axios from 'axios';
import { decode } from '@mapbox/polyline';
// import * as ScreenOrientation from 'expo-screen-orientation';

// Constants
const API_CALL_INTERVAL = 10000; // 10 seconds
const LOCATION_UPDATE_INTERVAL = 500; // 0.5 second
const GOOGLE_MAPS_API_KEY = 'AIzaSyAeQzuOcT3aIg5Ql2__hJ2bDli20jCA-Bo'; // Replace with your API key

const TrackingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const mapRef = useRef(null);
  const { width, height } = Dimensions.get('window');

  // State variables
  const [currentPosition, setCurrentPosition] = useState(null);
  const [destination, setDestination] = useState(null);
  const [currentStreet, setCurrentStreet] = useState('Calculating...');
  const [nextTurnDistance, setNextTurnDistance] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('0');
  const [totalDistance, setTotalDistance] = useState('0');
  const [destinationName, setDestinationName] = useState('Calculating...');
  const [tracking, setTracking] = useState(false);
  const [route_coordinates, setRouteCoordinates] = useState([]);
  const [patientName, setPatientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [userImg, setUserImg] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bearing, setBearing] = useState(0);

  // Refs for timers and tracking
  const watchIdRef = useRef(null);
  const locationUpdateTimerRef = useRef(null);
  const apiCallTimerRef = useRef(null);
  const lastPositionRef = useRef(null);
  const lastApiCallTimeRef = useRef(0);

  useEffect(() => {
    // Get params from navigation
    if (route.params) {
      const { lat, lng, name, phone, image, taskId } = route.params;
      if (lat && lng) {
        setDestination({ latitude: parseFloat(lat), longitude: parseFloat(lng) });
      }

      setPatientName(name || '');
      setPhoneNumber(phone ? Number(phone) : null);
      setUserImg(image || null);
      setTaskId(taskId || null);
    }

    // Initialize map and location
    initializeMapFlow();

    // Cleanup on unmount
    return () => {
      stopTracking();
    };
  }, []);

  const initializeMapFlow = async () => {
    try {
      await checkAndRequestPermissions();
      await initCurrentLocation();
      if (destination) {
        await getDestinationAddress();
        await calculateRoute();
      }
      setLoading(false);
    } catch (error) {
      console.error('Error in map initialization flow:', error);
      showError('Map Error', 'Failed to initialize map. Please try again.');
      setLoading(false);
    }
  };

  const initCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showLocationError();
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = position.coords;
      setCurrentPosition({ latitude, longitude });

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }

      await getAddressFromCoordinates(latitude, longitude);
    } catch (error) {
      console.error('Error getting current location:', error);
      showLocationError();
    }
  };

  const calculateRoute = async () => {
    if (!currentPosition || !destination) {
      showError('Route Error', 'Invalid coordinates. Please try again.');
      return;
    }

    try {
      const origin = `<span class="math-inline">\{currentPosition\.latitude\},</span>{currentPosition.longitude}`;
      const dest = `<span class="math-inline">\{destination\.latitude\},</span>{destination.longitude}`;
      const url = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;

      const response = await axios.get(url);
      const data = response.data;

      if (data.routes && data.routes.length > 0) {
        const points = data.routes[0].overview_polyline.points;
        const decodedPoints = decode(points);
        setRouteCoordinates(decodedPoints);

        const route = data.routes[0].legs[0];
        setNextTurnDistance(route.steps[0].distance.text);
        setEstimatedTime(route.duration.text);
        setTotalDistance(route.distance.text);

        if (mapRef.current) {
          mapRef.current.fitToCoordinates([currentPosition, destination], {
            edgePadding: { top: 50, right: 50, bottom: 250, left: 50 },
            animated: true,
          });
        }
      } else {
        showError('Route Error', 'Unable to calculate route. Please try again.');
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      if (axios.isAxiosError(error) && !error.response) {
        showError('Network Error', "Please check your internet connection.");
      } else {
        showError('Route Error', 'Unable to calculate route. Please try again.');
      }
    }
  };

  const getDestinationAddress = async () => {
    if (!destination) return;

    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: destination.latitude,
        longitude: destination.longitude,
      });

      if (result && result[0]) {
        const address = result[0];
        setDestinationName(`${address.name || ''} ${address.street || ''} ${address.city || ''}`);
      }
    } catch (error) {
      console.error('Error getting destination address:', error);
    }
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result && result[0]) {
        const address = result[0];
        setCurrentStreet(address.street || address.name || 'Unknown Street');
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setCurrentStreet('Address lookup failed');
    }
  };

  const startTracking = async () => {
    try {
      const permissionGranted = await checkAndRequestPermissions();
      if (!permissionGranted) return;

      setTracking(true);
      await setupLocationTracking();
      setupTimers();
    } catch (error) {
      console.error('Error starting tracking:', error);
      showError('Tracking Error', 'Failed to start tracking. Please try again.');
    }
  };

  const setupLocationTracking = async () => {
    await clearExistingTracking();

    watchIdRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 5,
      },
      (position) => {
        lastPositionRef.current = position;
        if(position.coords.heading){
          setBearing(position.coords.heading)
        }
      }
    );
  };const setupTimers = () => {
    clearTimers();

    locationUpdateTimerRef.current = setInterval(() => {
      if (lastPositionRef.current) {
        handlePositionUpdate(lastPositionRef.current);
      }
    }, LOCATION_UPDATE_INTERVAL);

    apiCallTimerRef.current = setInterval(() => {
      if (lastPositionRef.current) {
        updateLocationOnServer();
      }
    }, API_CALL_INTERVAL);
  };

  const handlePositionUpdate = async (position) => {
    const { latitude, longitude } = position.coords;
    const newPosition = { latitude, longitude };

    setCurrentPosition(newPosition);
    await getAddressFromCoordinates(latitude, longitude);

    const currentTime = Date.now();
    if (currentTime - lastApiCallTimeRef.current >= API_CALL_INTERVAL) {
      lastApiCallTimeRef.current = currentTime;
    }
  };

  const updateLocationOnServer = async () => {
    if (!lastPositionRef.current || !taskId) return;

    const { latitude, longitude } = lastPositionRef.current.coords;

    const payload = {
      taskId,
      employeeId: 'USER_ID', // Replace with actual user ID
      latitude,
      longitude,
    };

    try {
      // Replace with actual API call
      console.log('Sending location update to server:', payload);
      // await axios.post('/api/updateLocation', payload);
    } catch (error) {
      console.error('Error updating location on server:', error);
    }
  };

  const stopTracking = async () => {
    setTracking(false);
    lastPositionRef.current = null;
    clearTimers();
    await clearExistingTracking();
  };

  const clearTimers = () => {
    if (locationUpdateTimerRef.current) {
      clearInterval(locationUpdateTimerRef.current);
    }
    if (apiCallTimerRef.current) {
      clearInterval(apiCallTimerRef.current);
    }
  };

  const clearExistingTracking = async () => {
    if (watchIdRef.current) {
      watchIdRef.current.remove();
      watchIdRef.current = null;
    }
  };

  const checkAndRequestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        return true;
      }

      showLocationError();
      return false;
    } catch (error) {
      console.error('Error checking/requesting permissions:', error);
      return false;
    }
  };

  const showLocationError = () => {
    Alert.alert(
      'Location Error',
      'Unable to get your location. Please check your GPS settings and try again.',
      [{ text: 'OK' }]
    );
  };

  const showError = (title, message) => {
    Alert.alert(title, message, [{ text: 'OK' }]);
  };

  const goToSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS
      );
    }
  };

  const callNumber = (number) => {
    if (!number) return;

    const url = `tel:${number}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        }
      })
      .catch((error) => console.error('Error calling number:', error));
  };

  const goBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  if (currentPosition) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            ...currentPosition,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          rotateEnabled={true}
        >
          {currentPosition && (
            <Marker coordinate={currentPosition} rotation={bearing}>
              <View style={styles.markerContainer}>
                <View style={styles.marker}>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </View>
              </View>
            </Marker>
          )}

          {destination && (
            <Marker coordinate={destination}>
              <View style={styles.destinationMarkerContainer}>
                <View style={styles.destinationMarker}>
                  {userImg ? (
                    <Image source={{ uri: userImg }} style={styles.userMarkerImage} />
                  ) : (
                    <View style={styles.userMarkerPlaceholder} />
                  )}
                </View>
              </View>
            </Marker>
          )}

          {route_coordinates.length > 0 && (
            <Polyline
              coordinates={route_coordinates}
              strokeWidth={4}
              strokeColor="#4285F4"
            />
          )}
        </MapView>

        <View style={styles.navHeader}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.turnInfo}>
            <Text style={styles.distanceText}>{nextTurnDistance} ft</Text>
            <Text style={styles.streetText}>{currentStreet}</Text>
          </View>
        </View>

        <View style={styles.bottomSheet}>
          <View style={styles.tripInfo}>
            <View style={styles.eta}>
              <Text style={styles.timeText}>{estimatedTime} Min</Text>
              <Text style={styles.distanceValue}>{totalDistance} KM</Text>
            </View>
            <View style={styles.destination}>
              <View style={styles.destinationIcon}>
                <Ionicons name="location" size={20} color="#4285F4" />
              </View>
              <View style={styles.destinationText}>
                <Text style={styles.destinationLabel}>Dropping off</Text>
                <Text style={styles.destinationName}>{destinationName}</Text>
              </View>
            </View>
          </View>

          <View style={styles.userInfo}>
            <View style={styles.userDetails}>
              <View style={styles.userIcon}>
                {userImg ? (
                  <Image source={{ uri: userImg }} style={styles.userImage} />
                ) : (
                  <Image source={require('../../assets/user-icon.png')} style={styles.userImage} />
                )}
              </View>
              <View style={styles.userName}>
                <Text style={styles.nameText}>{patientName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => callNumber(phoneNumber)} style={styles.callButton}>
              <Ionicons name="call" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.controlButton,
              tracking ? styles.stopButton : styles.startButton,
            ]}
            onPress={tracking ? stopTracking : startTracking}
          >
            <Text style={styles.buttonText}>
              {tracking ? 'End Navigation' : 'Start Navigation'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
    loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height:2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  turnInfo: {
    marginLeft: 12,
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
  },
  streetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tripInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 12,
  },
  distanceValue: {
    fontSize: 14,
    color: '#666',
  },
  destination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  destinationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  destinationText: {
    flexDirection: 'column',
  },
  destinationLabel: {
    fontSize: 12,
    color: '#666',
  },
  destinationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    width: 150,
    overflow: 'hidden',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EFEFEF',
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
  },
  userImage: {
    width: '100%',
    height: '100%',
  },
  userName: {},
  nameText: {
    fontSize: 16,
    fontWeight: '600',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#4285F4',
  },
  stopButton: {
    backgroundColor: '#f44242',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  userMarkerImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  userMarkerPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ccc',
  },
});

export default TrackingScreen;