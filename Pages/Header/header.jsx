import { StyleSheet, Text, View, TouchableOpacity, Pressable, Image } from 'react-native'
import React, { useRef, useState, useEffect, useContext } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import TaskService from '../Services/task_service';
import { AuthContext } from "../../Context/AuthContext";
import { BASE_API_URL } from '../Services/API';
import { useFocusEffect } from '@react-navigation/native';
import { useNotification } from '../../Context/NotificationContext';

const header = ({ navigation, profileImage }) => {

  const { setNotificationCount } = useNotification();
  const [userName, setUserName] = useState("");
  const [notificationCount2, setNotificationCount2] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

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


    const checkNewNotifications = async () => {
      try {
        const response = await TaskService.getMyNotifications();
        if (isMounted && response?.status == 1) {
          setNotificationCount(response.data.unseen.length || 0);
          setNotificationCount2(response.data.unseen.length || 0);
        }
      } catch (err) {
        console.log("Notification check error:", err);
      }
    };

    getUserData();
    checkNewNotifications(); 

    // const id = setInterval(() => {
    //   checkNewNotifications();
    // }, 30000);

    // setIntervalId(id);


    // return () => {
    //   isMounted = false;
    //   if (intervalId) clearInterval(intervalId);
    //   clearInterval(id);
    // };


  }, []);

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', }}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ width: 45, height: 45, overflow: 'hidden', borderRadius: '50%', }}>
            <Image style={{ width: '100%', height: '100%', objectFit: 'cover', }} source={
              profileImage
                ? { uri: BASE_API_URL + profileImage }
                : require('../../assets/loading_gray.gif') // fallback image
            } />
          </TouchableOpacity>
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 19, color: '#3085FE', paddingLeft: 8, width: 180, }}>Hi {userName} !</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Notification')}
          hitSlop={10}
          style={({ pressed }) => [
            {
              position: 'relative',
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#F6FAFF',
              justifyContent: 'center',
              alignItems: 'center',
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Image
            style={{ width: 18, height: 18 }}
            source={require('../../assets/noti.png')}
          />

          {notificationCount2 > 0 && (
            <View
              pointerEvents="none"   // <-- let taps fall through to Pressable
              style={{
                position: 'absolute',
                right: -2,
                top: -2,
                minWidth: 15,
                height: 15,
                paddingHorizontal: 2,
                backgroundColor: '#F43232',
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Montserrat-Regular',
                  fontSize: 10,
                  lineHeight: 13,
                  color: '#fff',
                  textAlign: 'center',
                }}
              >
                {notificationCount2 > 99 ? '99+' : notificationCount2}
              </Text>
            </View>
          )}
        </Pressable>

      </View>
    </View>
  )
}

export default header

const styles = StyleSheet.create({})