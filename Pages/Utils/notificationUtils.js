// utils/notificationUtils.js

import AsyncStorage from '@react-native-async-storage/async-storage';

export const getNewNotifications = async (notifications) => {
    const stored = await AsyncStorage.getItem("seenNotificationIds");
    const seenIds = stored ? JSON.parse(stored) : [];

    // Filter new ones
    const newNotifications = notifications.filter(notif => !seenIds.includes(notif.id));

    return {
        count: newNotifications.length,
        newIds: newNotifications.map(n => n.id)
    };
};

export const markNotificationsAsSeen = async (notifications) => {
    const ids = notifications.map(n => n.id);
    await AsyncStorage.setItem("seenNotificationIds", JSON.stringify(ids));
};
