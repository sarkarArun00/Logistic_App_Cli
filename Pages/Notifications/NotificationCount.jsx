import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import TaskService from '../Services/task_service';
import { AuthContext } from "../../Context/AuthContext";
import { useFocusEffect } from '@react-navigation/native';
import {useNotification } from '../../Context/NotificationContext'




const NotificationCount = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const { notificationData } = useContext(AuthContext);
  // const [notificationCount, setNotificationCount] = useState(0);

  const { notificationCount } = useNotification();

  // if (notificationCount === 0) return null; // Hide when no notifications





  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
      <View style={{ position: 'relative', width: 50, height: 50, borderRadius: '50%', backgroundColor: '#F6FAFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
        <TouchableOpacity>
          <Image style={{ width: 18, height: 18, }} source={require('../../assets/noti.png')} />
        </TouchableOpacity>
        {notificationCount > 0 && (
          <Text style={{
            position: 'absolute',
            fontFamily: 'Montserrat-Regular',
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
          }}>
            {notificationCount}
          </Text>
        )}
        {notificationCount >= 0 && (
          <Text style={{
            position: 'absolute',
            fontFamily: 'Montserrat-Regular',
            fontSize: 10,
            lineHeight: 13,
            color: '#fff',
            right: -2,
            top: -2,
            minWidth: 15,
            height: 15,
            paddingHorizontal: 2,
            backgroundColor: "none",
            borderRadius: 8,
            textAlign: 'center',
          }}>
            {notificationCount}
          </Text>
        )}
        {/* <Text style={{ position: 'absolute', fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 13, color: '#fff', right: 0, top: 0, width: 15, height: 15, backgroundColor: '#F43232', borderRadius: 50, textAlign: 'center', }}>{notificationData}</Text> */}
      </View>
    </View>


  )
}

export default NotificationCount

const styles = StyleSheet.create({})