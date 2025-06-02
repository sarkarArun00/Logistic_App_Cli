// components/RazorpayWebView.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';


const RazorpayWebView = ({ amount, user, onSuccess, onFailure }) => {
  const userName = AsyncStorage.getItem('user_name');
  const userEmail = AsyncStorage.getItem('user_email');

  console.log('ddddddddddddddddddddddddddd', userName, userEmail)
  const htmlContent = `
    <html>
    <head>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </head>
    <body>
      <script>
        var options = {
          "key": "rzp_test_JOVdiPnCOhnUlR", // Replace with your live key
          "amount": ${amount * 100}, // in paisa
          "currency": "INR",
          "name": "Nirnayan Wallet",
          "description": "Wallet Top-up",
          "image": "https://nirnayanhealthcare.com/assets/images/logo.png",
          "prefill": {
            "name": "${userName}",
            "email": "${userEmail}",
            "contact": "${0}"
          },
          "theme": {
            "color": "#33a651"
          },
          "handler": function (response){
            window.ReactNativeWebView.postMessage(JSON.stringify({ status: "success", ...response }));
          },
          "modal": {
            "ondismiss": function(){
              window.ReactNativeWebView.postMessage(JSON.stringify({ status: "failed", reason: "dismissed" }));
            }
          }
        };
        var rzp1 = new Razorpay(options);
        rzp1.open();
      </script>
    </body>
    </html>
  `;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: htmlContent }}
      onMessage={(event) => {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.status === 'success') onSuccess(data);
        else onFailure(data);
      }}
      startInLoadingState
      renderLoading={() => (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      )}
    />
  );
};

export default RazorpayWebView;
