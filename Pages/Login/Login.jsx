import React, { useEffect, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../Services/auth_service';
import { useGlobalAlert } from '../../Context/GlobalAlertContext';
import CustomAlert from '../Components/CustomAlert'





const COLORS = {
  blue: '#2563EB',
  blueDark: '#1747B7',
  bluePale: '#EFF6FF',
  navy: '#14243F',
  muted: '#66758E',
  border: '#DDE5F0',
  white: '#FFFFFF',
};

function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const { showAlertModal, hideAlert } = useGlobalAlert();


  const [alertVisible, setAlertVisible] = useState(false);

  const [alertData, setAlertData] = useState({
    type: 'success',
    title: '',
    message: '',
  });

  const showAlert = (type, title, message) => {
    setAlertData({
      type,
      title,
      message,
    });

    setAlertVisible(true);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        await AsyncStorage.setItem('hasSeenWelcome', 'false');
        if (token) {
          setUserToken(token);
          navigation.replace('MainApp', { screen: 'Home' });
        } else {
          console.log('else Token from AsyncStorage:', token);
        }
      } catch (error) {
        console.error('Error checking token:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigation]);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert(
        'warning',
        'Required',
        'Please enter both email and password.',
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert(
        'warning',
        'Required',
        'Please enter a valid email address.',
      );
      return;
    }

    setLoginLoading(true);

    try {
      const userData = {
        email: email,
        user_pass: password,
      };

      const response = await AuthService.empLogin(userData);
      if (response?.access_token) {
        await AsyncStorage.setItem('token', response.access_token);
        await AsyncStorage.setItem('user_id', response.employee?.id?.toString() || '');
        await AsyncStorage.setItem('user_name', response.employee?.employee_name || '');
        await AsyncStorage.setItem('user_email', response.employee?.email_id || '');

        navigation.replace('MainApp', { screen: 'Home' });
        showAlert(
          'warning',
          'Success',
          'Login Successful!',
        );
        setTimeout(() => {
          hideAlert();
        }, 1500);
      } else {
        showAlert(
          'warning',
          'Failed',
          'Invalid email or password.',
        );
      }
    } catch (error) {
      console.error('Login Error:', error);
      // showAlertModal('Login FailedInvalid email or password. Please check your credentials and try again.', true);
      showAlert(
        'error',
        'Failed',
        'Login FailedInvalid email or password. Please check your credentials and try again.',
      );
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.blue} />
      </View>
    );
  }

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
            <View style={styles.heroCircleLarge} />
            <View style={styles.heroCircleSmall} />
            <View style={styles.brandMark}>
              <Ionicons name="shield-checkmark-outline" size={26} color={COLORS.white} />
            </View>
            <Text style={styles.heroEyebrow}>WELCOME BACK</Text>
            <Text style={styles.heroTitle}>Good to see you again.</Text>
            <Text style={styles.heroSubtitle}>Sign in to access your account.</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.formContent}>
              <Text style={styles.formTitle}>Sign in</Text>
              <Text style={styles.formSubtitle}>Enter your details to continue.</Text>

              <Text style={styles.label}>Email address</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputFocused]}>
                <Ionicons name="mail-outline" size={21} color={emailFocused ? COLORS.blue : COLORS.muted} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#9AA7B9"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  accessibilityLabel="Email address"
                />
              </View>

              <Text style={[styles.label, styles.passwordLabel]}>Password</Text>
              <View style={[styles.inputWrapper, passwordFocused && styles.inputFocused]}>
                <Ionicons name="lock-closed-outline" size={21} color={passwordFocused ? COLORS.blue : COLORS.muted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9AA7B9"
                  secureTextEntry={!isPasswordVisible}
                  textContentType="password"
                  autoComplete="password"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  onPress={togglePasswordVisibility}
                  style={styles.visibilityButton}
                  accessibilityRole="button"
                  accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}>
                  <Ionicons name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'} size={22} color={COLORS.muted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => navigation.navigate('Password')}
                accessibilityRole="button">
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, loginLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loginLoading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Sign in">
                {loginLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                    <>
                      <Text style={styles.loginText}>Sign in</Text>
                      <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                    </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        type={alertData.type}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.blue },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1, backgroundColor: COLORS.white },
  scrollContent: { flexGrow: 1, backgroundColor: COLORS.white },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  hero: {
    minHeight: 275,
    paddingHorizontal: 28,
    paddingTop: 29,
    paddingBottom: 56,
    backgroundColor: COLORS.blue,
    overflow: 'hidden',
  },
  heroCircleLarge: {
    position: 'absolute', width: 230, height: 230, borderRadius: 115,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.17)', right: -81, top: -94,
  },
  heroCircleSmall: {
    position: 'absolute', width: 146, height: 146, borderRadius: 73,
    backgroundColor: 'rgba(255,255,255,0.07)', right: -54, bottom: -55,
  },
  brandMark: {
    width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 25,
  },
  heroEyebrow: {
    color: '#DCEAFF', fontFamily: 'Montserrat-SemiBold', fontSize: 11,
    letterSpacing: 2.2, marginBottom: 9,
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
  formContent: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 26, paddingTop: 34, paddingBottom: 35 },
  formTitle: { color: COLORS.navy, fontFamily: 'Montserrat-SemiBold', fontSize: 25, marginBottom: 5 },
  formSubtitle: { color: COLORS.muted, fontFamily: 'Montserrat-Medium', fontSize: 13, marginBottom: 31 },
  label: { color: COLORS.navy, fontFamily: 'Montserrat-SemiBold', fontSize: 13, marginBottom: 10 },
  passwordLabel: { marginTop: 23 },
  inputWrapper: {
    minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingLeft: 16,
    paddingRight: 6, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 15, backgroundColor: '#F8FAFD',
  },
  inputFocused: { borderColor: COLORS.blue, backgroundColor: COLORS.white },
  input: {
    flex: 1, minWidth: 0, height: 54, marginLeft: 12, paddingVertical: 0,
    color: COLORS.navy, fontFamily: 'Montserrat-Medium', fontSize: 14,
  },
  visibilityButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  forgotButton: { alignSelf: 'flex-end', paddingVertical: 14, paddingLeft: 16 },
  forgotText: { color: COLORS.blue, fontFamily: 'Montserrat-SemiBold', fontSize: 13 },
  loginButton: {
    minHeight: 56, borderRadius: 15, backgroundColor: COLORS.blue,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 14, elevation: 3,
    shadowColor: COLORS.blueDark, shadowOpacity: 0.16, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginText: { color: COLORS.white, fontFamily: 'Montserrat-SemiBold', fontSize: 16 },
});

export default LoginScreen;
