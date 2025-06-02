import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import TaskService from '../Services/task_service';
import { AuthContext } from "../../Context/AuthContext";

const NotificationCount = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const { notificationData } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await TaskService.getAllGeneralNotifications();
      if (response.status == 1) {
        setNotifications(response.data);
        const stored = await AsyncStorage.getItem("seenNotificationIds");
        const seenIds = stored ? JSON.parse(stored) : [];

        const unseenCount = notifications.filter(n => !seenIds.includes(n.id)).length;
        setNotificationCount(unseenCount);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      // console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>

      {/* {notificationCount > 0 && (
        <Text style={{
          position: 'absolute',
          fontFamily: 'Montserrat_400Regular',
          fontSize: 10,
          lineHeight: 13,
          color: '#fff',
          right: 0,
          top: 0,
          width: 15,
          height: 15,
          backgroundColor: '#F43232',
          borderRadius: 50,
          textAlign: 'center',
        }}>
          {notificationCount}
        </Text>
      )} */}

      <View style={{ position: 'relative', width: 50, height: 50, borderRadius: '50%', backgroundColor: '#F6FAFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
        <TouchableOpacity>
          <Image style={{ width: 18, height: 18, }} source={require('../../assets/noti.png')} />
        </TouchableOpacity>
        {notificationData > 0 && (
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
          }}>
            {notificationData}
          </Text>
        )}
        {/* <Text style={{ position: 'absolute', fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 13, color: '#fff', right: 0, top: 0, width: 15, height: 15, backgroundColor: '#F43232', borderRadius: 50, textAlign: 'center', }}>{notificationData}</Text> */}
      </View>
    </View>


  )
}

export default NotificationCount

const styles = StyleSheet.create({})