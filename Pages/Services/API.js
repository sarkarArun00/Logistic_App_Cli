import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Base URLs
// const BASE_API_URL = "http://192.168.1.12:4501";
// const GLOBAL_API_URL = "http://192.168.1.12:4001/global/";

const BASE_API_URL = "https://limstest.nirnayanhealthcare.com/";
const GLOBAL_API_URL = "https://limsapi-dev.nirnayanhealthcare.com/global/";

// const BASE_API_URL = "https://lims-testing-api.nirnayanhealthcare.com/";
// const GLOBAL_API_URL = "https://lims-testing-exp-api.nirnayanhealthcare.com/global/";
const GOOGLE_MAPS_APIKEY = "AIzaSyAeQzuOcT3aIg5Ql2__hJ2bDli20jCA-Bo";

// Shared Auth Interceptor
const attachAuthInterceptor = (instance) => {
  instance.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("user_id");

      if (token) config.headers.Authorization = `Bearer ${token}`;
      if (userId) config.headers.user_id = userId;

      return config;
    },
    (error) => Promise.reject(error)
  );
};

// Factory to create API clients with different base URLs
const createApiClient = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      "accept": "application/json"
    },
  });

  attachAuthInterceptor(instance);

  // Optional: Logging for development
  if (__DEV__) {
    // Restore original XMLHttpRequest and FormData in React Native debugger
    global.XMLHttpRequest = global.originalXMLHttpRequest
      ? global.originalXMLHttpRequest
      : global.XMLHttpRequest;
  
    global.FormData = global.originalFormData
      ? global.originalFormData
      : global.FormData;
  
    instance.interceptors.request.use((config) => {
      const fullUrl = `${config.baseURL || ''}${config.url}`;
      console.log("📡 [Axios Request]", config.method?.toUpperCase(), fullUrl);
  
      if (config.headers) console.log("🧾 Headers:", config.headers);
      if (config.params) console.log("🔍 Params:", config.params);
      if (config.data) console.log("📦 Data:", config.data);
  
      return config;
    });
  
    instance.interceptors.response.use(
      (response) => {
        const fullUrl = `${response.config.baseURL || ''}${response.config.url}`;
        console.log("✅ [Axios Response]", response.status, fullUrl);
        console.log("📥 Response Data:", response.data);
        return response;
      },
      (error) => {
        if (error.config) {
          const fullUrl = `${error.config.baseURL || ''}${error.config.url}`;
          console.error("❌ [Axios Error]", error.message);
          console.error("📍 URL:", fullUrl);
        }
  
        if (error.response) {
          console.error("📛 Status:", error.response.status);
          console.error("💬 Response Error:", error.response.data);
        } else {
          console.error("📴 Network/Unknown Error:", error.message);
        }
  
        return Promise.reject(error);
      }
    );
  }
  

  return instance;
};

// Export specific instances
const apiClient = createApiClient(BASE_API_URL);
const globalApiClient = createApiClient(GLOBAL_API_URL);

// Exports
export {
  apiClient,
  globalApiClient,
  BASE_API_URL,
  GOOGLE_MAPS_APIKEY
};
