import { StyleSheet } from 'react-native';

// theme/lightTheme.js
export const lightTheme = {
  background: '#FFFFFF',
  text: '#000000',
  inputBackground: '#FFFFFF',
  inputText: '#000000',
  placeholder: '#666666',
  border: '#CCCCCC',
  paddingBottomNew:100,
};


const GlobalStyles = StyleSheet.create({
  SafeAreaView: {
    paddingBottom:155,
    text: {
      fontSize: 16,
      color: 'red',
    },
  },
});

export default [GlobalStyles, lightTheme];
