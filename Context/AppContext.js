import React, { createContext, useContext, useState, useEffect } from "react";
import TaskService from "../Services/task_service";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  console.log('AppProvider mounted');

  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      console.log('fetchNotifications called');

      const response = await TaskService.getAllGeneralNotifications();
      console.log('Notification API response:', response);

      if (response.status === 1) {
        setNotifications(response.data || []);
        setNotificationCount(
          response.data?.filter(item => item.isRead === false).length || 0
        );

        console.log("Notifications:", response.data);
        console.log(
          "Unread notifications:",
          response.data?.filter(item => item.isRead === false)
        );
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
    <AppContext.Provider
      value={{ notificationCount, notifications, fetchNotifications }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);r