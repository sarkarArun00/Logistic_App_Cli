import { StyleSheet, Text, View, TouchableOpacity, Pressable, Image } from 'react-native'
import React, { useRef, useState, useEffect, useContext } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import TaskService from '../Services/task_service';
import { AuthContext } from "../../Context/AuthContext";
import { BASE_API_URL } from '../Services/API';
import { useFocusEffect } from '@react-navigation/native';

const header = ({ navigation, profileImage }) => {

  const [userName, setUserName] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);

  const { setNotificationData } = useContext(AuthContext);

  useEffect(() => {
    let isMounted = true;

    const getUserData = async () => {
      try {
        const storedName = await AsyncStorage.getItem("user_name");
        if (isMounted && storedName) {
          setUserName(storedName);
        }
      } catch (error) {
        console.error("Error retrieving user data:", error);
      }
    };

    const init = () => {
      getUserData();

      // const interval = setInterval(() => {
      //   checkNewNotifications();
      // }, 100000);

      return () => clearInterval(interval);
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);


  useFocusEffect(
  React.useCallback(() => {
    checkNewNotifications();
  }, [])
);

  const checkNewNotifications = async () => {

    const response = await TaskService.getAllGeneralNotifications();
    if (response.status == 1) {
      const notifications = response.data;

      const stored = await AsyncStorage.getItem("seenNotificationIds");
      const seenIds = stored ? JSON.parse(stored) : [];

      const unseenCount = notifications.filter(n => !seenIds.includes(n.id)).length;
      setNotificationCount(unseenCount);
      setNotificationData(unseenCount);
    }
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', }}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ width: 45, height: 45, overflow: 'hidden', borderRadius: '50%', }}>
            <Image style={{ width: '100%', height: '100%', objectFit: 'cover', }} source={
              profileImage
                ? { uri: BASE_API_URL + profileImage }
                : require('../../assets/user.jpg') // fallback image
            } />
          </TouchableOpacity>
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 19, color: '#3085FE', paddingLeft: 8, width: 180, }}>Hi {userName} !</Text>
        </View>
        <View style={{
          position: 'relative',
          width: 50,
          height: 50,
          borderRadius: 50,
          backgroundColor: '#F6FAFF',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Pressable onPress={() => navigation.navigate('Notification')}>
            <Image
              style={{ width: 18, height: 18 }}
              source={require('../../assets/noti.png')}
            />
          </Pressable>

          {notificationCount > 0 && (
            <Text style={{
              position: 'absolute',
              fontFamily: 'Montserrat_400Regular',
              fontSize: 10,
              lineHeight: 13,
              color: '#fff',
              right: -2,
              top: -2,
              minWidth: 15,
              height: 15,
              paddingHorizontal: 2,
              backgroundColor: '#F43232',
              borderRadius: 8,
              textAlign: 'center',
              textAlignVertical: 'center',
            }}>
              {notificationCount > 99 ? '99+' : notificationCount}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

export default header

const styles = StyleSheet.create({})