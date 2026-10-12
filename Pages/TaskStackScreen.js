// navigation/TaskStackScreen.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TaskScreen from '../Pages/Task-management/Task-Screen/Task-Screen'; // adjust path
import OtherTaskScreen from '../screens/OtherTaskScreen'; // optional, if needed

const Stack = createNativeStackNavigator();

export default function TaskStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TaskScreen" component={TaskScreen} />
      {/* Add more screens here if needed */}
    </Stack.Navigator>
  );
}
