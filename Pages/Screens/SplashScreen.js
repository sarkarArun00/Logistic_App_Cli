import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Image, StyleSheet, Text, ActivityIndicator, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          console.log('Token found:', token);
          navigation.replace('MainApp', { screen: 'Home' });
          
        } else {
          console.log('No token found');
          navigation.replace('Welcome');
          // navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error checking token:', error);
        navigation.replace('Login');
      }
    };

    
     const timer = setTimeout(() => {
      checkAuth();
    }, 3000);
     return () => clearTimeout(timer);
  });

  return (
    <View style={styles.container}>
      <Image style={styles.logo}
        source={require('../../assets/splash-img.png')} 
        resizeMode="contain"
      />

      {/* <Text style={styles.title}>Nirnayan Logistics</Text>
      <Text style={styles.subtitle}>Smart Delivery. On Time. Every Time.</Text> */}

      {/* <ActivityIndicator size="large" color="#3085FE" style={{ marginTop: 30 }} /> */}
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
 container: {
    flex: 1,
    backgroundColor: '#F0F8FF', 
    justifyContent: 'center',
    alignItems: 'center',
  },
 logo: {
    width: '100%',     
    height: '100%',    
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E2D4F',
  },
  subtitle: {
    fontSize: 14,
    color: '#7D8EA3',
    marginTop: 4,
  },
});