import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
// import Ionicons from '@expo/vector-icons/Ionicons';

function Menu({ state, descriptors, navigation }) {
  // Get current active route name
  const activeRouteName = state?.routes[state.index].name;

  return (
    <View style={styles.menubar}>
      <TouchableOpacity 
        style={[styles.tab, activeRouteName === 'Assigned' && styles.active]} 
        onPress={() => navigation.navigate('Assigned')}
      >
        <Ionicons 
          name="list-outline" 
          size={activeRouteName === 'Assigned' ? 34 : 30} 
          color={activeRouteName === 'Assigned' ? '#fff' : '#8F9BB3'} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeRouteName === 'Attendance' && styles.active]} 
        onPress={() => navigation.navigate('Attendance')}
      >
        <Ionicons 
          name="calendar-outline" 
          size={activeRouteName === 'Attendance' ? 34 : 30} 
          color={activeRouteName === 'Attendance' ? '#fff' : '#8F9BB3'} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tab, activeRouteName === 'Home' && styles.active]} 
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons 
          name="home-outline" 
          size={activeRouteName === 'Home' ? 34 : 30} 
          color={activeRouteName === 'Home' ? '#fff' : '#8F9BB3'} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tab, activeRouteName === 'Pending' && styles.active]}  
        onPress={() => navigation.navigate('MainApp', { screen: 'Pending' })}
      >
        <Ionicons 
          name="receipt-outline" 
          size={activeRouteName === 'Pending' ? 34 : 30} 
          color={activeRouteName === 'Pending' ? '#fff' : '#8F9BB3'} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tab, activeRouteName === 'Wallet' && styles.active]}  
        onPress={() => navigation.navigate('Wallet')}
      >
        <Ionicons 
          name="wallet-outline" 
          size={activeRouteName === 'Wallet' ? 34 : 30} 
          color={activeRouteName === 'Wallet' ? '#fff' : '#8F9BB3'} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  menubar: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(0,0,0,0.06)', 
    backgroundColor: '#fff', 
    paddingBottom: 5, 
    paddingTop: 15, 
    paddingHorizontal: 20,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  active: {
    width: 50, 
    height: 50, 
    backgroundColor: '#3085FE', 
    borderRadius: 25, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
});

export default Menu;