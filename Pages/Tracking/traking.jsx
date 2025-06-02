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
const API_CALL_INTERVAL = 5000; // 5 seconds for more frequent updates
const LOCATION_UPDATE_INTERVAL = 500; // 0.5 second
const GOOGLE_MAPS_API_KEY = 'AIzaSyAeQzuOcT3aIg5Ql2__hJ2bDli20jCA-Bo'; // Replace with your actual API key
const ROUTE_REFRESH_INTERVAL = 500; // Refresh route every minute

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
  const [nextTurnInstruction, setNextTurnInstruction] = useState('');
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
  const [routeRefreshRequired, setRouteRefreshRequired] = useState(false);
  const [remainingDistance, setRemainingDistance] = useState(null);

  // Refs for timers and tracking
  const watchIdRef = useRef(null);
  const locationUpdateTimerRef = useRef(null);
  const apiCallTimerRef = useRef(null);
  const routeRefreshTimerRef = useRef(null);
  const lastPositionRef = useRef(null);
  const lastApiCallTimeRef = useRef(0);
  const lastRouteRefreshTimeRef = useRef(0);
  const stepsRef = useRef([]);

  useEffect(() => {
    // Lock screen orientation to portrait
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    
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
      ScreenOrientation.unlockAsync();
    };
  }, []);

  // Effect to handle route refresh when needed
  useEffect(() => {
    if (routeRefreshRequired && tracking && currentPosition && destination) {
      calculateRoute();
      setRouteRefreshRequired(false);
    }
  }, [routeRefreshRequired, tracking, currentPosition, destination]);

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
      const origin = `${currentPosition.latitude},${currentPosition.longitude}`;
      const dest = `${destination.latitude},${destination.longitude}`;
      
      // Use Google Maps Directions API with proper parameters
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${GOOGLE_MAPS_API_KEY}`;
  
      
      const response = await axios.get(url);
      const data = response.data;
  
      if (data.status !== 'OK') {
        throw new Error(`Directions API error: ${data.status}`);
      }
  
      if (data.routes && data.routes.length > 0) {
        const points = data.routes[0].overview_polyline.points;
        const decodedPoints = decode(points);
        
        // Proper format for react-native-maps polyline
        const routeCoords = decodedPoints.map(point => ({
          latitude: point[0],
          longitude: point[1]
        }));
        
        console.log('Route coordinates length:', routeCoords.length);
        
        // Make sure we have coordinates to show
        if (routeCoords.length > 0) {
          setRouteCoordinates(routeCoords);
          
          // Get route information
          const route = data.routes[0].legs[0];
          
          // Save steps for navigation guidance
          stepsRef.current = route.steps;
          
          // Set initial next turn information
          if (route.steps && route.steps.length > 0) {
            setNextTurnDistance(route.steps[0].distance.text);
            setNextTurnInstruction(route.steps[0].html_instructions.replace(/<[^>]*>/g, ' '));
          }
          
          setEstimatedTime(route.duration.text);
          setTotalDistance(route.distance.text);
          setRemainingDistance(route.distance.text);
  
          // Fit map to show the entire route
          if (mapRef.current) {
            const coordinatesToFit = [
              { latitude: currentPosition.latitude, longitude: currentPosition.longitude },
              { latitude: destination.latitude, longitude: destination.longitude }
            ];
            
            mapRef.current.fitToCoordinates(
              coordinatesToFit,
              {
                edgePadding: { top: 50, right: 50, bottom: 250, left: 50 },
                animated: true,
              }
            );
          }
          
          // Update last route refresh time
          lastRouteRefreshTimeRef.current = Date.now();
        } else {
          console.error('No route coordinates found after decoding');
          showError('Route Error', 'No valid route found. Please try again.');
        }
      } else {
        console.error('No routes found in the response');
        showError('Route Error', 'Unable to calculate route. Please try again.');
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      if (error.response) {
        // console.error('Error response:', error.response.status, error.response.data);
      }
      showError('Route Error', 'Unable to calculate route. Please try again.');
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
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 5,
      },
      (position) => {
        lastPositionRef.current = position;
        if (position.coords.heading) {
          setBearing(position.coords.heading);
        }
      }
    );
  };

  const setupTimers = () => {
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

    routeRefreshTimerRef.current = setInterval(() => {
      if (tracking && currentPosition && destination) {
        const currentTime = Date.now();
        if (currentTime - lastRouteRefreshTimeRef.current >= ROUTE_REFRESH_INTERVAL) {
          setRouteRefreshRequired(true);
        }
      }
    }, ROUTE_REFRESH_INTERVAL);
  };

  const handlePositionUpdate = async (position) => {
    const { latitude, longitude } = position.coords;
    const newPosition = { latitude, longitude };

    setCurrentPosition(newPosition);
    await getAddressFromCoordinates(latitude, longitude);
    updateNavigationGuidance(newPosition);

    const currentTime = Date.now();
    if (currentTime - lastApiCallTimeRef.current >= API_CALL_INTERVAL) {
      lastApiCallTimeRef.current = currentTime;
    }
    
    // Check if we're close to destination
    if (destination) {
      const distanceToDestination = calculateDistance(
        newPosition.latitude,
        newPosition.longitude,
        destination.latitude,
        destination.longitude
      );
      
      // If within 30 meters of destination
      if (distanceToDestination < 0.03) {
        if (tracking) {
          Alert.alert(
            'Arrived at Destination',
            'You have arrived at your destination!',
            [{ text: 'OK', onPress: () => stopTracking() }]
          );
        }
      }
    }
    
    // Center map on current position during tracking
    if (tracking && mapRef.current) {
      mapRef.current.animateCamera({
        center: newPosition,
        heading: bearing,
        pitch: 45,
        zoom: 17,
      }, { duration: 500 });
    }
  };
  
  const updateNavigationGuidance = (position) => {
    if (!stepsRef.current || stepsRef.current.length === 0) return;
    
    // Find the closest step
    let closestStep = stepsRef.current[0];
    let closestDistance = Number.MAX_VALUE;
    let closestIndex = 0;
    
    stepsRef.current.forEach((step, index) => {
      const stepEndLocation = step.end_location;
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        stepEndLocation.lat,
        stepEndLocation.lng
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestStep = step;
        closestIndex = index;
      }
    });
    
    // If we're close to the end of the current step, show the next step
    if (closestDistance < 0.05 && closestIndex < stepsRef.current.length - 1) {
      const nextStep = stepsRef.current[closestIndex + 1];
      setNextTurnDistance(nextStep.distance.text);
      setNextTurnInstruction(nextStep.html_instructions.replace(/<[^>]*>/g, ' '));
    } else {
      setNextTurnDistance(closestStep.distance.text);
      setNextTurnInstruction(closestStep.html_instructions.replace(/<[^>]*>/g, ' '));
    }
    
    // Update remaining distance
    calculateRemainingDistance(position);
  };
  
  const calculateRemainingDistance = async (position) => {
    if (!destination) return;
    
    try {
      const origin = `${position.latitude},${position.longitude}`;
      const dest = `${destination.latitude},${destination.longitude}`;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await axios.get(url);
      const data = response.data;
      
      if (data.routes && data.routes.length > 0) {
        const routeLeg = data.routes[0].legs[0];
        setRemainingDistance(routeLeg.distance.text);
        setEstimatedTime(routeLeg.duration.text);
      }
    } catch (error) {
      console.error('Error calculating remaining distance:', error);
    }
  };
  
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };
  
  const updateLocationOnServer = async () => {
    if (!lastPositionRef.current || !taskId) return;
  
    const { latitude, longitude } = lastPositionRef.current.coords;
  
    const payload = {
      taskId,
      employeeId: 'USER_ID', // Replace with actual user ID
      latitude,
      longitude,
      bearing: bearing || 0,
      timestamp: new Date().toISOString(),
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
      locationUpdateTimerRef.current = null;
    }
    if (apiCallTimerRef.current) {
      clearInterval(apiCallTimerRef.current);
      apiCallTimerRef.current = null;
    }
    if (routeRefreshTimerRef.current) {
      clearInterval(routeRefreshTimerRef.current);
      routeRefreshTimerRef.current = null;
    }
  };
  
  const clearExistingTracking = async () => {
    if (watchIdRef.current) {
      await watchIdRef.current.remove();
      watchIdRef.current = null;
    }
  };
  
  const checkAndRequestPermissions = async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        showLocationError();
        return false;
      }
      
      // Also request background permissions if available
      if (Platform.OS === 'android') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          Alert.alert(
            'Background Location',
            'For best tracking experience, please allow background location access',
            [
              { text: 'Later' },
              { text: 'Settings', onPress: goToSettings }
            ]
          );
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking/requesting permissions:', error);
      return false;
    }
  };
  
  const showLocationError = () => {
    Alert.alert(
      'Location Error',
      'Unable to get your location. Please check your GPS settings and try again.',
      [
        { text: 'Cancel' },
        { text: 'Open Settings', onPress: goToSettings }
      ]
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
    if (tracking) {
      Alert.alert(
        'Navigation Active',
        'Are you sure you want to exit navigation?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => {
            stopTracking();
            navigation.goBack();
          }}
        ]
      );
    } else {
      navigation.goBack();
    }
  };
  
  const centerOnUser = () => {
    if (mapRef.current && currentPosition) {
      mapRef.current.animateCamera({
        center: currentPosition,
        heading: bearing,
        pitch: tracking ? 45 : 0,
        zoom: 17,
      });
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading navigation...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={currentPosition ? {
          ...currentPosition,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : null}
        rotateEnabled={true}
        showsUserLocation={false}
        showsMyLocationButton={false}
        followsUserLocation={tracking}
        showsCompass={true}
        showsTraffic={true}
      >
        {currentPosition && (
          <Marker coordinate={currentPosition} rotation={bearing}>
            <View style={styles.markerContainer}>
              <View style={styles.marker}>
                <Ionicons name="navigate" size={16} color="#FFFFFF" />
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
            strokeWidth={5}
            strokeColor="#4285F4"
            lineDashPattern={[0]}
          />
        )}
      </MapView>
  
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.turnInfo}>
          <Text style={styles.distanceText}>{nextTurnDistance}</Text>
          <Text style={styles.streetText}>{nextTurnInstruction || currentStreet}</Text>
        </View>
      </View>
  
      <TouchableOpacity style={styles.recenterButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={24} color="#4285F4" />
      </TouchableOpacity>
  
      <View style={styles.bottomSheet}>
        <View style={styles.tripInfo}>
          <View style={styles.eta}>
            <Text style={styles.timeText}>{estimatedTime}</Text>
            <Text style={styles.distanceValue}>{remainingDistance || totalDistance}</Text>
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
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    shadowOffset: { width: 0, height: 2 },
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
  recenterButton: {
    position: 'absolute',
    right: 16,
    bottom: 220,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 14,
    color: '#666',
  },
  destination: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '60%',
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
    flex: 1,
  },
  destinationLabel: {
    fontSize: 12,
    color: '#666',
  },
  destinationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    flexShrink: 1,
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
    borderWidth: 2,
    borderColor: '#FFFFFF',
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