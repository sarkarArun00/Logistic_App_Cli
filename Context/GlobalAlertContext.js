import React, { createContext, useContext, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Image } from 'react-native';

const GlobalAlertContext = createContext();

export const GlobalAlertProvider = ({ children }) => {
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false); // false = success (tick), true = failure (Sorry!)

  const showAlertModal = (message, isError = false) => {
    setAlertMessage(message);
    setShowAlert(isError);
    setShowCustomAlert(true);
  };

  const hideAlert = () => {
    setShowCustomAlert(false);
    setAlertMessage('');
    setShowAlert(false);
  };

  return (
    <GlobalAlertContext.Provider value={{ showAlertModal, hideAlert }}>
      {children}

      {/* Custom Alert Modal (Global) */}
      <Modal
        visible={showCustomAlert}
        transparent
        animationType="fade"
        onRequestClose={hideAlert}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            width: '80%',
            backgroundColor: 'white',
            borderRadius: 10,
            padding: 20,
            alignItems: 'center'
          }}>
            {
              showAlert ? (
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#f73939' }}>
                  Sorry !
                </Text>
              ) : (
                <Image
                  source={require('../assets/tick.png')}
                  style={{ width: 50, height: 50, marginBottom: 10 }}
                />
              )
            }
            <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
              {alertMessage}
            </Text>

            <TouchableOpacity
              onPress={hideAlert}
              style={{
                backgroundColor: '#3085FE',
                paddingVertical: 10,
                paddingHorizontal: 30,
                borderRadius: 8
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </GlobalAlertContext.Provider>
  );
};

export const useGlobalAlert = () => useContext(GlobalAlertContext);
