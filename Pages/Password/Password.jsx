import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
// import * as Clipboard from 'expo-clipboard';
import { CodeField, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium, Montserrat_400Regular } from '@expo-google-fonts/montserrat';
// import { Ionicons } from '@expo/vector-icons';
import AuthService from '../Services/auth_service';

const CELL_COUNT = 6;

function Password({ navigation }) {
    const [otp, setOtp] = useState('');
    const [screen, setScreen] = useState(1);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [timer, setTimer] = useState(60); // Start with 60 seconds
    const [isTimerActive, setIsTimerActive] = useState(false); // To manage timer state


    const ref = useBlurOnFulfill({ value: otp, cellCount: CELL_COUNT });

    const [props, getCellOnLayoutHandler] = useClearByFocusCell({
        value: otp,
        setValue: setOtp,
    });

    useEffect(() => {
        // const checkClipboard = async () => {
        //     const text = await Clipboard.getStringAsync();
        //     if (text && text.length === CELL_COUNT && /^\d+$/.test(text)) {
        //         setOtp(text);
        //     }
        // };
        // const interval = setInterval(checkClipboard, 1000); // Check clipboard every second
        // return () => clearInterval(interval);

        let interval;
        if (isTimerActive) {
            interval = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(interval);
        }

        return () => clearInterval(interval); // Clean up on unmount
    }, [isTimerActive]);


    useEffect(() => {
        if (screen === 2) {
            startOtpTimer();
        }
    }, [screen]);


    const startOtpTimer = () => {
        setTimer(60);
        setIsTimerActive(true);
    };

    const handleResend = async () => {
        try {
            const response = await AuthService.requestOTP({ email: email });
            console.log('OTP Response:', response); // Log the response data
            if (response.status == 1) {
                Alert.alert('Success', 'OTP has been sent to your email');
                startOtpTimer();
            } else {
                Alert.alert('Error', response.data || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            Alert.alert('Error', 'An unexpected error occurred');
        }

    };

    // const pasteFromClipboard = async () => {
    //     try {
    //         const text = await Clipboard.getStringAsync();
    //         if (text && text.length === CELL_COUNT && /^\d+$/.test(text)) {
    //             setOtp(text);
    //         } else {
    //             Alert.alert('Invalid OTP', 'Clipboard content is not a valid OTP.');
    //         }
    //     } catch (error) {
    //         console.error('Clipboard error:', error);
    //     }
    // };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const handleSendOtp = async () => {
        if (!email) {
            Alert.alert('Sorry', 'Please enter your email address');
            return
        }
        try {
            const response = await AuthService.requestOTP({ email: email });
            console.log('OTP Response:', response); // Log the response data
            if (response.status == 1) {
                Alert.alert('Success', 'OTP has been sent to your email');
                setScreen(2);
                startOtpTimer();
            } else {
                Alert.alert('Error', response.data || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            Alert.alert('Error', 'An unexpected error occurred');
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) {
            Alert.alert('Error', 'Please enter the OTP');
            return;
        }
        try {
            const response = await AuthService.verifyOTP({ email: email, otp: otp });
            console.log('Verify OTP Response:', response); // Log the response data
            if (response.status == 1) {
                const data = await response.data;
                if (otp === data.otp) { // You can simulate success with specific dummy OTP
                    Alert.alert('Success', 'OTP Verified');
                    setScreen(3);
                    startOtpTimer();
                } else {
                    Alert.alert('Invalid OTP', 'Please enter the correct OTP');
                }
            }
        } catch (error) {
            console.error('OTP Verification Error:', error);
            Alert.alert('Error', 'Failed to verify OTP');
        }
    };

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please enter both password fields');
            return;
        }
        else if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            const response = await AuthService.updatePassword({ email: email, password: password });

            if (response.status == 1) {
                Alert.alert('Password Reset', 'Your password has been successfully reset.');
                setScreen(4);
            } else {
                Alert.alert('Error', 'Password reset failed');
            }
        } catch (error) {
            console.error('Reset Password Error:', error);
            Alert.alert('Error', 'An unexpected error occurred');
        }
    };



    let [fontsLoaded] = useFonts({
        Montserrat_600SemiBold,
        Montserrat_500Medium,
        Montserrat_400Regular,
    });

    if (!fontsLoaded) {
        return null;
    }


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {screen === 1 && (
                    <>
                        <TouchableOpacity style={styles.locateBack} onPress={() => navigation.navigate('Login')}>
                            <Image style={[styles.backIcon, { width: 24, height: 16, }]} source={require('../../assets/locate-back.png')} />
                            <Text style={styles.heading}>Forgot Password?</Text>
                        </TouchableOpacity>
                        <View style={styles.passIcon}>
                            <Image style={{ width: 18, height: 24, }} source={require('../../assets/pass1.png')} />
                        </View>
                        <Text style={styles.subText}>No worries! Enter your email address below and we will send you a code to reset password.</Text>
                        <View>
                            <Text style={styles.label}>E-mail</Text>
                            <View style={styles.relDv}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email address"
                                    placeholderTextColor={'rgba(12,13,54,0.5)'}
                                    value={email}
                                    onChangeText={setEmail}
                                />
                                <Image style={{ width: 24, height: 24, position: 'absolute', left: 20, top: 16, }} source={require('../../assets/email2.png')} />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.continueBtn} onPress={handleSendOtp}>
                            <Text style={styles.continueText}>Continue</Text>
                        </TouchableOpacity>
                    </>
                )}

                {screen === 2 && (
                    <>
                        <TouchableOpacity style={styles.locateBack} onPress={() => setScreen(1)}>
                            <Image style={[styles.backIcon, { width: 24, height: 16 }]} source={require('../../assets/locate-back.png')} />
                            <Text style={styles.heading}>Verify OTP</Text>
                        </TouchableOpacity>
                        <View style={styles.passIcon}>
                            <Image style={{ width: 20, height: 15.5 }} source={require('../../assets/pass2.png')} />
                        </View>
                        <Text style={styles.subText}>Code has been sent to <Text style={styles.bold}>johndoe@gmail.com</Text>. Enter the code to verify your account.</Text>

                        <CodeField
                            ref={ref}
                            {...props}
                            value={otp}
                            onChangeText={setOtp}
                            cellCount={CELL_COUNT}
                            rootStyle={styles.otpContainer}
                            keyboardType="number-pad"
                            textContentType="oneTimeCode"
                            renderCell={({ index, symbol, isFocused }) => (
                                <Text
                                    key={index}
                                    style={[styles.cell, isFocused && styles.focusCell]}
                                    onLayout={getCellOnLayoutHandler(index)}>
                                    {symbol || (isFocused ? '|' : '*')}
                                </Text>
                            )}
                        />
                        <TouchableOpacity style={styles.continueBtn} onPress={handleVerifyOtp}>
                            <Text style={styles.continueText}>Verify OTP</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.flexCont} onPress={handleResend}>
                            <Text style={styles.resend}>Didn’t Receive Code?</Text>
                            <Text style={styles.boldText}>Resend Code</Text>
                        </TouchableOpacity>
                        <Text style={styles.timer}>{`Resend code in ${formatTime(timer)}`}</Text>
                    </>
                )}

                {screen === 3 && (
                    <>
                        <TouchableOpacity style={styles.locateBack} onPress={() => setScreen(2)}>
                            <Image style={[styles.backIcon, { width: 24, height: 16 }]} source={require('../../assets/locate-back.png')} />
                            <Text style={styles.heading}>Create New Password</Text>
                        </TouchableOpacity>
                        <View style={styles.passIcon}>
                            <Image style={{ width: 17, height: 20, }} source={require('../../assets/pass3.png')} />
                        </View>
                        <Text style={styles.subText}>Please enter and confirm your new password. You will need to login after you reset.</Text>

                        <View>
                            <Text style={styles.label}>Password</Text>
                            <View style={{ position: 'relative' }}>
                                <TextInput
                                    style={styles.inputBox}
                                    placeholder='Password'
                                    placeholderTextColor={'#0C0D36'}
                                    secureTextEntry={!isPasswordVisible}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                    style={styles.iconContainer}
                                >
                                    <Ionicons
                                        name={isPasswordVisible ? 'eye' : 'eye-off'}
                                        size={24}
                                        color="#0C0D36"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={{ position: 'relative' }}>
                                <TextInput
                                    style={styles.inputBox}
                                    placeholder='Confirm Password'
                                    placeholderTextColor={'#0C0D36'}
                                    secureTextEntry={!isConfirmPasswordVisible}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                                    style={styles.iconContainer}
                                >
                                    <Ionicons
                                        name={isConfirmPasswordVisible ? 'eye' : 'eye-off'}
                                        size={24}
                                        color="#0C0D36"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.continueBtn, styles.resetBtn]} onPress={handleResetPassword}>
                            <Text style={styles.continueText}>Reset Password</Text>
                        </TouchableOpacity>
                    </>
                )}

                {screen === 4 && (
                    <>
                        <Image style={{ width: 62, height: 62, marginHorizontal: 'auto', marginBottom: 20, marginTop: 100, }} source={require('../../assets/pass4.png')} />
                        <Text style={styles.sccText}>Successful</Text>
                        <Text style={styles.congText}>Congratulations! Your password has {"\n"}been changed.</Text>
                        <TouchableOpacity style={styles.continueBtn} onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.continueText}>Login</Text>
                        </TouchableOpacity>
                    </>
                )}


            </ScrollView>
        </SafeAreaView>



    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#fff',
    },
    locateBack: {
        position: 'relative',
        marginBottom: 28,
    },
    backIcon: {
        position: 'absolute',
        left: 0,
        top: 9,
    },
    heading: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 24,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    bold: {
        fontFamily: 'Montserrat-Bold',
        color: '#0C0D36',
    },
    passIcon: {
        width: 48,
        height: 48,
        borderWidth: 1,
        borderColor: '#CFD9E8',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 'auto',
        marginBottom: 28,
    },
    subText: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'center',
        color: 'rgba(12, 13, 54, 0.5)',
        paddingBottom: 24,
    },
    relDv: {
        position: 'relative',
    },
    label: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 14,
        color: '#0C0D36',
        marginBottom: 10,
    },
    input: {
        height: 54,
        borderWidth: 1,
        borderColor: '#ECEDF0',
        backgroundColor: '#FAFAFA',
        borderRadius: 14,
        paddingLeft: 52,
        paddingRight: 15,
    },
    inputBox: {
        fontFamily: 'Montserrat-Regular',
        height: 54,
        borderWidth: 1,
        borderColor: '#ECEDF0',
        backgroundColor: '#FAFAFA',
        borderRadius: 14,
        paddingLeft: 20,
        paddingRight: 55,
        marginBottom: 20,
    },
    continueBtn: {
        backgroundColor: '#2F81F5',
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 20,
    },
    resetBtn: {
        marginTop: 0,
    },
    continueText: {
        fontFamily: 'Montserrat-SemiBold',
        color: '#fff',
        fontSize: 16,
    },
    flexCont: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 20,
        paddingBottom: 10,
    },
    resend: {
        fontFamily: 'Montserrat-Regular',
        color: '#0C0D36',
        fontSize: 14,
        textAlign: 'center',

    },
    boldText: {
        fontFamily: 'Montserrat-SemiBold',
        color: '#3082F8',
        fontSize: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#3082F8',
        marginLeft: 8,
    },
    timer: {
        fontFamily: 'Montserrat-Regular',
        color: '#0C0D36',
        fontSize: 14,
        textAlign: 'center',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cell: {
        borderWidth: 1,
        borderRadius: 10,
        borderColor: '#ECEDF0',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        width: 45,
        height: 45,
        lineHeight: 45,
        textAlign: 'center',
    },
    iconContainer: {
        position: 'absolute',
        right: 17,
        top: 16,
    },
    sccText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 18,
        color: '#0C0D36',
        textAlign: 'center',
        marginBottom: 20,
    },
    congText: {
        fontFamily: 'Montserrat-Regular',
        fontSize: 16,
        color: '#0C0D36',
        textAlign: 'center',
    },


});

export default Password;
