import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../Services/auth_service';

const COLORS = {
    blue: '#2563EB',
    blueDark: '#1747B7',
    navy: '#14243F',
    muted: '#66758E',
    border: '#DDE5F0',
    white: '#FFFFFF',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function apiMessage(response, fallback) {
    const message = response?.message ?? response?.error?.message;
    return typeof message === 'string' && message.trim() ? message : fallback;
}

function Password() {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newPasswordVisible, setNewPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [newPasswordFocused, setNewPasswordFocused] = useState(false);
    const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
    const [step, setStep] = useState('email');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [focused, setFocused] = useState(false);
    const confirmPasswordRef = useRef(null);

    const sendOtp = async address => {
        if (busy) return;
        const normalizedEmail = address.trim();
        if (!emailPattern.test(normalizedEmail)) {
            setError('Please enter a valid email address.');
            return;
        }

        setBusy(true);
        setError('');
        try {
            const response = await AuthService.requestOtp({ email: normalizedEmail });
            if (response?.success === false || response?.status === false || response?.status === 0) {
                setError(apiMessage(response, 'Could not send the OTP. Please try again.'));
                return;
            }
            setUserEmail(normalizedEmail);
            setOtp('');
            setStep('otp');
        } catch (requestError) {
            setError(apiMessage(requestError?.response?.data, 'Could not send the OTP. Please try again.'));
        } finally {
            setBusy(false);
        }
    };

    const verifyOtp = async () => {
        if (busy) return;
        const code = otp.trim();
        if (!/^\d+$/.test(code)) {
            setError('Please enter the numeric OTP sent to your email.');
            return;
        }

        setBusy(true);
        setError('');
        try {
            const response = await AuthService.verifyOTP({ email: userEmail, otp: code });
            if (response?.success === false || response?.status === false || response?.status === 0) {
                setError(apiMessage(response, 'The OTP is invalid or expired. Please try again.'));
                return;
            }
            setOtp('');
            setStep('reset');
        } catch (requestError) {
            setError(apiMessage(requestError?.response?.data, 'The OTP is invalid or expired. Please try again.'));
        } finally {
            setBusy(false);
        }
    };

    const updatePassword = async () => {
        if (busy) return;
        if (!newPassword.trim()) {
            setError('Please enter a new password.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Your new password must be at least 8 characters.');
            return;
        }
        if (!confirmPassword) {
            setError('Please confirm your new password.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('The passwords do not match.');
            return;
        }

        setBusy(true);
        setError('');
        try {
            const response = await AuthService.updatePassword({
                email: userEmail,
                password: newPassword,
            });
            if (response?.success === false || response?.status === false || response?.status === 0) {
                setError(apiMessage(response, 'Could not update your password. Please try again.'));
                return;
            }
            setNewPassword('');
            setConfirmPassword('');
            setStep('complete');
        } catch (requestError) {
            setError(apiMessage(requestError?.response?.data, 'Could not update your password. Please try again.'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.blueDark} />
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
                    <View style={styles.hero}>
                        <View style={styles.circleLarge} />
                        <View style={styles.circleSmall} />
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                            accessibilityRole="button"
                            accessibilityLabel="Back to sign in">
                            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
                        </TouchableOpacity>
                        <View style={styles.heroIcon}>
                            <Ionicons name={step === 'complete' ? 'checkmark-circle-outline' : 'key-outline'} size={28} color={COLORS.white} />
                        </View>
                        <Text style={styles.heroTitle}>Forgot password?</Text>
                        <Text style={styles.heroSubtitle}>Let's get you back into your account.</Text>
                    </View>

                    <View style={styles.formSection}>
                        <View style={styles.formContent}>
                            {step === 'email' && (
                                <>
                                    <Text style={styles.formTitle}>Reset your password</Text>
                                    <Text style={styles.description}>
                                        Enter your registered email address and we'll send you a verification code.
                                    </Text>
                                    <Text style={styles.label}>Email address</Text>
                                    <View style={[styles.inputWrapper, focused && styles.inputFocused]}>
                                        <Ionicons name="mail-outline" size={21} color={focused ? COLORS.blue : COLORS.muted} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="name@example.com"
                                            placeholderTextColor="#9AA7B9"
                                            keyboardType="email-address"
                                            textContentType="emailAddress"
                                            autoComplete="email"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            returnKeyType="send"
                                            onSubmitEditing={() => sendOtp(email)}
                                            value={email}
                                            onChangeText={setEmail}
                                            onFocus={() => setFocused(true)}
                                            onBlur={() => setFocused(false)}
                                            accessibilityLabel="Email address"
                                        />
                                    </View>
                                    {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
                                    <TouchableOpacity
                                        style={[styles.primaryButton, busy && styles.disabledButton]}
                                        onPress={() => sendOtp(email)}
                                        disabled={busy}
                                        accessibilityRole="button">
                                        {busy ? <ActivityIndicator color={COLORS.white} /> : (
                                            <><Text style={styles.primaryText}>Send OTP</Text><Ionicons name="arrow-forward" size={20} color={COLORS.white} /></>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}

                            {step === 'otp' && (
                                <>
                                    <Text style={styles.formTitle}>Verify your email</Text>
                                    <Text style={styles.description}>Enter the OTP sent to <Text style={styles.emphasized}>{userEmail}</Text>.</Text>
                                    <Text style={styles.label}>Verification code</Text>
                                    <View style={[styles.inputWrapper, focused && styles.inputFocused]}>
                                        <Ionicons name="keypad-outline" size={21} color={focused ? COLORS.blue : COLORS.muted} />
                                        <TextInput
                                            style={[styles.input, styles.otpInput]}
                                            placeholder="Enter OTP"
                                            placeholderTextColor="#9AA7B9"
                                            keyboardType="number-pad"
                                            textContentType="oneTimeCode"
                                            autoComplete="one-time-code"
                                            value={otp}
                                            onChangeText={value => setOtp(value.replace(/[^0-9]/g, ''))}
                                            onFocus={() => setFocused(true)}
                                            onBlur={() => setFocused(false)}
                                            accessibilityLabel="Verification code"
                                        />
                                    </View>
                                    {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
                                    <TouchableOpacity
                                        style={[styles.primaryButton, busy && styles.disabledButton]}
                                        onPress={verifyOtp}
                                        disabled={busy}
                                        accessibilityRole="button">
                                        {busy ? <ActivityIndicator color={COLORS.white} /> : (
                                            <><Text style={styles.primaryText}>Verify OTP</Text><Ionicons name="arrow-forward" size={20} color={COLORS.white} /></>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.secondaryButton}
                                        onPress={() => sendOtp(userEmail)}
                                        disabled={busy}
                                        accessibilityRole="button">
                                        <Text style={styles.secondaryText}>Resend OTP</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.changeEmailButton}
                                        onPress={() => { setStep('email'); setOtp(''); setError(''); setFocused(false); }}
                                        disabled={busy}
                                        accessibilityRole="button">
                                        <Text style={styles.changeEmailText}>Use a different email</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {step === 'reset' && (
                                <>
                                    <Text style={styles.formTitle}>Create a new password</Text>
                                    <Text style={styles.description}>Your email is verified. Choose a new password for your account.</Text>

                                    <Text style={styles.label}>New password</Text>
                                    <View style={[styles.inputWrapper, newPasswordFocused && styles.inputFocused]}>
                                        <Ionicons name="lock-closed-outline" size={21} color={newPasswordFocused ? COLORS.blue : COLORS.muted} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="At least 8 characters"
                                            placeholderTextColor="#9AA7B9"
                                            secureTextEntry={!newPasswordVisible}
                                            textContentType="newPassword"
                                            autoComplete="new-password"
                                            autoCapitalize="none"
                                            returnKeyType="next"
                                            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                                            value={newPassword}
                                            onChangeText={value => { setNewPassword(value); setError(''); }}
                                            onFocus={() => setNewPasswordFocused(true)}
                                            onBlur={() => setNewPasswordFocused(false)}
                                            accessibilityLabel="New password"
                                        />
                                        <TouchableOpacity
                                            style={styles.visibilityButton}
                                            onPress={() => setNewPasswordVisible(visible => !visible)}
                                            accessibilityRole="button"
                                            accessibilityLabel={newPasswordVisible ? 'Hide new password' : 'Show new password'}>
                                            <Ionicons name={newPasswordVisible ? 'eye-outline' : 'eye-off-outline'} size={22} color={COLORS.muted} />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={[styles.label, styles.confirmLabel]}>Confirm new password</Text>
                                    <View style={[styles.inputWrapper, confirmPasswordFocused && styles.inputFocused]}>
                                        <Ionicons name="lock-closed-outline" size={21} color={confirmPasswordFocused ? COLORS.blue : COLORS.muted} />
                                        <TextInput
                                            ref={confirmPasswordRef}
                                            style={styles.input}
                                            placeholder="Re-enter your password"
                                            placeholderTextColor="#9AA7B9"
                                            secureTextEntry={!confirmPasswordVisible}
                                            textContentType="newPassword"
                                            autoComplete="new-password"
                                            autoCapitalize="none"
                                            returnKeyType="done"
                                            onSubmitEditing={updatePassword}
                                            value={confirmPassword}
                                            onChangeText={value => { setConfirmPassword(value); setError(''); }}
                                            onFocus={() => setConfirmPasswordFocused(true)}
                                            onBlur={() => setConfirmPasswordFocused(false)}
                                            accessibilityLabel="Confirm new password"
                                        />
                                        <TouchableOpacity
                                            style={styles.visibilityButton}
                                            onPress={() => setConfirmPasswordVisible(visible => !visible)}
                                            accessibilityRole="button"
                                            accessibilityLabel={confirmPasswordVisible ? 'Hide confirmation password' : 'Show confirmation password'}>
                                            <Ionicons name={confirmPasswordVisible ? 'eye-outline' : 'eye-off-outline'} size={22} color={COLORS.muted} />
                                        </TouchableOpacity>
                                    </View>
                                    {!!confirmPassword && newPassword !== confirmPassword && !error && (
                                        <Text style={styles.error}>The passwords do not match.</Text>
                                    )}
                                    {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
                                    <TouchableOpacity
                                        style={[styles.primaryButton, busy && styles.disabledButton]}
                                        onPress={updatePassword}
                                        disabled={busy}
                                        accessibilityRole="button">
                                        {busy ? <ActivityIndicator color={COLORS.white} /> : (
                                            <><Text style={styles.primaryText}>Update password</Text><Ionicons name="arrow-forward" size={20} color={COLORS.white} /></>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}

                            {step === 'complete' && (
                                <View style={styles.successContainer}>
                                    <View style={styles.successIcon}>
                                        <Ionicons name="checkmark-circle" size={45} color={COLORS.blue} />
                                    </View>
                                    <Text style={styles.successTitle}>Password updated</Text>
                                    <Text style={styles.successDescription}>
                                        Your password has been changed. You can now sign in with your new password.
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.primaryButton}
                                        onPress={() => navigation.goBack()}
                                        accessibilityRole="button">
                                        <Text style={styles.primaryText}>Back to login</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.blue },
    keyboardView: { flex: 1 },
    scrollView: { flex: 1, backgroundColor: COLORS.white },
    scrollContent: { flexGrow: 1, backgroundColor: COLORS.white },
    hero: {
        minHeight: 275, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 56,
        backgroundColor: COLORS.blue, overflow: 'hidden',
    },
    circleLarge: {
        position: 'absolute', width: 230, height: 230, borderRadius: 115,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.17)', right: -81, top: -94,
    },
    circleSmall: {
        position: 'absolute', width: 146, height: 146, borderRadius: 73,
        backgroundColor: 'rgba(255,255,255,0.07)', right: -54, bottom: -55,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.17)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    },
    heroIcon: {
        width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    },
    heroTitle: {
        color: COLORS.white, fontFamily: 'Montserrat-SemiBold', fontSize: 27,
        lineHeight: 35, marginBottom: 7,
    },
    heroSubtitle: { color: '#E2EDFF', fontFamily: 'Montserrat-Medium', fontSize: 14, lineHeight: 21 },
    formSection: {
        flexGrow: 1, marginTop: -28, backgroundColor: COLORS.white,
        borderTopLeftRadius: 30, borderTopRightRadius: 30,
    },
    formContent: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 26, paddingTop: 35, paddingBottom: 35 },
    formTitle: { color: COLORS.navy, fontFamily: 'Montserrat-SemiBold', fontSize: 24, marginBottom: 9 },
    description: { color: COLORS.muted, fontFamily: 'Montserrat-Medium', fontSize: 13, lineHeight: 21, marginBottom: 32 },
    emphasized: { color: COLORS.navy, fontFamily: 'Montserrat-SemiBold' },
    label: { color: COLORS.navy, fontFamily: 'Montserrat-SemiBold', fontSize: 13, marginBottom: 10 },
    inputWrapper: {
        minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 12,
        borderWidth: 1, borderColor: COLORS.border, borderRadius: 15, backgroundColor: '#F8FAFD',
    },
    inputFocused: { borderColor: COLORS.blue, backgroundColor: COLORS.white },
    input: {
        flex: 1, minWidth: 0, height: 54, marginLeft: 12, paddingVertical: 0,
        color: COLORS.navy, fontFamily: 'Montserrat-Medium', fontSize: 14,
    },
    otpInput: { letterSpacing: 2 },
    confirmLabel: { marginTop: 23 },
    visibilityButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    error: { color: '#C43145', fontFamily: 'Montserrat-Medium', fontSize: 12, lineHeight: 18, marginTop: 10 },
    primaryButton: {
        minHeight: 56, borderRadius: 15, backgroundColor: COLORS.blue,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        marginTop: 24, padding: 20, elevation: 3, shadowColor: COLORS.blueDark,
        shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
    },
    disabledButton: { opacity: 0.7 },
    primaryText: { color: COLORS.white, fontFamily: 'Montserrat-SemiBold', fontSize: 16 },
    secondaryButton: { alignItems: 'center', paddingVertical: 15, marginTop: 10 },
    secondaryText: { color: COLORS.blue, fontFamily: 'Montserrat-SemiBold', fontSize: 13 },
    changeEmailButton: { alignItems: 'center', paddingVertical: 12 },
    changeEmailText: { color: COLORS.muted, fontFamily: 'Montserrat-Medium', fontSize: 13 },
    successContainer: { alignItems: 'center', paddingTop: 10 },
    successIcon: {
        width: 76, height: 76, borderRadius: 24, backgroundColor: '#EFF6FF',
        alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    successTitle: { color: COLORS.navy, fontFamily: 'Montserrat-SemiBold', fontSize: 23, marginBottom: 8 },
    successDescription: { color: COLORS.muted, fontFamily: 'Montserrat-Medium', fontSize: 13, textAlign: 'center', lineHeight: 21 },
});

export default Password;
