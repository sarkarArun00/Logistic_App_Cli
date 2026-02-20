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
        // ✅ Ensure JSON headers (also set globally in apiClient ideally)
        const response = await apiClient.post(
          "/auth/employeeLogin",
          userData,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
  
        // ✅ Validate response
        if (!response?.data) {
          throw new Error("Empty response from server");
        }
  
        const data = response.data;
  
        // ✅ Save token + user info safely
        if (data?.access_token) {
          await AsyncStorage.multiSet([
            ["token", String(data.access_token)],
            ["user_id", String(data?.employee?.id ?? "")],
            ["user_name", String(data?.employee?.employee_name ?? "")],
            ["user_email", String(data?.employee?.email_id ?? "")],
          ]);
        }
  
        return data;
      } catch (error) {
        // ✅ Better debug logs (helps identify SSL/DNS/timeout)
        console.log("EMP LOGIN ERROR:", {
          message: error?.message,
          code: error?.code,
          status: error?.response?.status,
          data: error?.response?.data,
          url: error?.config?.baseURL
            ? `${error.config.baseURL}${error.config.url}`
            : error?.config?.url,
        });
  
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
      const response = await apiClient.post("global/employee/emp-attendance/checkIn", data, { timeout: 10000 });
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
      const response = await apiClient.post("global/employee/emp-attendance/checkOut", data);
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
      const response = await apiClient.post("requestOTP", data);
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
      const response = await apiClient.post("verifyOTP", data);
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
      const response = await apiClient.post("updatePassword", data);
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