import React, { useEffect, useState } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, Image, StyleSheet, Alert, ScrollView, TouchableOpacity, Modal, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium } from '@expo-google-fonts/montserrat';
// import { Ionicons } from '@expo/vector-icons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AuthService from '../Services/auth_service';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native"; // Import useNavigation
import { useGlobalAlert } from "../../Context/GlobalAlertContext"; // Import GlobalAlertContext






function LoginScreen() {
  const navigation = useNavigation(); // Initialize navigation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Separate focus states
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false); // State for login process

  const { showAlertModal, hideAlert } = useGlobalAlert();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        if (token) {
          setUserToken(token);
          navigation.replace('MainApp', { screen: 'Home' });
        } else {
          // navigation.replace('Login')
          console.log("else Token from AsyncStorage:", token);
        }
      } catch (error) {
        console.error("Error checking token:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigation]); // Add navigation to the dependency array

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // const [fontsLoaded] = useFonts({
  //   Montserrat_600SemiBold,
  //   Montserrat_500Medium,
  // });

  // if (!fontsLoaded) {
  //   return null;
  // }

  const handleLogin = async () => {
    if (!email || !password) {
      showAlertModal('Please enter both email and password.', true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlertModal('Please enter a valid email address.', true);
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
        await AsyncStorage.setItem("token", response.access_token);

        await AsyncStorage.setItem("user_id", response.employee?.id?.toString() || '');
        await AsyncStorage.setItem("user_name", response.employee?.employee_name || '');
        await AsyncStorage.setItem("user_email", response.employee?.email_id || '');

        navigation.replace('MainApp', { screen: 'Home' });

        showAlertModal('Login Successful!', false);
        setTimeout(() => {
          hideAlert();
        }, 3000)
      }
      else {
        showAlertModal('Invalid email or password.', true);
      }
    } catch (error) {
      console.error("Login Error:", error);
      showAlertModal("Login Failed" + "Invalid email or password. Please check your credentials and try again.", true);
    } finally {
      setLoginLoading(false); // End login loading
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3082F8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Image
              style={{ width: 220, height: 169, marginBottom: 10, alignSelf: 'center', }}
              source={require('../../assets/login-img1.png')}
            />

            <View style={{ padding: 15, }}>
              {/* <Text style={styles.title}>Welcome {'\n'}Back!</Text> */}
              <Text style={styles.title}>Welcome Back!</Text>

              {/* Email Input */}
              <View style={styles.inputDv}>
                <TextInput
                  style={[styles.inputContainer, { borderColor: emailFocused ? '#0D0E37' : 'transparent' }]}
                  placeholder="Email Address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor={'#0C0D36'}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
                <Image
                  style={styles.iconImg}
                  source={require('../../assets/emlIcon.png')}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputDv}>
                <TextInput
                  style={[styles.inputContainer, { borderBottomColor: passwordFocused ? '#0D0E37' : 'transparent' }]}
                  placeholder="Password"
                  placeholderTextColor="#0C0D36"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconDv}>
                  <Ionicons
                    name={isPasswordVisible ? 'eye' : 'eye-off'}
                    size={30}
                    color="#0D0E37"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleLogin}
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginText}>Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Password')}>
                <Text style={styles.forgotTitle}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: '#fff',
  },
  title: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 34,
    color: '#3082F8',
    textAlign: 'center',
    marginBottom: 30,
  },
  forgotTitle: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 15,
    color: '#0C0D36',
    textAlign: 'center',
    marginTop: 25,
  },
  loginBtn: {
    backgroundColor: '#2F81F5',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  inputDv: {
    position: 'relative',
    marginBottom: 1,
  },
  inputContainer: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 16,
    height: 60,
    borderBottomWidth: 1,
    paddingLeft: 0,
    paddingRight: 40,
    transition: 'border-color 0.3s',
  },
  iconImg: {
    width: 35,
    height: 32,
    position: 'absolute',
    right: 10,
    top: 15,
  },
  iconDv: {
    position: 'absolute',
    right: 10,
    top: 15,
  }
});

export default LoginScreen;