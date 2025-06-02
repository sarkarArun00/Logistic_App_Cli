
import { globalApiClient, apiClient } from './API';
// import * as FileSystem from 'expo-file-system';
// import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';
import { useGlobalAlert } from '../../Context/GlobalAlertContext';



const TaskService = {

  getAllClients: async () => {
    try {
      const response = await apiClient.get('/global/client/getAllClients');
      return response.data;
    } catch (error) {
      throw null;
    }
  },

  getAllGeneralNotifications: async (data) => {
    try {
      const response = await globalApiClient.post('notification/getAllGeneralNotifications', data);
      return response.data;
    } catch (error) {
      throw null;
    }
  },

  getAssignedTask: async () => {
    try {
      const response = await apiClient.get('/operation/logistics/task/getMyAssignedTasks')
      return response.data;
    } catch (error) {
      throw null;
    }
  },

  acceptTask: async (data) => {
    try {
      const response = await apiClient.post('/operation/logistics/task/acceptTask', data);
      return response.data;
    } catch (error) {
      throw null;
    }
  },

  getAcceptedTask: async () => {
    try {
      const response = await apiClient.get('/operation/logistics/task/getMyAcceptedTasks');
      return response.data;
    } catch (error) {
      throw null;
    }
  },

  getMyInProgressTasks: async () => {
    try {
      const response = await apiClient.get('/operation/logistics/task/getMyInProgressTasks');
      return response.data;
    } catch (error) {
      throw null;
    }
  },
  getMyRejectedTasks: async () => {
    try {
      const response = await apiClient.get('/operation/logistics/task/getMyRejectedTasks');
      return response.data;
    } catch (error) {
      throw null;
    }
  },

  startNewTask: async (data) => {
    try {
      const response = await apiClient.post('/operation/logistics/task/startTask', data);
      return response.data;
    } catch (error) {
      throw null;
    }
  },

  getTaskComments: async (data) => {
    try {
      const response = await apiClient.post('/operation/logistics/task/getTaskComments', data);
      return response.data;
    } catch (error) {
      throw null;
    }
  },

  addNewComment: async (data) => {
    try {
      const response = await apiClient.post('/operation/logistics/task/addNewComment', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      throw null;
    }
  },

  viewAssignedTask: async (data) => {
    try {
      const response = await apiClient.post('/operation/logistics/task/viewAssignedTask', data);
      return response.data;
    } catch (error) {
      throw null;
    }
  },

  declineTask: async (data) => {
    try {
      const response = await apiClient.post('/operation/logistics/task/declineTask', data);
      return response.data;
    } catch (error) {
      throw null;
    }
  },

  getMyCollectedTasks: async () => {
    try {
      const response = await apiClient.get('/operation/logistics/task/getMyCollectedTasks');
      return response.data;
    } catch (error) {
      throw null;
    }
  },

  collectMyTask: async (data) => {
    try {
      const response = await apiClient.post('/operation/logistics/task/collectMyTask', data
      );
      return response.data;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },

  getAllOperationEmp: async () => {
    try {
      const response = await apiClient.get('/operation/logistics/getAllOperationEmployees');
      return response.data;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },

  sampleHandover: async (data) => {
    try {
      const response = await apiClient.post('/operation/logistics/task/sampleHandover', data);
      return response.data;
    } catch (error) {
      useGlobalAlert( error.response?.data || error.message, true);
      throw error;
    }
  },

  getMyCompletedTasks: async () => {
    try {
      const response = await apiClient.get('/operation/logistics/task/getMyCompletedTasks');
      return response.data;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },

  addTaskAttachment: async (data) => {
    try {
      const response = await apiClient.post('/operation/task-attachment/addTaskAttachment', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },

  generateNewReceipt: async (data) => {
    try {
      const response = await apiClient.post('/operation/task-receipt/generateNewReceipt', data);
      return response;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },

  generateReceipt: async (data) => {
    try {
      const response = await apiClient.post('/operation/logistics/generateReceipt', data);
      return response.data;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },

  getEmpMonthlyShiftRoster: async (data) => {
    try {
      const response = await apiClient.post('/global/employee/emp-attendance/getEmpMonthlyShiftRoster', data);
      return response;
    } catch (error) {
      useGlobalAlert( error.response?.data || error.message, true);
      throw error;
    }
  },

  updateEmpLocation: async (data) => {
    try {
      const response = await apiClient.post('/operation/tracker/updateEmpLocation', data);
      return response;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },

  generateNotification: async (data) => {
    try {
      const response = await apiClient.post('/global/notifications/generateNotification', data);
      return response;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },

  getMyReceipts: async () => {
    try {
      const response = await apiClient.get('/operation/logistics/getMyReceipts');
      return response.data;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },

  getMyWallet: async () => {
    try {
      const response = await apiClient.get('/operation/logistics/getMyWallet');
      return response.data;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },

  getMyTransactions: async (data) => {
    try {
      const response = await apiClient.post('/operation/logistics/getMyTransactions', data);
      return response.data;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },

  downloadReceipt: async (data) => {
    try {
      const response = await apiClient.post('/operation/logistics/downloadReceipt', data);
      return response.data;
    } catch (error) {
      useGlobalAlert( error.response?.data || error.message, true);
      throw error;
    }
  },

  transferToOrg: async (data) => {
    try {
      const response = await apiClient.post('/operation/logistics/transferToOrg', data);
      return response.data;
    } catch (error) {
      useGlobalAlert( error.response?.data || error.message, true);
      throw error;
    }
  },

  transferToEmp: async (data) => {
    try {
      const response = await apiClient.post('/operation/logistics/transferToEmp', data);
      return response.data;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },

  getAllLogistics: async () => {
    try {
      const response = await apiClient.get('/global/employee/getAllLogistics');
      return response.data;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },
  
  getAllCentres: async () => {
    try {
      const response = await apiClient.get('/global/centre/getAllCentres');
      return response.data;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },

  getLoginByDate: async (data) => {
    try {
      const response = await apiClient.post('/global/employee/emp-attendance/getLoginByDate',data);
      return response.data;
    } catch (error) {
      useGlobalAlert(error.response?.data || error.message, true);
      throw error;
    }
  },

  handleReceiptDownload: async (url) => {
    const { showAlertModal, hideAlert } = useGlobalAlert();
    try {
      const fileUri = FileSystem.documentDirectory + 'receipt.pdf';

      // Download the PDF file to local storage
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri
      );

      const { uri } = await downloadResumable.downloadAsync();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Linking.openURL(url);
      }

      showAlertModal('Receipt downloaded successfully.', false);
    } catch (error) {
      console.error('Download error:', error);
      showAlertModal('Failed to download receipt.', true);
    }
  }

};

export default TaskService;