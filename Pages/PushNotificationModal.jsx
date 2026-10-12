import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';

const PushNotifiactionModal = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    icon: null,
  });

  useImperativeHandle(ref, () => ({
    showNotification({ title, message, icon }) {
      setNotificationData({ title, message, icon });
      setVisible(true);
    },
    hideNotification() {
      setVisible(false);
    }
  }));

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {notificationData.icon && (
            <Image source={notificationData.icon} style={styles.icon} />
          )}
          <Text style={styles.title}>{notificationData.title}</Text>
          <Text style={styles.message}>{notificationData.message}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setVisible(false)}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  icon: {
    width: 48,
    height: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C0D36',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2F81F5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default PushNotifiactionModal;
