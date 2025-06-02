import RazorpayCheckout from 'react-native-razorpay';
import { globalApiClient, apiClient  } from './API';
import AsyncStorage from "@react-native-async-storage/async-storage";




const RAZORPAY_KEY_ID = 'rzp_test_JOVdiPnCOhnUlR';

const RazorpayService = {
  /**

   * @param {object} options - Payment options for Razorpay.
   * @returns {Promise<object>} - Resolves with payment data on success, rejects with error on failure.
   */
  initiatePayment: async (options) => {
    // Ensure the Razorpay Key ID is set
    if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID === 'rzp_test_JOVdiPnCOhnUlR') {
      console.error('Razorpay Key ID is not configured. Please set RAZORPAY_KEY_ID in razorpay.service.js');
      Alert.alert('Configuration Error', 'Razorpay Key ID is missing. Please contact support.');
      throw new Error('Razorpay Key ID missing');
    }

    // Merge provided options with the key
    const finalOptions = {
      ...options,
      key: RAZORPAY_KEY_ID,
      image: options.image || 'https://i.imgur.com/3g7nmJC.png', // Default image if not provided
      theme: options.theme || { color: '#3399FF' }, // Default theme color
    };

    try {
      const data = await RazorpayCheckout.open(finalOptions);
      console.log('Razorpay Payment Success:', data);
      return {
        success: true,
        paymentId: data.razorpay_payment_id,
        orderId: data.razorpay_order_id,
        signature: data.razorpay_signature,
        rawResponse: data,
      };
    } catch (error) {
      console.error('Razorpay Payment Error:', error);
      return {
        success: false,
        code: error.code,
        description: error.description,
        rawError: error,
      };
    }
  },
};

export default RazorpayService;


