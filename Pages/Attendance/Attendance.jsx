
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Image, ScrollView, TextInput, Modal, RefreshControl, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'
// import { useFonts, Montserrat_700Bold, Montserrat_400Regular, Montserrat_500Medium } from '@expo-google-fonts/montserrat'
import RNSwipeVerify from 'react-native-swipe-verify';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import Header from '../Header/header'
import { GlobalStyles } from '../GlobalStyles';

// import * as Location from 'expo-location';
import AuthService from '../Services/auth_service';
// import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';
import TaskService from '../Services/task_service';

import { Calendar } from 'react-native-calendars';
import { useGlobalAlert } from '../../Context/GlobalAlertContext'
import Geolocation from '@react-native-community/geolocation';
import { lightTheme } from '../GlobalStyles';


import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import moment from 'moment';

import { checkGPSAndGetLocation } from '../../Context/location.js'
import GPSModal from '../../Context/GPSModal.js'
import RNAndroidLocationEnabler from 'react-native-location-enabler';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';
const { PRIORITIES: { HIGH_ACCURACY }, useLocationSettings } = RNAndroidLocationEnabler;
import ShimmerSwipeText from '../Home/ShimmerSwipeText.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);


const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};






function Attendance({ navigation }) {
    const swipeRef = useRef(null);
    const [isCheckedIn, setIsCheckedIn] = useState(false);

    const [userName, setUserName] = useState("");
    const [checkInTime, setCheckInTime] = useState(null);
    const [workingDuration, setWorkingDuration] = useState(null);

    const timerRef = useRef(null);
    const [checkInTimeDisplay, setCheckInTimeDisplay] = useState(null);
    const [displayTime, setDisplayTime] = useState(null);

    const [markedDates, setMarkedDates] = useState({});
    const [loading, setLoading] = useState(true);
    const { showAlertModal, hideAlert } = useGlobalAlert();
    const [attendance, setAttendance] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [checkInCheckout, setCheckInCheckOut] = useState([]);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showBlinkDot, setShowBlinkDot] = useState(true);
    const [showModal, setShowModal] = useState(false);

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

        const today = new Date();
        const currentMonthDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        fetchAttendanceData(currentMonthDate);

        return () => clearInterval(timerRef.current);


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
                const token = await AsyncStorage.getItem("token");
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
                } else {
                    setIsCheckedIn(false);
                }

                if (isChecked == null) {
                    setIsCheckedIn(false);
                    setCheckInTime(null);
                    setCheckInTimeDisplay(null);
                    setWorkingDuration('--:--');
                }
            };


            init();
            return () => {
                console.log('Attendance Page Unfocused');
                clearInterval(timerRef.current);
            };
        }, [])
    );

    const handleMonthChange = (month) => {
        const selectedMonthDate = `${month.year}-${String(month.month).padStart(2, '0')}-01`;
        fetchAttendanceData(selectedMonthDate);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setShowBlinkDot(prev => !prev);
        }, 500);

        return () => clearInterval(interval);
    }, []);

    const today = moment().format('YYYY-MM-DD');
    const fetchAttendanceData = async (monthDate) => {
        try {
            const userId = await AsyncStorage.getItem("user_id");
            if (!userId) return showAlertModal("User ID not found", true);

            // setLoading(true);
            const response = await TaskService.getEmpMonthlyShiftRoster({
                employeeId: userId,
                monthDate,
            });

            if (response?.data?.data && Array.isArray(response.data.data)) {
                const rawData = response.data.data;
                const formatDateForCalendar = (dateStr) => {
                    const [day, month, year] = dateStr.split('/');
                    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                };

                const getColor = (shiftType, isPresent) => {
                    if (shiftType === 'WD') {
                        if (isPresent === true) return '#4CAF50'; // Green - Present
                        if (isPresent === false) return '#FF5252'; // Red - Absent
                        return '#8fadf7'; // Blue - Working day, no status
                    } else if (shiftType === 'WO') {
                        return '#F9C74F'; // Yellow - Weekly Off
                    } else if (shiftType === 'HO') {
                        return '#9544f2'; // Red - Holiday
                    }
                    return '#C4C4C4'; // Default grey
                };

                const dateMarks = {};

                rawData.forEach(item => {
                    const formattedDate = formatDateForCalendar(item.weekDate);
                    const bgColor = getColor(item.shiftType, item.isPresent);

                    const isToday = formattedDate === today;

                    dateMarks[formattedDate] = {
                        customStyles: {
                            container: {
                                backgroundColor: bgColor,
                                borderRadius: 20,
                            },
                            text: {
                                color: 'white',
                                fontWeight: 'bold',
                            },
                        },
                        ...(isToday && showBlinkDot
                            ? { dots: [{ key: 'blink', color: '#FFFFFF' }] }
                            : {}),
                    };
                });

                setMarkedDates(dateMarks);
                setLoading(false);
            } else {
                console.warn("Unexpected API format or empty data:", response);
            }
        } catch (error) {
            showAlertModal('Failed to fetch attendance data: ' + error.message, true);
        } finally {
            setLoading(false);
        }
    };

    const handleDayPress = async (day) => {
        fetchAttendanceData2(day.dateString)
    };

    const fetchAttendanceData2 = async (dateString) => {
        try {
            const userId = await AsyncStorage.getItem("user_id");
            if (!userId) return showAlertModal("User ID not found", true);
    
            const request = {
                employeeId: Number(userId),
                loginDate: dateString,
            };
            setLoading(true)
            const response = await TaskService.getLoginByDate(request);
            console.log('aaaaaaaaaaaa', response)
            const format = 'D/M/YYYY, h:mm:ss a';
    
            if (response.status == 1) {
                const loginTime = dayjs.tz(response.data.login, format, 'Asia/Kolkata').format('hh:mm A');
                const logoutTime = dayjs.tz(response.data.logout, format, 'Asia/Kolkata').format('hh:mm A');
                setCheckInCheckOut({ checkIn: loginTime, checkOut: logoutTime });
                setAttendance(response.data);
            } else {
                showAlertModal(response.message || 'No data for selected date.', true);
                setAttendance([]);
            }
        } finally {
            setLoading(false)
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
        if (Platform.OS === 'android') {
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              {
                title: 'Geolocation Permission',
                message: 'Can we access your location?',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              },
            );
            console.log('granted', granted);
            if (granted === 'granted') {
              console.log('You can use Geolocation');
              return true;
            } else {
              console.log('You cannot use Geolocation');
              return false;
            }
          } catch (err) {
            return false;
          }
        }
      };


      const handleEnableAndGetLocation = async () => {
        // 1. First, check and request runtime permissions
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          console.log('Location permission denied.');
          return;
        }
    
        // 2. Now, on Android, check and prompt to enable GPS if needed
        if (Platform.OS === 'android') {
          try {
            const enableResult = await promptForEnableLocationIfNeeded();
            if (enableResult === 'already-enabled' || enableResult === 'enabled') {
              console.log('GPS is enabled, fetching location...');

            } else {
              console.log('User did not enable GPS.');
            }
          } catch (error) {
            console.error(error);
            console.log('An error occurred while trying to enable GPS.');
          }
        } else {
          // 3. On iOS, permissions and GPS are handled by the system
          console.log('Fetching location on iOS...');
        }
      };

      const handleEnableGPS = () => {
        setShowModal(false);
        handleEnableAndGetLocation(); // Opens device settings so user can turn on GPS manually
      };

      const handleSwipe = () => {
        // Defer heavy logic after swipe is released visually
        requestAnimationFrame(() => {
          swipeRef.current?.reset(); // Always reset early for UI responsiveness
      
          checkGPSAndGetLocation(
            async (latitude, longitude) => {
              const userId = await AsyncStorage.getItem('user_id');

              const request = {
                employeeId: userId,
                loginDate: new Date().toISOString().split('T')[0],
                latitude,
                longitude,
              };
      
              try {
                if (!isCheckedIn) {
                  // 👇 Check-In Logic
                  const response = await AuthService.attendanceCheckIn(request);
                  if (response.status === 1) {
                    const now = new Date();
                    const isoString = now.toISOString();
                    const formattedTime = now.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
      
                    await AsyncStorage.multiSet([
                      ['isCheckedIn', 'true'],
                      ['checkInTime', isoString],
                      ['checkInTimeDisplay', formattedTime],
                    ]);
      
                    setIsCheckedIn(true);
                    setCheckInTime(isoString);
                    setCheckInTimeDisplay(formattedTime);
                    startTimer(now);
      
                    Vibration.vibrate(300);
                    showAlertModal('✅ Checked In Successfully', false);
                  } else {
                    showAlertModal('❌ Check-in failed. Try again.', true);
                  }
                } else {
                  // 👇 Check-Out Logic
                  const response = await AuthService.attendanceCheckOut(request);
                  if (response.status === 1) {
                    await AsyncStorage.multiRemove([
                      'isCheckedIn',
                      'checkInTime',
                      'checkInTimeDisplay',
                    ]);
      
                    setIsCheckedIn(false);
                    setCheckInTimeDisplay(null);
                    setWorkingDuration('--:--');
                    clearInterval(timerRef.current);
      
                    Vibration.vibrate(300);
                    showAlertModal('✅ Checked Out Successfully', false);
                  } else {
                    showAlertModal('❌ Check-out failed. Try again.', true);
                  }
                }
      
                // ✅ Hide message after 3s if needed
                setTimeout(hideAlert, 3000);
              } catch (err) {
                console.error('Attendance error:', err);
                Alert.alert('Error', 'Something went wrong. Please try again.');
              }
            },
            (reason) => {
              // 🔒 Location/GPS errors
              if (reason === 'gps_off') {
                setShowModal(true); // show modal to enable GPS
              } else {
                Alert.alert('Location Error', reason || 'Could not get location');
              }
            }
          );
        });
      };

    // const handleSwipe = async () => {

    //     // await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    //     const userId = await AsyncStorage.getItem("user_id");
    //     if (latitude === null || longitude === null) {
    //         // showAlertModal('Unable to fetch location. Please try again.', true);
    //         setShowLocationModal(true);
    //         swipeRef.current?.reset();
    //         return;
    //     }

    //     const request = {
    //         employeeId: userId,
    //         loginDate: new Date().toISOString().split('T')[0],
    //         latitude: latitude,
    //         longitude: longitude,
    //     };

    //     if (!isCheckedIn) {
    //         // 👉 Check In Logic
    //         let response = await AuthService.attendanceCheckIn(request);
    //         if (response.status == 1) {
    //             showAlertModal('You have successfully Checked In.', false);
    //             const now = new Date();
    //             const isoString = now.toISOString();
    //             const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    //             await AsyncStorage.setItem('isCheckedIn', 'true');
    //             await AsyncStorage.setItem('checkInTime', isoString);
    //             await AsyncStorage.setItem('checkInTimeDisplay', formattedTime);

    //             setCheckInTime(isoString);
    //             setCheckInTimeDisplay(formattedTime);
    //             setIsCheckedIn(true);
    //             Vibration.vibrate(500);
    //             startTimer(now);
    //         } else {
    //             showAlertModal('Failed to check in, Please try again.', true);
    //         }
    //     } else {
    //         // 👉 Check Out Logic
    //         let response = await AuthService.attendanceCheckOut(request);
    //         if (response.status == 1) {
    //             showAlertModal('You have successfully Checked Out.', false);
    //             await AsyncStorage.multiRemove(['isCheckedIn', 'checkInTime', 'checkInTimeDisplay']);

    //             setIsCheckedIn(false);
    //             setCheckInTimeDisplay(null);
    //             setWorkingDuration('--:--');
    //             clearInterval(timerRef.current);
    //             Vibration.vibrate(500);
    //         } else {
    //             showAlertModal('Failed to check out, Please try again..', true);
    //         }
    //     }

    //     swipeRef.current?.reset();
    // };


    const startTimer = (checkInDate) => {
        clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            const now = new Date();
            const diff = now - new Date(checkInDate);

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;  //:${String(seconds).padStart(2, '0')}
            setWorkingDuration(formatted);
        }, 1000);
    }

    const getCurrentMonthDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}-01`;
    }


    const onRefresh = useCallback(() => {
        setRefreshing(true);
        const currentMonth = getCurrentMonthDate();
        handleMonthChange({ year: parseInt(currentMonth.slice(0, 4)), month: parseInt(currentMonth.slice(5, 7)) });
        wait(2000).then(() => setRefreshing(false));
    }, []);


    const formatDateTime = (dateString) => {
        if (!dateString) return '';
    
        const date = new Date(dateString);
    
        const day = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit' });
        const month = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: '2-digit' });
        const year = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric' });
    
        return `${day}-${month}-${year}`;
    };
    


    return (
        <SafeAreaView style={[
            styles.container,
            GlobalStyles.SafeAreaView,
            styles.paddingBottom
            // { paddingBottom: lightTheme.paddingBottomNew }
        ]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }>

                {/* App Header */}
                <Header navigation={navigation} profileImage={userInfo?.employeePhoto} />

                <View style={{ position: 'relative', marginTop: 30 }}>
                    <TextInput
                        style={{ fontSize: 14, fontFamily: 'Montserrat-Medium', height: 50, backgroundColor: '#F6FAFF', borderRadius: 30, paddingLeft: 20, paddingRight: 50, }}
                        placeholder="Search"
                        placeholderTextColor="#0C0D36"
                    />
                    <Image style={{ position: 'absolute', top: 16, right: 20, width: 20, height: 20, }} source={require('../../assets/search.png')} />
                </View>

                <View style={{ marginTop: 20, backgroundColor: '#ecf2fc', borderWidth: 1, borderColor: '#bdd7fc', borderRadius: 40, paddingHorizontal: 15, paddingTop: 35, paddingBottom: 24, }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, }}>
                        <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 15, color: '#3085FE', }}>Manage Attendence</Text>
                        {/* <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 12, lineHeight: 14, color: '#0C0D36', }}>Updated {displayTime}</Text> */}
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', }}>
                        <View style={{ width: '47%', backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 15, }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                                <View style={{ width: 35, height: 35, backgroundColor: '#F0F5F9', borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                                    <Image style={{ width: 20, height: 20, }} source={require('../../assets/login.png')} />
                                </View>
                                <Text style={{ flex: 1, fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 15, color: '#0C0D36', paddingLeft: 7, }}>Check In</Text>
                            </View>
                            <View>
                                <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 16, lineHeight: 22, color: '#0C0D36', paddingTop: 14, }}>
                                    {checkInTimeDisplay ?? '--:--'}
                                </Text>
                                <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 17, color: '#0C0D36', paddingTop: 6, }}>On Time</Text>
                            </View>
                        </View>
                        <View style={{ width: '47%', backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 15, }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                                <View style={{ width: 35, height: 35, backgroundColor: '#F0F5F9', borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                                    <Image style={{ width: 20, height: 20, }} source={require('../../assets/checkout.png')} />
                                </View>
                                <Text style={{ flex: 1, fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 15, color: '#0C0D36', paddingLeft: 7, }}>Working Hour</Text>
                            </View>
                            <View>
                                <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 16, lineHeight: 22, color: '#0C0D36', paddingTop: 14, }}>
                                    {workingDuration ?? '--:--'}
                                </Text>
                                <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 17, color: '#0C0D36', paddingTop: 6, }}>Shift Duration</Text>
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
                            {/* <Text style={styles.swipeText}>
                                {isCheckedIn ? 'Slide to Check Out' : 'Slide to Check In'}
                            </Text> */}
                            <ShimmerSwipeText
                                text={isCheckedIn ? 'Slide to Check Out' : 'Slide to Check In'}
                            />
                        </RNSwipeVerify>
                    </View>
                    <GPSModal
                        visible={showModal}
                        onClose={() => setShowModal(false)}
                        onEnable={handleEnableGPS}
                    />
                </View>

                <View style={styles.container}>
                    {loading && <ActivityIndicator size="large" color="#3085FE" />}
                    <Calendar
                        markingType="custom"
                        markedDates={markedDates}
                        onMonthChange={handleMonthChange}
                        onDayPress={handleDayPress}  // this is your callback
                        dayComponent={({ date, state }) => {
                            const today = moment().format('YYYY-MM-DD');
                            const isToday = date.dateString === today;
                            const animatedValue = useRef(new Animated.Value(1)).current;

                            useEffect(() => {
                                if (isToday) {
                                    Animated.loop(
                                        Animated.sequence([
                                            Animated.timing(animatedValue, {
                                                toValue: 1.05,
                                                duration: 800,
                                                easing: Easing.inOut(Easing.ease),
                                                useNativeDriver: true,
                                            }),
                                            Animated.timing(animatedValue, {
                                                toValue: 1,
                                                duration: 800,
                                                easing: Easing.inOut(Easing.ease),
                                                useNativeDriver: true,
                                            }),
                                        ])
                                    ).start();
                                }
                            }, [isToday]);

                            const style = markedDates[date.dateString]?.customStyles?.container || {};
                            const textStyle = markedDates[date.dateString]?.customStyles?.text || {};
                            const AnimatedWrapper = isToday ? Animated.View : View;

                            return (
                                <TouchableOpacity onPress={() => handleDayPress(date)}>
                                    <AnimatedWrapper
                                        style={{
                                            ...style,
                                            transform: isToday ? [{ scale: animatedValue }] : [],
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            width: 36,
                                            height: 36,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                ...textStyle,
                                                opacity: state === 'disabled' ? 0.4 : 1,
                                            }}
                                        >
                                            {date.day}
                                        </Text>
                                    </AnimatedWrapper>
                                </TouchableOpacity>
                            );
                        }}
                        theme={{
                            todayTextColor: '#3085FE',
                            arrowColor: '#3085FE',
                            monthTextColor: '#000',
                            textDayFontWeight: '500',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '500',
                        }}
                    />


                </View>



                <View style={styles.card}>
                    <View style={styles.section}>
                        <Text style={styles.label}>Log In</Text>
                        <Text style={styles.value}>{formatDateTime(attendance?.loginDate)} {checkInCheckout?.checkIn || ""}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.section}>
                        <Text style={styles.label}>Log Out</Text>
                        <Text style={styles.value}>{checkInCheckout?.checkOut || ""}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.section}>
                        <Text style={styles.label}>Duration</Text>
                        <Text style={styles.value}>{attendance?.duration?.hours || 0}h {attendance?.duration?.minutes || 0}m</Text>
                    </View>
                </View>

            </ScrollView>

            <Modal
                transparent
                animationType="fade"
                visible={showLocationModal}
                onRequestClose={() => setShowLocationModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Enable Location</Text>
                        <Text style={styles.modalText}>
                            Unable to fetch location. Please enable your location services.
                        </Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                onPress={() => setShowLocationModal(false)}
                                style={[styles.button, styles.cancelButton]}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    setShowLocationModal(false);
                                    if (Platform.OS === 'android') {
                                        Linking.openURL('android.settings.LOCATION_SOURCE_SETTINGS');
                                    } else {
                                        Linking.openURL('app-settings:');
                                    }
                                }}
                                style={[styles.button, styles.openButton]}
                            >
                                <Text style={styles.openText} onPress={() => { openSettings() }}>Open Settings</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {loading && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999,
                    }}
                >
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', marginTop: 10 }}>Loading...</Text>
                </View>
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    //       container: {
    //     flex: 1,
    //     paddingTop: 50, // adjust based on header/tab
    //     backgroundColor: '#fff',
    //   },
    paddingBottom: {
        paddingBottom: 85
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#fff',
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#3086F2',
        borderRadius: 10,
        paddingVertical: 20,
        paddingHorizontal: 15,
        marginTop: 20,
    },
    section: {
        alignItems: 'left',
        flex: 1,
    },
    label: {
        fontFamily: 'Montserrat-Medium',
        color: 'white',
        fontSize: 16,
    },
    value: {
        fontFamily: 'Montserrat-Medium',
        color: 'white',
        fontSize: 14,
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: '100%',
        backgroundColor: 'white',
        marginHorizontal: 10,
    },
    swipeContainer: {
        marginTop: 30,
        width: '92%',
        marginHorizontal: "auto",
    },
    swipeText: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 14,
        color: '#fff',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0C0D36',
        marginBottom: 12,
    },
    modalText: {
        fontSize: 14,
        color: '#444',
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginLeft: 10,
    },
    cancelButton: {
        backgroundColor: '#ccc',
    },
    openButton: {
        backgroundColor: '#2F81F5',
    },
    cancelText: {
        color: '#333',
    },
    openText: {
        color: '#fff',
    },
})

export default Attendance
