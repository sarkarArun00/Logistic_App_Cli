import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image } from 'react-native';

const AlertModal = ({ message, isError, onClose }) => {
  return (
    <Modal transparent animationType="fade" visible>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: '80%', backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center' }}>
          {isError ? (
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#f73939' }}>Sorry !</Text>
          ) : (
            <Image source={require('../../assets/tick.png')} style={{ width: 50, height: 50, marginBottom: 10 }} />
          )}
          <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={{ backgroundColor: '#3085FE', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal;
