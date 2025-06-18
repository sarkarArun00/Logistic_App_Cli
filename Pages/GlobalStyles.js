import { StyleSheet } from 'react-native';

// theme/lightTheme.js
export const lightTheme = {
  background: '#FFFFFF',
  text: '#000000',
  inputBackground: '#FFFFFF',
  inputText: '#000000',
  placeholder: '#666666',
  border: '#CCCCCC',
};


const GlobalStyles = StyleSheet.create({
  SafeAreaView: {
    paddingBottom:95,
    text: {
      fontSize: 16,
      color: 'red',
    },
  },
});

export default [GlobalStyles, lightTheme];
