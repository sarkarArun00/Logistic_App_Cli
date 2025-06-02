
import React, { useEffect } from 'react';

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet,StatusBar, Text} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import {GlobalAlertProvider} from './Context/GlobalAlertContext';
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


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
// Create a component for the main tab navigation with Menu bar
function TabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom:-8,
          height:70 + insets.bottom, // Add space for bottom inset
          paddingBottom: insets.bottom, // Prevent content from getting cut
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          elevation: 2,
          padding:0,
        },
      }}
    >
      <Tab.Screen
        name="Assigned"
        component={Assigned}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Ionicons
                name={focused ? "list" : "list-outline"}
                size={24}
                color={focused ? "#3085FE" : "#8F9BB3"}
              />
              <Text style={styles.tbstitle}>Task</Text>
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
              <Ionicons
                name={focused ? "calendar" : "calendar-outline"}
                size={24}
                color={focused ? "#3085FE" : "#8F9BB3"}
              />
              <Text style={styles.tbstitle}>Attendance</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerTabItem}>
              <View style={styles.centerTabCircle}>
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              
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
              <Ionicons
                name={focused ? "receipt" : "receipt-outline"}
                size={24}
                color={focused ? "#3085FE" : "#8F9BB3"}
              />
              <Text style={styles.tbstitle}>Request</Text>
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
              <Ionicons
                name={focused ? "wallet" : "wallet-outline"}
                size={24}
                color={focused ? "#3085FE" : "#8F9BB3"}
              />
              <Text style={styles.tbstitle}>Wallet</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {

  useEffect(() => { 
    
  }, []);

  return (
    <GlobalAlertProvider>
    <AuthProvider>
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Splash"
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
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
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:12,
    width:100,
  },
  centerTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -20, // Adjust to raise the middle tab above the bar
  },
  centerTabCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3085FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tbstitle:{
    fontFamily:'Montserrat_600SemiBold',
    fontSize:11,
    color:'#8F9BB3',
    paddingTop:5,
  },
});


