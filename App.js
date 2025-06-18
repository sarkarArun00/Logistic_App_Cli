
import React, { useEffect } from 'react';

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, StatusBar, Text, PermissionsAndroid, Platform,Alert } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GlobalAlertProvider } from './Context/GlobalAlertContext';
import { AuthProvider } from './Context/AuthContext';
// import Password from './Pages/Password/Password';
import Home from './Pages/Home/Home';
import Login from './Pages/Login/Login';
import Assigned from './Pages/Task-management/Assigned/Assigned';
import Attendance from './Pages/Attendance/Attendance';
import Pending from './Pages/Fuel-voucher/Pending/Pending';
import Wallet from './Pages/Wallet/Wallet';
import Profile from './Pages/Profile/Profile';
// import MapNavigation from './Pages/Task-management/MapNavigation';
import Accepted from './Pages/Task-management/Accepted/Accepted';
import Progress from './Pages/Task-management/Progress/Progress';
import Collected from './Pages/Task-management/Collected/Collected';
import Completed from './Pages/Task-management/Completed/Completed';
import Receipt from './Pages/Receipt/Receipt';
import TrackingScreen from './Pages/Tracking/traking';
import Approved from './Pages/Fuel-voucher/Approved/Approved';
import Processed from './Pages/Fuel-voucher/Processed/Processed';
import Rejected from './Pages/Fuel-voucher/Rejected/Rejected';
import RejectedTask from './Pages/Task-management/Rejected/RejectedTask';
import Receiptview from './Pages/Receipt/Receiptview';
import Notification from './Pages/Notifications/Notification';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SplashScreen from './Pages/Screens/SplashScreen';
import messaging from '@react-native-firebase/messaging';
import Welcome from './Pages/Welcome-pages/Welcome';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
// Create a component for the main tab navigation with Menu bar
function TabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff" // Customize as needed
        translucent={false} // Set to true only if you want content behind status bar
      />
      <Tab.Navigator
  screenOptions={{
    headerShown: false,
    tabBarShowLabel: false,
    tabBarStyle: {
      position: 'absolute',
      bottom: 0,
      height: 80 + insets.bottom,
      paddingBottom: insets.bottom,
      backgroundColor: '#2F81F5',
      borderTopWidth: 0,
      elevation: 2,
      paddingTop: 15,
      margin: 0,
      borderRadius: 20,
      overflow: 'hidden',
    },
  }}
>
  <Tab.Screen
    name="Home"
    component={Home}
    options={{
      tabBarIcon: ({ focused }) => (
        <View style={styles.tabItem}>
          {focused && <View style={styles.afterline} />}
          <Ionicons
            name={focused ? 'home' : 'home-outline'}
            size={22}
            color={focused ? 'rgba(255,255,255,0.5)' : '#FFFFFF'}
          />
          <Text style={[styles.tbstitle, { color: focused ? 'rgba(255,255,255,0.5)' : '#FFFFFF' }]}>
            Home
          </Text>
        </View>
      ),
    }}
  />

  <Tab.Screen
    name="Assigned"
    component={Assigned}
    options={{
      tabBarIcon: ({ focused }) => (
        <View style={styles.tabItem}>
          {focused && <View style={styles.afterline} />}
          <Ionicons
            name={focused ? 'list' : 'list-outline'}
            size={22}
            color={focused ? 'rgba(255,255,255,0.5)' : '#FFFFFF'}
          />
          <Text style={[styles.tbstitle, { color: focused ? 'rgba(255,255,255,0.5)' : '#FFFFFF' }]}>
            Task
          </Text>
        </View>
      ),
    }}
  />

  <Tab.Screen
    name="Attendance"
    component={Attendance}
    options={{
      tabBarIcon: ({ focused }) => (
        <View style={styles.tabItem}>
          {focused && <View style={styles.afterline} />}
          <Ionicons
            name={focused ? 'calendar' : 'calendar-outline'}
            size={22}
            color={focused ? 'rgba(255,255,255,0.5)' : '#FFFFFF'}
          />
          <Text style={[styles.tbstitle, { color: focused ? 'rgba(255,255,255,0.5)' : '#FFFFFF' }]}>
            Attendance
          </Text>
        </View>
      ),
    }}
  />

  <Tab.Screen
    name="Pending"
    component={Pending}
    options={{
      tabBarIcon: ({ focused }) => (
        <View style={styles.tabItem}>
          {focused && <View style={styles.afterline} />}
          <Ionicons
            name={focused ? 'receipt' : 'receipt-outline'}
            size={22}
            color={focused ? 'rgba(255,255,255,0.5)' : '#FFFFFF'}
          />
          <Text style={[styles.tbstitle, { color: focused ? 'rgba(255,255,255,0.5)' : '#FFFFFF' }]}>
            Request
          </Text>
        </View>
      ),
    }}
  />

  <Tab.Screen
    name="Wallet"
    component={Wallet}
    options={{
      tabBarIcon: ({ focused }) => (
        <View style={styles.tabItem}>
          {focused && <View style={styles.afterline} />}
          <Ionicons
            name={focused ? 'wallet' : 'wallet-outline'}
            size={22}
            color={focused ? 'rgba(255,255,255,0.5)' : '#FFFFFF'}
          />
          <Text style={[styles.tbstitle, { color: focused ? 'rgba(255,255,255,0.5)' : '#FFFFFF' }]}>
            Wallet
          </Text>
        </View>
      ),
    }}
  />
</Tab.Navigator>




    </>
  );
}

export default function App() {



  const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission status:', authStatus)
      getFcmToken();
    } else {
      Alert.alert('Push Notification permission denied');
    }


    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission denied');
      }
    }
  };

  const getFcmToken = async () => {
    try {
      const fcmToken = await messaging().getToken();

      if (fcmToken) {
        console.log("Fcm Token", fcmToken);
      } else {
        console.log("Failed to get Fcm token")
      }
    } catch (error) {
      console.error('Error fetching FCM token:', error);
    }
  }

  useEffect(() => {
    requestUserPermission();

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert('New Notification', JSON.stringify(remoteMessage.notification?.body || ""));
    })

    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened from background state:', remoteMessage.notification)
    });

    messaging().getInitialNotification().then(remoteMessage => {
      console.log('Notification caused app to open from quit state:', remoteMessage.notification);
    });

    return unsubscribe;

  },);


  return (
    <GlobalAlertProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="Splash"
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
           <Stack.Screen name="Welcome" component={Welcome} />
            <Stack.Screen name="Login" component={Login} />
            {/* <Stack.Screen name="Password" component={Password} /> */}
            <Stack.Screen name="MainApp" component={TabNavigator} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Assigned" component={Assigned} />
            {/* <Stack.Screen name="MapNavigation" options={{ headerShown: true, title: 'Navigation' }} component={MapNavigation} /> */}
            <Stack.Screen name="Accepted" component={Accepted} />
            <Stack.Screen name="In Progress" component={Progress} />
            <Stack.Screen name="Collected" component={Collected} />
            <Stack.Screen name="Completed" component={Completed} />
            <Stack.Screen name="Receipt" component={Receipt} />
            <Stack.Screen name="Tracking" component={TrackingScreen} />
            <Stack.Screen name="Approved" component={Approved} />
            <Stack.Screen name="Processed" component={Processed} />
            <Stack.Screen name="Rejected" component={Rejected} />
            <Stack.Screen name="Rejected Task" component={RejectedTask} />
            <Stack.Screen name="Receiptview" component={Receiptview} />
            <Stack.Screen name="Notification" component={Notification} />
          </Stack.Navigator>
          <StatusBar style="auto" backgroundColor="#ddd" />
        </NavigationContainer>
      </AuthProvider>
    </GlobalAlertProvider>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    flexDirection:'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop:0,
    marginTop:0,
    width:90,
    position:'relative',
  },
  tbstitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#8F9BB3',
    paddingTop:5,
  },
  afterline: {
    position: 'absolute',
    top:-15,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    zIndex: 2,
  },
  
  // iconUnfocused: {
  //   width:50,
  //   height:50,
  //   backgroundColor: 'transparent',
  //   borderRadius:50,
  //   textAlign:'center',
  //   lineHeight:50,
  // },
  // iconFocused: {
  //   width:50,
  //   height:50,
  //   borderRadius:50,
  //   backgroundColor: '#3085FE',
  //   textAlign:'center',
  //   lineHeight:50,
  // },
  
});


