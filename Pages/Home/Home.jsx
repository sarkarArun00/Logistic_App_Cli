import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, TextInput, Platform, PermissionsAndroid,FlatList
} from 'react-native';
// import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
// import { useFonts, Montserrat_600SemiBold, Montserrat_400Regular, Montserrat_500Medium } from '@expo-google-fonts/montserrat';
// import * as Location from 'expo-location';
// import * as Haptics from 'expo-haptics';
import RNSwipeVerify from 'react-native-swipe-verify';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from '../Header/header'
import AuthService from '../Services/auth_service';
import TaskService from '../Services/task_service';
import { useGlobalAlert } from '../../Context/GlobalAlertContext';
import { useFocusEffect } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import { Vibration } from 'react-native';
import { lightTheme } from '../GlobalStyles';


export default function Home({ navigation }) {
    const swipeRef = useRef(null);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [userName, setUserName] = useState("");

    const [checkInTime, setCheckInTime] = useState(null);
    const [workingDuration, setWorkingDuration] = useState('00:00');

    const timerRef = useRef(null);
    const [checkInTimeDisplay, setCheckInTimeDisplay] = useState(null);
    const [displayTime, setDisplayTime] = useState(null);

    const { showAlertModal, hideAlert } = useGlobalAlert();
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [userInfo, setUserInfo] = useState(null);


    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPages, setFilteredPages] = useState([]);
  
    const pages = [
      { id: '1', name: 'Profile', link: 'Profile' },
      { id: '2', name: 'Task', link: 'Assigned'},
      { id: '3', name: 'Notifications', link: 'Notification' },
      { id: '4', name: 'Attendance', link: 'Attendance' },
      { id: '5', name: 'Receipt', link: 'Receipt' },
      // Add more pages as needed
    ];


    useEffect(() => {
        const getUserData = async () => {
            try {
                const storedName = await AsyncStorage.getItem("user_name");
                if (storedName) {
                    setUserName(storedName);
                }
            } catch (error) {
                console.error("Error retrieving user data:", error);
            }
        };
        getUserData();
        fetchProfilePicture();
    }, [navigation])




    useFocusEffect(
        useCallback(() => {
            const debugAsyncStorage = async () => {
                try {
                    const keys = await AsyncStorage.getAllKeys();
                    const result = await AsyncStorage.multiGet(keys);
                    result.forEach(([key, value]) => {
                        console.log(`${key}: ${value}`);
                    });
                } catch (e) {
                    console.error("Error reading AsyncStorage", e);
                }
            };
            debugAsyncStorage();

            const init = async () => {

                const storedName = await AsyncStorage.getItem("user_name");
                if (storedName) setUserName(storedName);

                const isChecked = await AsyncStorage.getItem('isCheckedIn');
                const checkInStr = await AsyncStorage.getItem('checkInTime');
                const displayTime = await AsyncStorage.getItem('checkInTimeDisplay');
                getTimeAgo(checkInStr);

                setDisplayTime(getTimeAgo(checkInStr));

                if (isChecked === 'true' && checkInStr) {
                    setIsCheckedIn(true);
                    setCheckInTime(checkInStr);
                    setCheckInTimeDisplay(displayTime);

                    const parsedCheckIn = new Date(checkInStr);
                    startTimer(parsedCheckIn);               // Update UI timer
                    // startAutoCheckoutTimer(parsedCheckIn);   // Auto checkout logic
                } else {
                    setIsCheckedIn(false);
                }

                if (isChecked == null) {
                    setIsCheckedIn(false);
                    setCheckInTime(null);
                    setCheckInTimeDisplay(null);
                    setWorkingDuration('00:00');
                }
            };



            init();
            getCurrentLocation();

            return () => clearInterval(timerRef.current);
        }, [])
    );


    const fetchProfilePicture = async () => {
        try {
            // Fetch the profile picture from your API or local storage
            const response = await TaskService.getUserData();
            if (response.status === 1) {
                setUserInfo(response.data);
                console.log('User Info:', response.data);
            } else {
                console.error('Failed to fetch profile picture:', response.message);
            }
        } catch (error) {
            console.error('Error fetching profile picture:', error);
        }
    };

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'N/A';

        const past = new Date(timestamp);
        const now = new Date();

        if (isNaN(past.getTime())) return 'Invalid date';

        const diffMs = now - past;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (diffSec < 60) return `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
        if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
        if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
        return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    };


    const requestLocationPermission = async () => {
        if (Platform.OS === 'ios') {
          const auth =  Geolocation.requestAuthorization('whenInUse');
          return auth === 'granted';
        }
      
        if (Platform.OS === 'android') {
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              {
                title: 'Location Permission',
                message: 'We need to access your location to continue.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              }
            );
      
            return granted === PermissionsAndroid.RESULTS.GRANTED;
          } catch (err) {
            console.warn('Permission error:', err);
            return false;
          }
        }
      
        return false;
      };
      
      const getCurrentLocation = async () => {
        const hasPermission = await requestLocationPermission();
      
        if (!hasPermission) {
          showAlertModal('Location permission denied or unavailable.', true);
          return;
        }
      
        Geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            setLatitude(latitude);
            setLongitude(longitude);
            console.log('Latitude:', latitude);
            console.log('Longitude:', longitude);
          },
          error => {
            console.warn('Location Error:', error.code, error.message);
            setLatitude(null);
            setLongitude(null);
          },
          {
            enableHighAccuracy: false,
            timeout: 60000,
            maximumAge: 10000,
            forceRequestLocation: true,
            showLocationDialog: true,
          }
        );
      };

    const handleSwipe = async () => {
        try {
            //    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            if (latitude === null || longitude === null) {
                showAlertModal('Unable to fetch location. Please try again.', true);
                swipeRef.current?.reset();
                return;
            }
            const userId = await AsyncStorage.getItem("user_id");
            const request = {
                employeeId: userId,
                loginDate: new Date().toISOString().split('T')[0],
                latitude: latitude,
                longitude: longitude,
            };

            if (!isCheckedIn) {
                const response = await AuthService.attendanceCheckIn(request);
                if (response.status == 1) {
                    showAlertModal('You have successfully checked in.', false);
                    setTimeout(() => hideAlert(), 3000);
                    const now = new Date();
                    const isoString = now.toISOString();
                    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    await AsyncStorage.setItem('isCheckedIn', 'true');
                    await AsyncStorage.setItem('checkInTime', isoString);
                    await AsyncStorage.setItem('checkInTimeDisplay', formattedTime);
                    Vibration.vibrate(500);
                    setCheckInTime(isoString);
                    setCheckInTimeDisplay(formattedTime);
                    setIsCheckedIn(true);
                    startTimer(now);
                    // startAutoCheckoutTimer(now);
                    setLatitude(null);
                    setLongitude(null);
                } else {
                    showAlertModal('Check-in failed. Please try again.', true);
                }
            } else {
                // 👉 Check Out
                const response = await AuthService.attendanceCheckOut(request);
                if (response.status == 1) {
                    showAlertModal('You have successfully checked out.', false);
                    setTimeout(() => hideAlert(), 3000);
                    await AsyncStorage.multiRemove(['isCheckedIn', 'checkInTime', 'checkInTimeDisplay']);
                    setIsCheckedIn(false);
                    setCheckInTimeDisplay(null);
                    setWorkingDuration('00:00');
                    clearInterval(timerRef.current);
                    setLatitude(null);
                    setLongitude(null);
                } else {
                    showAlertModal('Check-out failed. Please try again.', true);
                }
            }
        } catch (err) {
            console.error("handleSwipe error:", err);
            showAlertModal('Unexpected error occurred. Try again.', true);
        } finally {
            swipeRef.current?.reset();
        }
    };



    const startTimer = (checkInDate) => {
        clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            const now = new Date();
            const diff = now - new Date(checkInDate);

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            // const seconds = Math.floor((diff / 1000) % 60);


            const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;  //:${String(seconds).padStart(2, '0')}
            setWorkingDuration(formatted);
        }, 1000);
    }

    const handleSearch = (text) => {
        setSearchQuery(text);
        const results = pages.filter((page) =>
          page.name.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredPages(results);
      };
    
      const renderItem = ({ item, index }) => {
        console.log('jhfsdhfjhjshjfshjfsjfjh', item.name)
        return (
        <TouchableOpacity
          onPress={() => navigation.navigate(item.name)}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderBottomWidth: index === filteredPages.length - 1 ? 0 : 1,
            borderColor: '#f0f0f0',
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'Montserrat_500Medium',
              color: '#0C0D36',
            }}
          >
            {item.name}
          </Text>
    
          {/* Navigation Arrow Icon */}
          <Image
            source={require('../../assets/arrow.png')}
            style={{
              width: 16,
              height: 16,
              tintColor: 'green',
            }}
          />
        </TouchableOpacity>
        )
    };

    // const handleAutoCheckout = async () => {
    //     const userId = await AsyncStorage.getItem('user_id');

    //     const request = {
    //         employeeId: userId,
    //         loginDate: new Date().toISOString().split('T')[0],
    //         latitude: latitude.toString(),
    //         longitude: longitude.toString(),
    //     };

    //     const response = await AuthService.attendanceCheckOut(request);
    //     if (response.status === 1) {
    //         Alert.alert("Auto Checked Out", "You have been automatically checked out after 12 hours.");
    //         await AsyncStorage.removeItem('isCheckedIn');
    //         await AsyncStorage.removeItem('checkInTime');
    //         setIsCheckedIn(false);
    //         setWorkingDuration('00:00');
    //         clearInterval(timerRef.current);
    //     }
    // };

    // const startAutoCheckoutTimer = (checkInDate) => {
    //     const twelveHoursInMs = 12 * 60 * 60 * 1000;

    //     setTimeout(() => {
    //         handleAutoCheckout();
    //     }, twelveHoursInMs - (new Date() - new Date(checkInDate)));
    // };



    // const [fontsLoaded] = useFonts({
    //     Montserrat_600SemiBold,
    //     Montserrat_400Regular,
    //     Montserrat_500Medium
    // });

    // if (!fontsLoaded) {
    //     return null;
    // }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}>

                {/* App Header */}
                <Header navigation={navigation} profileImage={userInfo?.employeePhoto} />

                <View style={{ position: 'relative', marginTop: 30, }}>
                    <TextInput
                        style={{ fontSize: 14, fontFamily: 'Montserrat_500Medium', height: 50, backgroundColor: '#F6FAFF', borderRadius: 30, paddingLeft: 20, paddingRight: 50, }}
                        placeholder="Search pages..."
                        placeholderTextColor="#0C0D36"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    <Image style={{ position: 'absolute', top: 16, right: 20, width: 20, height: 20, }} source={require('../../assets/search.png')} />
                </View>

                {searchQuery.length > 0 && (
        <View
          style={{
            marginTop: 12,
            backgroundColor: '#fff',
            borderRadius: 16,
            paddingVertical: 8,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          {filteredPages.length > 0 ? (
            <FlatList
            data={filteredPages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            />
          ) : (
            <Text
              style={{
                textAlign: 'center',
                fontSize: 14,
                fontFamily: 'Montserrat_500Medium',
                color: '#999',
                padding: 10,
              }}
            >
              No results found
            </Text>
          )}
        </View>
      )}

                <View style={{ marginTop: 20, backgroundColor: '#ecf2fc', borderWidth: 1, borderColor: '#bdd7fc', borderRadius: 40, paddingHorizontal: 15, paddingTop: 35, paddingBottom: 24, }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, }}>
                        <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 15, color: '#3085FE', }}>Attendence Managing {'\n'}Platform</Text>
                        <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 12, lineHeight: 14, color: '#0C0D36', }}>Updated {displayTime}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', }}>
                        <View style={{ width: '47%', backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 15, }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                                <View style={{ width: 35, height: 35, backgroundColor: '#F0F5F9', borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                                    <Image style={{ width: 20, height: 20, }} source={require('../../assets/login.png')} />
                                </View>
                                <Text style={{ flex: 1, fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 15, color: '#0C0D36', paddingLeft: 7, }}>Check In</Text>
                            </View>
                            <View>
                                <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 16, lineHeight: 22, color: '#0C0D36', paddingTop: 14, }}>
                                    {checkInTimeDisplay ?? '--:--'}
                                </Text>
                                <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, lineHeight: 17, color: '#0C0D36', paddingTop: 6, }}>On Time</Text>
                            </View>
                        </View>
                        <View style={{ width: '47%', backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 15, }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                                <View style={{ width: 35, height: 35, backgroundColor: '#F0F5F9', borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                                    <Image style={{ width: 20, height: 20, }} source={require('../../assets/checkout.png')} />
                                </View>
                                <Text style={{ flex: 1, fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 15, color: '#0C0D36', paddingLeft: 7, }}>Working Hour</Text>
                            </View>
                            <View>
                                <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 16, lineHeight: 22, color: '#0C0D36', paddingTop: 14, }}>
                                    {workingDuration} Hours
                                </Text>
                                <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, lineHeight: 17, color: '#0C0D36', paddingTop: 6, }}>Shift Duration</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.swipeContainer}>
                        <RNSwipeVerify
                            ref={swipeRef}
                            borderRadius={48}
                            width={'100%'}
                            buttonSize={50}
                            buttonColor={'#fff'}
                            backgroundColor={isCheckedIn ? '#F45F32' : '#3085FE'}
                            okButton={{
                                visible: true,
                            }}
                            icon={
                                <View style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center', }}>
                                    {isCheckedIn ?
                                        (<Image
                                            source={require('../../assets/arrow2.png')}
                                            style={{ width: 30, height: 30, resizeMode: 'contain' }}
                                        />)
                                        : (<Image
                                            source={require('../../assets/arrow.png')}
                                            style={{ width: 30, height: 30, resizeMode: 'contain' }}
                                        />)}
                                </View>
                            }
                            onVerified={handleSwipe}>
                            <Text style={styles.swipeText}>
                                {isCheckedIn ? 'Slide to Check Out' : 'Slide to Check In'}
                            </Text>
                        </RNSwipeVerify>
                    </View>
                </View>

                <View style={{ paddingTop: 20, marginBottom: 90, }}>
                    <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 16, lineHeight: 18, color: '#3085FE', paddingBottom: 20, }}>My Shortcuts</Text>
                    <View style={{ backgroundColor: '#F6FAFF', borderRadius: 40, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, }}>
                        <TouchableOpacity style={[styles.box, { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 15, marginBottom: 12, }]}
                            onPress={() => navigation.navigate('MainApp', { screen: 'Assigned' })}>
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', }}>
                                <View style={{ width: 34, }}>
                                    <Image style={{ width: 34, height: 34, }} source={require('../../assets/task1.png')} />
                                </View>
                                <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 18, color: '#0C0D36', flex: 1, paddingLeft: 9, }}>My Tasks</Text>
                            </View>
                            <View style={{ width: 22, }}>
                                <Image style={{ width: 22, height: 16, }} source={require('../../assets/rightarrow.png')} />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.box, { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 15, marginBottom: 12, }]}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 34 }}>
                            <Image
                            style={{ width: 34, height: 34 }}
                            source={require('../../assets/task2.png')}
                            />
                        </View>
                        <Text
                            style={{
                            fontFamily: 'Montserrat_500Medium',
                            fontSize: 14,
                            lineHeight: 18,
                            color: '#0C0D36',
                            paddingLeft: 9,
                            }}
                        >
                            Estimated Route
                        </Text>

                        <View
                            style={{
                            backgroundColor: '#FFE4B5', // light orange/yellow for highlight
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 10,
                            marginLeft: 8,
                            }}
                        >
                            <Text
                            style={{
                                fontSize: 12,
                                color: '#D2691E', // darker orange
                                fontWeight: 'bold',
                            }}
                            >
                            Coming Soon
                            </Text>
                        </View>
                        </View>

                            <View style={{ width: 22, }}>
                                <Image style={{ width: 22, height: 16, }} source={require('../../assets/rightarrow.png')} />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Receipt', { page: 'home' })} style={[styles.box, { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 15, marginBottom: 12, }]}>
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', }}>
                                <View style={{ width: 34, }}>
                                    <Image style={{ width: 34, height: 34, }} source={require('../../assets/task3.png')} />
                                </View>
                                <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 18, color: '#0C0D36', flex: 1, paddingLeft: 9, }}>Generate Receipt</Text>
                            </View>
                            <View style={{ width: 22, }}>
                                <Image style={{ width: 22, height: 16, }} source={require('../../assets/rightarrow.png')} />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('MainApp', { screen: 'Wallet' })} style={[styles.box, { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 15, marginBottom: 12, }]}>
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', }}>
                                <View style={{ width: 34, }}>
                                    <Image style={{ width: 34, height: 34, }} source={require('../../assets/task4.png')} />
                                </View>
                                <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 14, lineHeight: 18, color: '#0C0D36', flex: 1, paddingLeft: 9, }}>My Wallet</Text>
                            </View>
                            <View style={{ width: 22, }}>
                                <Image style={{ width: 22, height: 16, }} source={require('../../assets/rightarrow.png')} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#fff',
        // paddingBottom:80,
    },
    box: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 2,
    },
    swipeContainer: {
        marginTop: 30,
        width: '92%',
        marginHorizontal: "auto",
    },
    swipeText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 14,
        color: '#fff',
    },



})