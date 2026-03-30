import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    StyleSheet, View, Text, Alert, TouchableOpacity, Image, Button, ScrollView, Modal, TextInput, Platform, PermissionsAndroid, FlatList, Linking, RefreshControl
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
import { Vibration } from 'react-native';

import { lightTheme } from '../GlobalStyles';

import {
    useLocationTracker,
    getCurrentDeviceLocation,
    getLocationErrorMessage,
} from '../Services/geolocation-service.jsx';


// import RNAndroidLocationEnabler from 'react-native-location-enabler';

// import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';
// const { PRIORITIES: { HIGH_ACCURACY }, useLocationSettings } = RNAndroidLocationEnabler;
import TaskScreen from '../Task-management/Task-Screen/Task-Screen.jsx';
import ShimmerSwipeText from './ShimmerSwipeText';
// import { useLocationTracker } from '../Services/geolocation-service.jsx'



const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};

export default function Home({ navigation }) {
    const swipeRef = useRef(null);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [userName, setUserName] = useState("");

    const [checkInTime, setCheckInTime] = useState(null);
    const [workingDuration, setWorkingDuration] = useState(null);

    const timerRef = useRef(null);
    const [checkInTimeDisplay, setCheckInTimeDisplay] = useState(null);
    const [displayTime, setDisplayTime] = useState(null);

    const { showAlertModal, hideAlert } = useGlobalAlert();
    const [userInfo, setUserInfo] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPages, setFilteredPages] = useState([]);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [token, setToken] = useState(null);
    const [empId, setEmpId] = useState(null);
    const [taskId, setTaskId] = useState(null);


    const pages = [
        // { id: '1', name: 'Profile', link: 'Profile' },
        // { id: '2', name: 'Assigned', link: 'Assigned' },
        // { id: '3', name: 'Accepted', link: 'Accepted' },
        // { id: '4', name: 'In Progress', link: 'In Progress' }, 
        // { id: '5', name: 'Collected', link: 'Collected' },
        // { id: '6', name: 'Completed', link: 'Completed' },
        // { id: '1', name: 'TaskScreen', link: 'TaskScreen' },
        { id: '1', name: 'Notification', link: 'Notification' },
        { id: '2', name: 'Attendance', link: 'Attendance' },
        { id: '3', name: 'Receipt', link: 'Receipt' },
        { id: '4', name: 'Profile', link: 'Profile' },
        // { id: '10', name: 'Rejected Task', link: 'Rejected Task' },
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

    }, [navigation])


    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem("user_id");
                const storedToken =
                    (await AsyncStorage.getItem("token")) ||
                    (await AsyncStorage.getItem("jwt_token"));

                if (storedUserId) {
                    setEmpId(Number(storedUserId));
                }

                if (storedToken) {
                    setToken(storedToken);
                }
            } catch (error) {
                console.error("Error loading user data:", error);
            }
        };

        loadUser();
    }, []);

    // const storedId = AsyncStorage.getItem("user_id");

    useLocationTracker(empId, null, token);



    // useEffect(() => {
    //     const subscription = AppState.addEventListener('change', (nextState) => {
    //         if (nextState === 'active') {
    //             // App came back from background — re-check location
    //             getCurrentLocation();
    //         }
    //     });

    //     return () => subscription.remove();
    // }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            // await your data fetching function
            // await getCurrentLocation();
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    };

    const getAttendanceKeys = (userId) => ({
        isCheckedIn: `isCheckedIn_${userId}`,
        checkInTime: `checkInTime_${userId}`,
        checkInTimeDisplay: `checkInTimeDisplay_${userId}`,
    });

    const resetAttendanceState = () => {
        setIsCheckedIn(false);
        setCheckInTime(null);
        setCheckInTimeDisplay(null);
        setWorkingDuration("00:00");
        setDisplayTime(null);
        clearInterval(timerRef.current);
    };



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
                try {
                    const storedName = await AsyncStorage.getItem("user_name");
                    const storedUserId = await AsyncStorage.getItem("user_id");

                    if (storedName) setUserName(storedName);

                    if (!storedUserId) {
                        resetAttendanceState();
                        return;
                    }

                    const attendanceKeys = getAttendanceKeys(storedUserId);

                    const isChecked = await AsyncStorage.getItem(attendanceKeys.isCheckedIn);
                    const checkInStr = await AsyncStorage.getItem(attendanceKeys.checkInTime);
                    const displayTime = await AsyncStorage.getItem(attendanceKeys.checkInTimeDisplay);

                    if (isChecked === 'true' && checkInStr) {
                        setIsCheckedIn(true);
                        setCheckInTime(checkInStr);
                        setCheckInTimeDisplay(displayTime);
                        setDisplayTime(getTimeAgo(checkInStr));

                        const parsedCheckIn = new Date(checkInStr);
                        startTimer(parsedCheckIn);
                    } else {
                        resetAttendanceState();
                    }
                } catch (error) {
                    console.error('Attendance init error:', error);
                    resetAttendanceState();
                }
            };



            init();
            fetchProfilePicture();

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

    useEffect(() => {
        return () => {
            clearInterval(timerRef.current);
        };
    }, []);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSwipe = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            const { latitude, longitude } = await getCurrentDeviceLocation();

            const userId = await AsyncStorage.getItem("user_id");
            const attendanceKeys = getAttendanceKeys(userId);

            if (!userId) {
                Alert.alert("Error", "User not found. Please login again.");
                return;
            }

            const request = {
                employeeId: Number(userId),
                loginDate: new Date().toISOString().split("T")[0],
                latitude: String(latitude),
                longitude: String(longitude),
            };

            if (!isCheckedIn) {
                const response = await AuthService.attendanceCheckIn(request);

                if (response?.status === 1) {
                    const now = new Date();
                    const isoString = now.toISOString();
                    const formattedTime = now.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    });

                    const attendanceKeys = getAttendanceKeys(userId);

                    await AsyncStorage.multiSet([
                        [attendanceKeys.isCheckedIn, "true"],
                        [attendanceKeys.checkInTime, isoString],
                        [attendanceKeys.checkInTimeDisplay, formattedTime],
                    ]);

                    setIsCheckedIn(true);
                    setCheckInTime(isoString);
                    setCheckInTimeDisplay(formattedTime);
                    setDisplayTime(getTimeAgo(isoString));
                    startTimer(now);

                    Vibration.vibrate(300);
                    showAlertModal("✅ Checked In Successfully", false);
                } else {
                    showAlertModal("❌ Check-in failed. Try again.", true);
                }
            } else {
                const response = await AuthService.attendanceCheckOut(request);

                if (response?.status === 1) {
                    // await AsyncStorage.multiRemove([
                    //     "isCheckedIn",
                    //     "checkInTime",
                    //     "checkInTimeDisplay",
                    // ]);



                    const attendanceKeys = getAttendanceKeys(userId);

                    await AsyncStorage.multiRemove([
                        attendanceKeys.isCheckedIn,
                        attendanceKeys.checkInTime,
                        attendanceKeys.checkInTimeDisplay,
                    ]);

                    setIsCheckedIn(false);
                    setCheckInTime(null);
                    setCheckInTimeDisplay(null);
                    setWorkingDuration("00:00");
                    clearInterval(timerRef.current);
                    resetAttendanceState();
                    swipeRef.current?.reset();

                    Vibration.vibrate(300);
                    showAlertModal("✅ Checked Out Successfully", false);
                } else {
                    showAlertModal("❌ Check-out failed. Try again.", true);
                }
            }

            setTimeout(hideAlert, 3000);
        } catch (error) {
            console.error("Swipe location/attendance error:", error);

            const message = getLocationErrorMessage(error);

            if (
                message === "Permission denied"
            ) {
                Alert.alert(
                    "Permission Required",
                    "Location permission is required to check in or check out."
                );
            } else if (
                message === "Location request timed out"
            ) {
                Alert.alert(
                    "Location Timeout",
                    "Unable to fetch location. Please move to an open area and try again."
                );
            } else if (
                message === "Location unavailable / GPS off" ||
                message === "Location settings are not satisfied"
            ) {
                Alert.alert(
                    "GPS Required",
                    "Please enable GPS/location services and try again."
                );
            } else if (
                message === "Google Play Services not available"
            ) {
                Alert.alert(
                    "Google Play Services Error",
                    "Google Play Services is not available on this device."
                );
            } else {
                Alert.alert("Error", message || "Something went wrong. Please try again.");
            }
        } finally {
            swipeRef.current?.reset();
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            const storedUserId = await AsyncStorage.getItem("user_id");

            if (storedUserId) {
                setEmpId(Number(storedUserId));
            }
        };

        loadUser();
    }, []);



    useLocationTracker(empId, null, token);


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
                    source={require('../../assets/rightarrow.png')}
                    style={{
                        width: 16,
                        height: 16,
                        objectFit: 'contain',
                        // tintColor: 'green',
                    }}
                />
            </TouchableOpacity>
        )
    };

    const checkAttendanceBeforeNavigate = () => {
        console.log('checkAttendanceBeforeNavigate', isCheckedIn)
        if (!isCheckedIn) {
            Vibration.vibrate(200);

            Alert.alert(
                "Attendance Required",
                "Please check-in before accessing this feature."
            );
            return false;
        }
        return true;
    };


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }>

                {/* App Header */}
                <Header navigation={navigation} profileImage={userInfo?.employeePhoto} />

                <View style={{ position: 'relative', marginTop: 30, }}>
                    <TextInput
                        style={{ fontSize: 14, fontFamily: 'Montserrat-Medium', height: 50, backgroundColor: '#F6FAFF', borderRadius: 30, paddingLeft: 20, paddingRight: 50, }}
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
                                    fontFamily: 'Montserrat-Medium',
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
                        <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 15, color: '#3085FE', }}>Manage Attendance</Text>
                        {/* <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 12, lineHeight: 14, color: '#0C0D36', }}>Updated {displayTime}</Text> */}
                    </View>
                    {/* <TouchableOpacity onPress={() => navigation.navigate("TestLocation")}>
                        <Text style={{ color: "blue", fontSize: 18 }}>
                            Go to Location Test
                        </Text>
                    </TouchableOpacity> */}
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
                                    {checkInTimeDisplay ?? '00:00'}
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
                                    {workingDuration ?? '00:00'}
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

                    {/* <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Button title="Enable Location" onPress={handleEnableLocation} />
                    </View> */}

                </View>

                <View style={{ paddingTop: 20, marginBottom: 90, }}>
                    {/* <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 15, color: '#3085FE', paddingBottom: 20, }}>My Shortcuts</Text> */}
                    <View style={{ backgroundColor: '#F6FAFF', borderRadius: 40, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, }}>
                        <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 15, color: '#3085FE', paddingBottom: 20, }}>My Shortcuts</Text>

                        <TouchableOpacity style={[styles.box, { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 15, marginBottom: 12, }]}
                            onPress={() => navigation.navigate("TaskStack", { screen: "TaskScreen" })}>
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', }}>
                                <View style={{ width: 34, }}>
                                    <Image style={{ width: 34, height: 34, }} source={require('../../assets/task1.png')} />
                                </View>
                                <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 18, color: '#0C0D36', flex: 1, paddingLeft: 9, }}>My Tasks</Text>
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
                                        fontFamily: 'Montserrat-Medium',
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
                        <TouchableOpacity onPress={() => {
                            if (!checkAttendanceBeforeNavigate()) return;
                            navigation.navigate('Receipt');
                        }} style={[styles.box, { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 15, marginBottom: 12, }]}>
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', }}>
                                <View style={{ width: 34, }}>
                                    <Image style={{ width: 34, height: 34, }} source={require('../../assets/task3.png')} />
                                </View>
                                <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 18, color: '#0C0D36', flex: 1, paddingLeft: 9, }}>Generate Receipt</Text>
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
                                <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 18, color: '#0C0D36', flex: 1, paddingLeft: 9, }}>My Wallet</Text>
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