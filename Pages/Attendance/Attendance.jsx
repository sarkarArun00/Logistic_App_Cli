
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Image, ScrollView, TextInput, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'
// import { useFonts, Montserrat_700Bold, Montserrat_400Regular, Montserrat_500Medium } from '@expo-google-fonts/montserrat'
import RNSwipeVerify from 'react-native-swipe-verify';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import Header from '../Header/header'
import GlobalStyles from '../GlobalStyles';

// import * as Location from 'expo-location';
import AuthService from '../Services/auth_service';
// import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';
import TaskService from '../Services/task_service';

import { Calendar } from 'react-native-calendars';
import { useGlobalAlert } from '../../Context/GlobalAlertContext'



const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};






function Attendance({ navigation }) {
    const swipeRef = useRef(null);
    const [isCheckedIn, setIsCheckedIn] = useState(false);

    const [userName, setUserName] = useState("");
    const [checkInTime, setCheckInTime] = useState(null);
    const [workingDuration, setWorkingDuration] = useState('00:00');

    const timerRef = useRef(null);
    const [checkInTimeDisplay, setCheckInTimeDisplay] = useState(null);
    const [displayTime, setDisplayTime] = useState(null);

    const [markedDates, setMarkedDates] = useState({});
    const [loading, setLoading] = useState(true);
    const { showAlertModal, hideAlert } = useGlobalAlert();
    const { attendance, setAttendanceDetails } = useState([]);
    const [refreshing, setRefreshing] = useState(false);





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

        return () => clearInterval(timerRef.current);


    }, [navigation])


    useFocusEffect(
        useCallback(() => {
            const today = new Date();
            const currentMonthDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
            fetchAttendanceData(currentMonthDate);

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
                    // startAutoCheckoutTimer(parsedCheckIn);   // Auto checkout logic
                } else {
                    setIsCheckedIn(false);
                }
                console.log('Attendance Page Focused', isChecked);
                if (isChecked == null) {
                    setIsCheckedIn(false);
                    setCheckInTime(null);
                    setCheckInTimeDisplay(null);
                    setWorkingDuration('00:00');
                }
            };

            init();
            return () => {
                console.log('Attendance Page Unfocused');
                clearInterval(timerRef.current);
            };
        }, [])
    );

    const fetchAttendanceData = async (monthDate) => {
        try {
            const userId = await AsyncStorage.getItem("user_id");

            const response = await TaskService.getEmpMonthlyShiftRoster({
                employeeId: userId,
                monthDate: monthDate,
            });

            if (response && Array.isArray(response.data?.data)) {
                const uniqueDates = Array.from(
                    new Set(response.data.data.map(item => item.weekDate))
                );

                const dateMarks = {};
                uniqueDates.forEach(date => {
                    dateMarks[date] = {
                        customStyles: {
                            container: {
                                backgroundColor: '#3085FE', // green background
                                borderRadius: 20,           // round shape
                            },
                            text: {
                                color: 'white',
                                fontWeight: 'bold',
                            },
                        },
                    };
                });;

                setMarkedDates(dateMarks);
            } else {
                console.warn("Unexpected API format or empty data:", response);
            }
        } catch (error) {
            showAlertModal('Failed to fetch attendance data:' + error, true);
            sho
        } finally {
            setLoading(false);
        }
    };

    const handleDayPress = async (day) => {
        setMarkedDates(prev => ({
            ...prev,
            [day.dateString]: {
                customStyles: {
                    container: {
                        backgroundColor: '#3085FE',
                        borderRadius: 20,
                    },
                    text: {
                        color: 'white',
                        fontWeight: 'bold',
                    },
                }
            }
        }));

        const userId = await AsyncStorage.getItem("user_id");
        let request = {
            "employeeId": Number(userId),
            "loginDate": day.dateString
        }

        const response = await TaskService.getLoginByDate(request);
        setAttendanceDetails(response)
        console.log('sssssssssssssssssssssssssss 2', response)
        if (response.status == 1) {
            Alert.alert("Attendance Details", `Log In: ${response.data?.loginTime || 'N/A'}\nLog Out: ${response.data?.logoutTime || 'N/A'}\nDuration: ${response.data?.duration?.hours || 0}h ${response.data?.duration?.minutes || 0}m`);
        } else {
            showAlertModal('Failed to fetch attendance details for the selected date.', true);
        }

    };

    const handleMonthChange = (month) => {
        const selectedMonthDate = `${month.year}-${String(month.month).padStart(2, '0')}-01`;
        setLoading(true);
        fetchAttendanceData(selectedMonthDate);
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


    const handleSwipe = async () => {
        const userId = await AsyncStorage.getItem("user_id");
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Vibration.vibrate(500);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            showAlertModal('Permission Denied, Location permission is required.', true);
            swipeRef.current?.reset();
            return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const request = {
            employeeId: userId,
            loginDate: new Date().toISOString().split('T')[0],
            latitude: latitude.toString(),
            longitude: longitude.toString(),
        };

        if (!isCheckedIn) {
            // 👉 Check In Logic
            let response = await AuthService.attendanceCheckIn(request);
            if (response.status == 1) {
                showAlertModal('Checked In, You have successfully checked in.', false);
                const now = new Date();
                const isoString = now.toISOString();
                const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                await AsyncStorage.setItem('isCheckedIn', 'true');
                await AsyncStorage.setItem('checkInTime', isoString);
                await AsyncStorage.setItem('checkInTimeDisplay', formattedTime);

                setCheckInTime(isoString);
                setCheckInTimeDisplay(formattedTime);
                setIsCheckedIn(true);

                startTimer(now);
                // startAutoCheckoutTimer(now);
            } else {
                showAlertModal('Failed to check in, Please try again.', true);
            }
        } else {
            // 👉 Check Out Logic
            let response = await AuthService.attendanceCheckOut(request);
            if (response.status == 1) {
                showAlertModal('Checked Out, You have successfully checked out.', false);
                await AsyncStorage.multiRemove(['isCheckedIn', 'checkInTime', 'checkInTimeDisplay']);

                setIsCheckedIn(false);
                setCheckInTimeDisplay(null);
                setWorkingDuration('00:00');
                clearInterval(timerRef.current);
            } else {
                showAlertModal('Failed to check out, Please try again..', true);
            }
        }

        swipeRef.current?.reset();
    };


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
    //         showAlertModal("Auto Checked Out" + "You have been automatically checked out after 12 hours.");
    //         await AsyncStorage.removeItem('isCheckedIn');
    //         await AsyncStorage.removeItem('checkInTime');
    //         setIsCheckedIn(false);
    //         setWorkingDuration('00:00');
    //         clearInterval(timerRef.current);
    //     } else {
    //         showAlertModal('Failed to auto check out, Please try again.', true);
    //     }
    // };

    // const startAutoCheckoutTimer = (checkInDate) => {
    //     const thirtySecondsInMs = 30 * 1000;

    //     setTimeout(() => {
    //         handleAutoCheckout();
    //     }, thirtySecondsInMs - (new Date() - new Date(checkInDate)));
    // };

    const onRefresh = useCallback(() => {
        setRefreshing(true);

        wait(2000).then(() => setRefreshing(false));
    }, []);


    // const [fontsLoaded] = useFonts({
    //     Montserrat_700Bold,
    //     Montserrat_400Regular,
    //     Montserrat_500Medium,
    // });

    // if (!fontsLoaded) {
    //     return null;
    // }

    if (loading) {
        return (
            <>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#2F81F5" />
                    <Text>Loading...</Text>
                </View>
            </>
        );
    }

    return (
        <SafeAreaView style={[styles.container, GlobalStyles.SafeAreaView]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }>

                {/* App Header */}
                <Header navigation={navigation} />

                <View style={{ position: 'relative', marginTop: 30 }}>
                    <TextInput
                        style={{ fontSize: 14, fontFamily: 'Montserrat_500Medium', height: 50, backgroundColor: '#F6FAFF', borderRadius: 30, paddingLeft: 20, paddingRight: 50, }}
                        placeholder="Search"
                        placeholderTextColor="#0C0D36"
                    />
                    <Image style={{ position: 'absolute', top: 16, right: 20, width: 20, height: 20, }} source={require('../../assets/search.png')} />
                </View>

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

                <View style={styles.container}>
                    {loading && <ActivityIndicator size="large" color="#3085FE" />}
                    <Calendar
                        markedDates={markedDates}
                        markingType="custom"
                        onMonthChange={handleMonthChange}
                        onDayPress={handleDayPress}
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
                        <Text style={styles.value}>09:30 Am</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.section}>
                        <Text style={styles.label}>Log Out</Text>
                        <Text style={styles.value}>09:30 Pm</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.section}>
                        <Text style={styles.label}>Duration</Text>
                        <Text style={styles.value}>{attendance?.duration?.hours || 0}h {attendance?.duration?.minutes || 0}m</Text>
                    </View>
                </View>

            </ScrollView>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    //       container: {
    //     flex: 1,
    //     paddingTop: 50, // adjust based on header/tab
    //     backgroundColor: '#fff',
    //   },
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
        fontFamily: 'Montserrat_500Medium',
        color: 'white',
        fontSize: 16,
    },
    value: {
        fontFamily: 'Montserrat_500Medium',
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
        fontFamily: 'Montserrat_400Regular',
        fontSize: 14,
        color: '#fff',
    },

})

export default Attendance
