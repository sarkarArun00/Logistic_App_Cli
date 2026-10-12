import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AppPicker = ({
  value,
  onValueChange,
  placeholder = 'Select',
  items = [],
  disabled = false,
}) => {
  return (
    <View style={[styles.container, disabled && { opacity: 0.5 }]}>
      <RNPickerSelect
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        placeholder={{ label: placeholder, value: '' }}
        items={items}
        useNativeAndroidPickerStyle={false}
        fixAndroidTouchableBug={true}
        style={{
          inputIOS: styles.input,
          inputAndroid: styles.input,
          placeholder: styles.placeholder,
          iconContainer: styles.iconContainer,
        }}
      />
    </View>
  );
};

export default AppPicker;

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderWidth: 1,
    borderColor: '#ECEDF0',
    borderRadius: 10,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    marginBottom: 14,
  },
  input: {
    height: 52,
    paddingHorizontal: 14,
    paddingRight: 40,
    fontSize: 14,
    color: '#1C2140',
    fontFamily: 'Montserrat-Regular',
  },
  placeholder: {
    color: '#999',
  },
  iconContainer: {
    top: Platform.OS === 'ios' ? 16 : 15,
    right: 14,
  },
});