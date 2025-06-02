import BASE_API_URL from "./API";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { globalApiClient, apiClient  } from './API';


// Define the API service functions
const AuthService = {
  // GET Request (Fetch users)
//   getUsers: async () => {
//     try {
//       const response = await BASE_API_URL.get("/users");
//       return response.data;
//     } catch (error) {
//       console.error("Error fetching users:", error);
//       throw error;
//     }
//   },
  
  // POST Request (Login)
  empLogin: async (userData) => {
    try {
      const response = await apiClient.post("/auth/employeeLogin", userData); // Log the response data
      if (response.data.access_token) {
        await AsyncStorage.setItem("token", response.data.access_token); // Save token
        await AsyncStorage.setItem("user_id", response.data.employee.id.toString()); // Store as string
        await AsyncStorage.setItem("user_name", response.data.employee.employee_name);
      }
      if (!response || !response.data) {
      throw new Error('Empty response from server');
    }
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  getToken: async () => {
    return await AsyncStorage.getItem("token");
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
  },
  
  // getUserById: async (id) => {
  //   try {
  //     const response = await BASE_API_URL.get(`/users/${id}`);
  //     return response.data;
  //   } catch (error) {
  //     console.error(`Error fetching user ${id}:`, error);
  //     throw error;
  //   }
  // },
  attendanceCheckIn: async (data) => {
    try {
      const response = await apiClient.post("/global/employee/emp-attendance/checkIn", data, { timeout: 10000 });
      if (!response || !response.data) {
      throw new Error('Empty response from server');
    }
      return response.data;
    } catch (error) {
      console.error(`Error fetching user `, error);
      throw error;
    }
  },

  attendanceCheckOut: async (data) => {
    try {
      const response = await apiClient.post("/global/employee/emp-attendance/checkOut", data);
      if (!response || !response.data) {
      throw new Error('Empty response from server');
    }
      return response.data;
    } catch (error) {
      console.error(`Error fetching user `, error);
      throw error;
    }
  },

  requestOTP: async (data) => {
    try {
      const response = await apiClient.post("/requestOTP", data);
      if (!response || !response.data) {
      throw new Error('Empty response from server');
    }
      return response.data;
    } catch (error) {
      console.error(`Error fetching user `, error);
      throw error;
    }
  },

  verifyOTP: async (data) => {
    try {
      const response = await apiClient.post("/verifyOTP", data);
      if (!response || !response.data) {
      throw new Error('Empty response from server');
    }
      return response.data;
    } catch (error) {
      console.error(`Error fetching user `, error);
      throw error;
    }
  },
  
  updatePassword: async (data) => {
    try {
      const response = await apiClient.post("/updatePassword", data);
      if (!response || !response.data) {
      throw new Error('Empty response from server');
    }
      return response.data;
    } catch (error) {
      console.error(`Error fetching user `, error);
      throw error;
    }
  },
};



export default AuthService;