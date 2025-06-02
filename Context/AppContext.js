import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TaskService from "../Services/task_service";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const response = await TaskService.getAllGeneralNotifications();
      console.log("NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN:", response);
      if(response.status==1) {
        setNotifications(response.data);
        setNotificationCount(response.data?.length || 0);
      } else {
        setNotifications([]);
        setNotificationCount(0);
      }
    } catch (error) {
      console.error("Notification fetch error:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <AppContext.Provider value={{ notificationCount, notifications, fetchNotifications }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
