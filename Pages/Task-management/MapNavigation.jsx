import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Image, PermissionsAndroid } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
// import * as Location from 'expo-location';
import Geolocation from '@react-native-community/geolocation';
import MapViewDirections from 'react-native-maps-directions';
import { useRoute } from '@react-navigation/native';

const MapNavigation = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [steps, setSteps] = useState([]);
  const mapRef = useRef(null);
  const route = useRoute();
  const { task } = route.params;

  const GOOGLE_MAPS_APIKEY = 'AIzaSyAeQzuOcT3aIg5Ql2__hJ2bDli20jCA-Bo'; // Replace if needed

  useEffect(() => {
    if (task?.pickUpLocation?.coordinates) {
      const [latitude, longitude] = task.pickUpLocation.coordinates.split(',').map(Number);
      setDestination({ latitude, longitude });
    }
    requestLocationPermission();
  }, [task]);


async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      getCurrentLocation();
    } else {
      console.warn('Location permission denied');
    }
  } else {
    getCurrentLocation(); // iOS handles permission differently
  }
}

const getCurrentLocation = () => {
  Geolocation.getCurrentPosition(
    position => {
      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    error => {
      console.log('Error getting current location:', error);
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  );
};

  const fetchRouteDetails = async () => {
    if (currentLocation && destination && GOOGLE_MAPS_APIKEY) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_APIKEY}`
        );
        const data = await response.json();
  
        if (data.routes?.[0]?.legs?.[0]) {
          const route = data.routes[0].legs[0];
          const cleanedSteps = route.steps.map(step =>
            step.instructions ? step.instructions.replace(/<[^>]*>?/gm, '') : '[No instruction provided]'
          );
  
          setRouteDetails({
            distance: route.distance.text,
            duration: route.duration.text,
            steps: cleanedSteps,
          });
  
          setSteps(cleanedSteps);
        } else {
          console.warn('Could not fetch route details.');
          setRouteDetails(null);
          setSteps([]);
        }
      } catch (error) {
        console.error('Error fetching route details:', error);
        setRouteDetails(null);
        setSteps([]);
      }
    }
  };

  const startNavigation = () => {
    setIsNavigating(true);
    fetchRouteDetails();
    if (mapRef.current && currentLocation && destination) {
      mapRef.current.fitToCoordinates([currentLocation, destination], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      {currentLocation && destination ? (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            <Marker
              coordinate={currentLocation}
              title="You"
              description="Current Location"
              pinColor="green"
            />
            <Marker coordinate={destination} title="Destination" description="Logistics Address">
              <Image
                source={{ uri: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
                style={{ width: 30, height: 30 }}
              />
            </Marker>

            {currentLocation && destination && (
              <MapViewDirections
                origin={currentLocation}
                destination={destination}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={6}
                strokeColor="green"
                optimizeWaypoints={true}
                precision="high"
                onReady={result => {
                  console.log('Route is ready:', result.distance, result.duration);
                }}
                onError={errorMessage => {
                  console.warn('MapViewDirections error:', errorMessage);
                }}
              />
            )}
          </MapView>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              {isNavigating ? 'Navigation in Progress' : 'Address Details'}
            </Text>
            {isNavigating ? (
              <>
                {routeDetails ? (
                  <>
                    <Text style={styles.detailText}>Distance: {routeDetails.distance}</Text>
                    <Text style={styles.detailText}>Estimated Time: {routeDetails.duration}</Text>
                    {steps.length > 0 && (
                      <View >
                        {/* <Text style={styles.stepsTitle}>Route Steps:</Text>
                        <ScrollView>
                          {steps.map((step, index) => (
                            <Text key={index} style={styles.stepText}>
                              {index + 1}. {step}
                            </Text>
                          ))}
                        </ScrollView> */}
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.smallText}>Fetching route details...</Text>
                )}
              </>
            ) : (
              <Text style={styles.smallText}>Tap 'Start Navigation' to see route and details.</Text>
            )}
            {!isNavigating && (
              <TouchableOpacity style={styles.button} onPress={startNavigation}>
                <Text style={styles.buttonText}>Start Navigation</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text>Fetching your location...</Text>
        </View>
      )}
    </View>
  );
};

export default MapNavigation;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  infoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#475569',
    marginTop: 2,
  },
  smallText: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepsContainer: {
    marginTop: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  stepText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
});
