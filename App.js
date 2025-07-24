import React, {useEffect, useState, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
  PermissionsAndroid,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {GlobalAlertProvider} from './Context/GlobalAlertContext';
import {AuthProvider} from './Context/AuthContext';
import Home from './Pages/Home/Home';
import Login from './Pages/Login/Login';
import Assigned from './Pages/Task-management/Assigned/Assigned';
import Attendance from './Pages/Attendance/Attendance';
import TaskScreen from './Pages/Task-management/Task-Screen/Task-Screen';
import Pending from './Pages/Fuel-voucher/Pending/Pending';
import Wallet from './Pages/Wallet/Wallet';
import Accepted from './Pages/Task-management/Accepted/Accepted';
import Progress from './Pages/Task-management/Progress/Progress';
import SplashScreen from './Pages/Screens/SplashScreen';
import messaging from '@react-native-firebase/messaging';
import Welcome from './Pages/Welcome-pages/Welcome';
import NetInfo from '@react-native-community/netinfo';
import PushNotifiactionModal from './Pages/PushNotificationModal';
import VoucherDetails from './Pages/Fuel-voucher/VoucherDetails';
import Receipt from './Pages/Receipt/Receipt';
import Notification from './Pages/Notifications/Notification';
import TrackingScreen from './Pages/Tracking/traking';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Collected from './Pages/Task-management/Collected/Collected';
import Completed from './Pages/Task-management/Completed/Completed';
import RejectedTask from './Pages/Task-management/Rejected/RejectedTask';
import Profile from './Pages/Profile/Profile';
import Approved from './Pages/Fuel-voucher/Approved/Approved';
import Processed from './Pages/Fuel-voucher/Processed/Processed';
import Rejected from './Pages/Fuel-voucher/Rejected/Rejected';
import Receiptview from './Pages/Receipt/Receiptview';
import {NotificationProvider} from './Context/NotificationContext'

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TaskStack = createNativeStackNavigator();
function TaskStackScreen() {
  return (
    <TaskStack.Navigator screenOptions={{ headerShown: false }}>
      <TaskStack.Screen name="TaskScreen" component={TaskScreen} />
      <TaskStack.Screen name="Assigned" component={Assigned} />
      <TaskStack.Screen name="Accepted" component={Accepted} />
      <TaskStack.Screen name="In Progress" component={Progress} />
      <TaskStack.Screen name="Collected" component={Collected} />
      <TaskStack.Screen name="Completed" component={Completed} />
      <TaskStack.Screen name="RejectedTask" component={RejectedTask} />
    </TaskStack.Navigator>
  );
}

const FeulStack = createNativeStackNavigator();
function FeulStackScreen() {
  return (
    <FeulStack.Navigator screenOptions={{ headerShown: false }}>
      <FeulStack.Screen name="Pending" component={Pending} />
      <FeulStack.Screen name="Approved" component={Approved} />
      <FeulStack.Screen name="Processed" component={Processed} />
      <FeulStack.Screen name="Rejected" component={Rejected} />
    </FeulStack.Navigator>
  );
}

function TabNavigator() {
  const insets = useSafeAreaInsets();
  return (
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
      }}>
      <Tab.Screen
        name="Home"
        
        component={Home}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="home" label="Home" />
          ),
        }}
      />
      <Tab.Screen
        name="TaskStack"
        component={TaskStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="list" label="Task" />
            
          ),
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={Attendance}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="calendar" label="Attendance" />
          ),
        }}
      />
      <Tab.Screen
        name="FeulStack"
        component={FeulStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="receipt" label="Request" />
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={Wallet}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="wallet" label="Wallet" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const TabIcon = ({ focused, icon, label }) => (
  <View style={{ alignItems: 'center' }}>
    {focused && <View style={{ height: 2, backgroundColor: 'white', width:50, marginBottom: 5 }} />}
    <Ionicons
      name={focused ? icon : `${icon}-outline`}
      size={22}
      color={focused ? 'rgba(255,255,255,0.5)' : '#FFFFFF'}
    />
    <Text style={{ color: focused ? 'rgba(255,255,255,0.5)' : '#FFFFFF', fontSize: 12, width:65, textAlign:'center', paddingTop:2, }}>
      {label}
    </Text>
  </View>
);

export default function App() {
  const [isConnected, setIsConnected] = useState(true);
  const notificationRef = useRef();
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isConnected ? -60 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected]);

  const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) getFcmToken();
    else Alert.alert('Push Notification permission denied');

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission denied');
      }
    }
  };

  const getFcmToken = async () => {
    try {
      const fcmToken = await messaging().getToken();
      console.log('Fcm Token', fcmToken);
    } catch (error) {
      console.error('Error fetching FCM token:', error);
    }
  };

  useEffect(() => {
    requestUserPermission();
    getFcmToken();

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const title = remoteMessage.notification?.title || 'New Notification';
      const message = remoteMessage.notification?.body || '';

      notificationRef.current?.showNotification({
        title,
        message,
        icon: require('./assets/bell.png'),
      });
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened from background state:', remoteMessage.notification);
    });

    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        const title = remoteMessage.notification?.title || 'New Notification';
        const message = remoteMessage.notification?.body || '';

        notificationRef.current?.showNotification({
          title,
          message,
          icon: require('./assets/bell.png'),
        });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <NotificationProvider>
    <GlobalAlertProvider>
      <AuthProvider>
        <Animated.View style={[{ position: 'absolute', left:0, width:'100%', top: 0, zIndex: 1000, }, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={{ textAlign: 'center', backgroundColor: 'red', color: '#fff', padding: 10 }}>
            No Internet Connection
          </Text>
        </Animated.View>
        <StatusBar backgroundColor="#ddd" barStyle="dark-content" />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
            {/* Screens without Tab Bar */}
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Welcome" component={Welcome} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="VoucherDetails" component={VoucherDetails} />
            <Stack.Screen name="Receipt" component={Receipt} />
            <Stack.Screen name="Receiptview" component={Receiptview} />
            <Stack.Screen name="Notification" component={Notification} />
            <Stack.Screen name="Tracking" component={TrackingScreen} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Attendance" component={Attendance} />

            {/* Main Tab Navigator */}
            <Stack.Screen name="MainApp" component={TabNavigator} />
          </Stack.Navigator>
         
          <PushNotifiactionModal ref={notificationRef} />
        </NavigationContainer>
      </AuthProvider>
    </GlobalAlertProvider>
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 2,
  },

  dd: {
    fontSize: 50
  }
  // text: {
  //   color: '#fff',
  //   fontWeight: '600',
  // },
  // tabItem: {
  //   flexDirection: 'column',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   paddingTop: 0,
  //   marginTop: 0,
  //   width:90,
  //   position: 'relative',
  // },
  // tbstitle: {
  //   fontFamily: 'Montserrat_600SemiBold',
  //   fontSize: 13,
  //   color: '#8F9BB3',
  //   paddingTop: 5,
  // },
  // afterline: {
  //   position: 'absolute',
  //   top: -15,
  //   left: 0,
  //   right: 0,
  //   height: 3,
  //   backgroundColor: '#FFFFFF',
  //   borderTopLeftRadius: 2,
  //   borderTopRightRadius: 2,
  //   zIndex: 2,
  // },

});
