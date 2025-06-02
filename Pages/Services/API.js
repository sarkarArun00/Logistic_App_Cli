import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Base URLs
// const BASE_API_URL = "http://192.168.1.12:4501";
// const GLOBAL_API_URL = "http://192.168.1.12:4001/global/";
const BASE_API_URL = "https://limstest.nirnayanhealthcare.com/";
const GLOBAL_API_URL = "https://limsapi-dev.nirnayanhealthcare.com/global/";
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
    timeout: 3000,
    headers: {
      "accept": "application/json"
    },
  });

  attachAuthInterceptor(instance);

  // Optional: Logging for development
  if (__DEV__) {

     global.XMLHttpRequest = global.originalXMLHttpRequest
    ? global.originalXMLHttpRequest
    : global.XMLHttpRequest;

  global.FormData = global.originalFormData
    ? global.originalFormData
    : global.FormData;
    
    instance.interceptors.request.use((config) => {
      console.log("[Axios Request]", config.method?.toUpperCase(), config.url);
      // console.log("Payload:", config.data);
      return config;
    });

    instance.interceptors.response.use(
      (response) => {
        // console.log("[Axios Response]", response.status, response.config.url);
        // console.log("Response Data:", response.data);
        return response;
      },
      (error) => {
        // console.error("[Axios Error]", error.response?.status, error.response?.config?.url);
        // console.error("Error Response:", error.response?.data);
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
