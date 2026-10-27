import {useState, useEffect, useCallback, useContext} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Linking,
  Modal,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
// import { useFonts, Montserrat-SemiBold, Montserrat-Medium, Montserrat-Regular } from '@expo-google-fonts/montserrat';
import TaskService from '../../Services/task_service';
import TaskStatusTabs from '../TaskStatusTabs';
import NotificationCount from '../../Notifications/NotificationCount';
import {GlobalStyles} from '../../GlobalStyles';
import {useGlobalAlert} from '../../../Context/GlobalAlertContext';
import {useSearch} from '../../../hooks/userSearch1';
import CustomAlert from '../../Components/CustomAlert';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import {readFile} from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Vibration} from 'react-native';
import {BASE_API_URL} from '../../Services/API';

const wait = timeout => {
  return new Promise(resolve => setTimeout(resolve, timeout));
};

function Accepted({navigation}) {
  // Hooks must be declared at the top — not conditionally
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState([]);
  const [selectedItem, setSelectedTaskDesc] = useState('');
  // const [visibleCount, setVisibleCount] = useState(5);
  // const [visibleTasks, setVisibleTasks] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [images, setImages] = useState([]);
  const {showAlertModal, hideAlert} = useGlobalAlert();
  const [allTasksData, setAllTasksData] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const {searchQuery, filteredData, search} = useSearch(allTasksData);
  const visibleTasks = searchQuery
    ? filteredData // Show all if searching
    : filteredData.slice(0, visibleCount); // Show limited if not
  const [acceptedTaskDetails, setAcceptedTaskDetails] = useState(null);
  const [acceptedTaskLoading, setAcceptedTaskLoading] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [modalVisible3, setModalVisible3] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [fullImageUri, setFullImageUri] = useState(null);
  const [note, setNote] = useState('');

  const [alertData, setAlertData] = useState({
    type: 'success',
    title: '',
    message: '',
  });

  const showAlert = (type, title, message) => {
    setAlertData({
      type,
      title,
      message,
    });

    setAlertVisible(true);
  };
  // const [fontsLoaded] = useFonts({
  //     Montserrat-SemiBold,
  //     Montserrat-Medium,
  //     Montserrat-Regular,
  // });

  useEffect(() => {
    fetchAcceptedData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAcceptedData();
    wait(2000).then(() => setRefreshing(false));
  }, []);

  const fetchAcceptedTask = async taskId => {
    try {
      const response = await TaskService.viewAcceptedTask({
        taskId: taskId,
      });

      console.log('Accepted task response:', response);

      if (response?.status === 1) {
        setAcceptedTaskDetails(response.data);
      } else {
        setAcceptedTaskDetails(null);
      }
    } catch (error) {
      console.error('Error fetching accepted task:', error);
      setAcceptedTaskDetails(null);
    }
  };

  //   const fetchAcceptedTask = async taskId => {
  //     try {
  //       setAcceptedTaskDetails(null);

  //       const response = await TaskService.viewAcceptedTask({
  //         taskId: taskId,
  //       });

  //       console.log('Accepted task response:', response);

  //       if (response?.status === 1) {
  //         setAcceptedTaskDetails(response.data);
  //       } else {
  //         setAcceptedTaskDetails(null);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching accepted task:', error);
  //       setAcceptedTaskDetails(null);
  //     } finally {
  //     }
  //   };
  const fetchAcceptedData = async () => {
    try {
      const response = await TaskService.getAcceptedTask();
      if (response.status == 1) {
        setAllTasksData(response.data || []);
        // setVisibleTasks(response.data?.slice(0, 5) || []);
        search('', response.data);
      } else {
        setAllTasksData([]);
        // setVisibleTasks([]);
        search('', []);
      }
    } catch (error) {
      // console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };
  const sendComment = async () => {
    if (!commentText.trim()) return;

    try {
      const user_id = await AsyncStorage.getItem('user_id');
      const formData = new FormData();

      formData.append('taskId', selectedItem.id);
      formData.append('comment', commentText);
      formData.append('commentorId', user_id);

      // Append attachment only if there's an image
      if (images.length > 0 && images[0].base64) {
        formData.append('attachment', {
          uri: 'data:image/jpeg;base64,' + images[0].base64,
          type: 'image/jpeg',
          name: 'attachment.jpg',
        });
      }

      // Send the formData via TaskService
      const response = await TaskService.addNewComment(formData); // Send as FormData

      if (response.status == 1) {
        Vibration.vibrate(100);
      }

      // Update the state with the new comment data
      setSelectedTask(prev => [...prev, response.data]);
      setCommentText('');
      setImages([]); // Clear images after submission

      // Optionally, fetch the latest task comments
      const res = await TaskService.getTaskComments({taskId: selectedItem.id});
      setSelectedTask(res.data);
    } catch (error) {
      console.error('Error sending comment:', error);
    }
  };
  const handleSave = async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      const response = await TaskService.declineTask({
        taskId: taskId,
        empId: userId,
        remarks: note,
      });
      if (response.status == 1) {
        // showAlertModal("Task Rejected Successfully!", false);
        showAlert('success', 'Rejected', 'Task Rejected Successfully!');
        setTimeout(() => {
          hideAlert();
        }, 3000);
        fetchData();
        setNote('');
        setTaskId(null);
        setModalVisible3(false);
      } else {
        Alert.alert(response.data);
      }
    } catch (error) {
      console.error('Error rejecting task:', error);
    }
  };

  const handleClose = () => {
    setModalVisible3(false);
  };

  const declineTaskByUser = async task_Id => {
    setTaskId(task_Id);
    setModalVisible3(true);
  };

  // ================================
  // CAMERA PERMISSION
  // ================================

  const requestPermission = async type => {
    try {
      if (Platform.OS !== 'android') {
        return true;
      }

      if (type === 'camera') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera to take pictures.',
            buttonNegative: 'Cancel',
            buttonPositive: 'Allow',
          },
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      // The system photo picker does not require
      // broad storage permission.
      return true;
    } catch (error) {
      console.log('Permission error:', error);
      return false;
    }
  };

  // ================================
  // IMAGE COMPRESSION
  // ================================

  const compressImage = async uri => {
    if (!uri) {
      throw new Error('Image URI is missing');
    }

    const MAX_SIZE_KB = 50;
    const MAX_ATTEMPTS = 5;

    let currentUri = uri;

    let width = 800;
    let height = 800;
    let quality = 65;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const resizedImage = await ImageResizer.createResizedImage(
        currentUri,
        width,
        height,
        'JPEG',
        quality,
        0,
      );

      if (!resizedImage?.uri) {
        throw new Error('Image compression failed');
      }

      const base64 = await readFile(resizedImage.uri, 'base64');

      const padding = (base64.match(/=+$/) || [''])[0].length;

      const sizeInKB = ((base64.length * 3) / 4 - padding) / 1024;

      console.log(
        `Compression attempt ${attempt + 1}:`,
        sizeInKB.toFixed(2),
        'KB',
      );

      if (sizeInKB <= MAX_SIZE_KB) {
        return {
          uri: resizedImage.uri,
          base64,
        };
      }

      width = Math.max(250, Math.round(width * 0.8));

      height = Math.max(250, Math.round(height * 0.8));

      quality = Math.max(25, quality - 10);

      currentUri = resizedImage.uri;
    }

    throw new Error('Unable to compress image below 50 KB.');
  };

  const formatMessageDateTime = dateValue => {
    if (!dateValue) return '';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${day}-${month}-${year} at ${time}`;
  };
  // ================================
  // OPEN CAMERA
  // ================================

  const openCamera = async () => {
    try {
      const hasPermission = await requestPermission('camera');

      if (!hasPermission) {
        showAlertModal('Camera access is needed to take pictures.', true);
        return;
      }

      const response = await launchCamera({
        mediaType: 'photo',
        includeBase64: false,
        quality: 0.7,
        saveToPhotos: false,
        cameraType: 'back',
        maxWidth: 1280,
        maxHeight: 1280,
      });

      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        console.log('Camera error:', response.errorCode, response.errorMessage);

        showAlertModal(response.errorMessage || 'Camera error occurred.', true);

        return;
      }

      const image = response.assets?.[0];

      if (!image?.uri) {
        showAlertModal('Unable to capture image. Please try again.', true);
        return;
      }

      const compressedImage = await compressImage(image.uri);

      setImages([compressedImage]);
    } catch (error) {
      console.log('Camera error:', error);

      showAlertModal(
        error?.message || 'Unable to process the captured image.',
        true,
      );
    }
  };

  // ================================
  // OPEN GALLERY
  // ================================

  const openGallery = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        includeBase64: false,
        quality: 0.7,
        maxWidth: 1280,
        maxHeight: 1280,
      });

      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        console.log(
          'Gallery error:',
          response.errorCode,
          response.errorMessage,
        );

        showAlertModal(
          response.errorMessage || 'Unable to open gallery.',
          true,
        );

        return;
      }

      const image = response.assets?.[0];

      if (!image?.uri) {
        showAlertModal('Unable to select image. Please try again.', true);
        return;
      }

      const compressedImage = await compressImage(image.uri);

      setImages([compressedImage]);
    } catch (error) {
      console.log('Gallery error:', error);

      showAlertModal(
        error?.message || 'Unable to process the selected image.',
        true,
      );
    }
  };

  // ================================
  // CAMERA / GALLERY POPUP
  // ================================

  const selectImages = () => {
    Alert.alert('Select Image', 'Choose an option', [
      {
        text: 'Camera',
        onPress: openCamera,
      },
      {
        text: 'Gallery',
        onPress: openGallery,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleDeleteImage = index => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
  };
  const startTask = async task_Id => {
    try {
      setLoading(true);
      const response = await TaskService.startNewTask({taskId: task_Id});
      if (response.status == 1) {
        showAlert('success', 'Started', 'Task Started Successfully');
        sentNotification(task_Id);
        fetchAcceptedData();
        navigation.navigate('In Progress');
        setLoading(false);
      } else {
        showAlert('error', 'Failed', response.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error starting task:', error);
      setLoading(false);
    }
  };

  const sentNotification = async taskId => {
    const userId = await AsyncStorage.getItem('user_id');
    const userName = await AsyncStorage.getItem('user_name');
    let request = {
      message: `Task ID: ${taskId} has been started by ${userName}.`,
      srcEmp: userId,
      tgtEmp: null,
      pageId: 0,
      module: 'Operation',
    };

    const response = await TaskService.generateNotification(request);
  };

  // const handleLoadMore = () => {
  //     setLoadingMore(true);
  //     setTimeout(() => {
  //         const newCount = visibleCount + 5;
  //         setVisibleCount(newCount);
  //         setVisibleTasks(allTasksData.slice(0, newCount));
  //         setLoadingMore(false);
  //     }, 500);
  // };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 5);
      setLoadingMore(false);
    }, 500);
  };

  const handleOpenModal = async task => {
    setModalVisible(true);
    setSelectedTaskDesc(task);

    try {
      const response = await TaskService.getTaskComments({taskId: task.id});
      setSelectedTask(response.data);
    } catch (error) {
      // console.error('Error fetching task comments:', error);
    }

    fetchAcceptedTask(task.id);
  };

  const navigateToUserLocation = task => {
    const locationString = task?.pickUpLocation?.coordinates;

    if (!locationString) {
      showAlertModal('Location not available', true);
      return;
    }

    const [lat, long] = locationString
      .split(',')
      .map(coord => parseFloat(coord.trim()));

    if (isNaN(lat) || isNaN(long)) {
      showAlertModal('Invalid location coordinates', true);
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${long}&travelmode=driving`;

    Linking.openURL(url).catch(err => {
      console.error('Could not open Google Maps', err);
      showAlertModal('Failed to open Google Maps.', true);
    });
  };

  const formatDate = isoString => {
    if (!isoString) return 'Invalid Date';

    const date = new Date(isoString);

    // Extract day, month, and year
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed in JS
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // Call Button
  const makeCall = async call => {
    if (!call || !String(call).trim()) {
      showAlert(
        'warning',
        'Phone Number Missing',
        'No contact number is available for this user.',
      );
      return;
    }

    const cleaned = String(call).replace(/\D/g, '');

    const formatted =
      cleaned.startsWith('91') && cleaned.length === 12
        ? `+${cleaned}`
        : cleaned.length === 10
        ? `+91${cleaned}`
        : `+${cleaned}`;

    try {
      await Linking.openURL(`tel:${formatted}`);
    } catch (error) {
      showAlert(
        'error',
        'Unable to Call',
        'Could not open the phone dialer. Please try again.',
      );
    }
  };

  // if (loading) {
  //     return (
  //         <>
  //             <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //                 <ActivityIndicator size="large" color="#2F81F5" />
  //                 <Text>Loading Tasks...</Text>
  //             </View>
  //         </>
  //     );
  // }

  const formatTime12Hour = time => {
    if (!time) return '';

    const [hours, minutes] = time.split(':');

    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;

    return `${hour12}:${minutes} ${period}`;
  };

  return (
    <SafeAreaView style={[styles.container, GlobalStyles.SafeAreaView]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('TaskStack', {screen: 'TaskScreen'})
            }
            style={{flexDirection: 'row', alignItems: 'center'}}>
            <Image
              style={{width: 14, height: 14}}
              source={require('../../../assets/leftarrow.png')}
            />
            <Text
              style={{
                fontFamily: 'Montserrat-SemiBold',
                fontSize: 18,
                color: '#2F81F5',
                marginLeft: 4,
              }}>
              Accepted Task
            </Text>
          </TouchableOpacity>
          <View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notification')}>
              <View pointerEvents="none">
                <NotificationCount />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{position: 'relative', marginTop: 20}}>
          <TextInput
            style={{
              fontSize: 14,
              fontFamily: 'Montserrat-Medium',
              height: 50,
              backgroundColor: '#F6FAFF',
              borderRadius: 30,
              paddingLeft: 20,
              paddingRight: 50,
            }}
            placeholder="Search"
            placeholderTextColor="#0C0D36"
            value={searchQuery}
            onChangeText={text => search(text, allTasksData)}
          />
          <Image
            style={{
              position: 'absolute',
              top: 16,
              right: 20,
              width: 20,
              height: 20,
            }}
            source={require('../../../assets/search.png')}
          />
        </View>

        {/* Tab Navigation */}
        {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                    <TaskStatusTabs activeTab="Accepted" />
                </ScrollView> */}

        <View style={[{paddingHorizontal: 3, paddingBottom: 10}]}>
          {visibleTasks && visibleTasks.length > 0 ? (
            visibleTasks.map((task, index) => (
              <View key={task.id ?? index} style={styles.mainbox}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 15,
                  }}>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <View
                      style={{
                        width: 29,
                        height: 29,
                        borderRadius: 50,
                        backgroundColor: '#edfafc',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Image
                        style={{width: 17, height: 17}}
                        source={require('../../../assets/texticon.png')}
                      />
                    </View>
                    {task?.request_id &&
                    task?.taskType?.taskType === 'Sample Pickup' ? (
                      <Text
                        style={{
                          flex: 1,
                          paddingLeft: 7,
                          fontFamily: 'Montserrat-Medium',
                          fontSize: 15,
                          color: '#2F81F5',
                        }}>
                        Pickup Request
                      </Text>
                    ) : (
                      <Text
                        style={{
                          flex: 1,
                          paddingLeft: 7,
                          fontFamily: 'Montserrat-Medium',
                          fontSize: 15,
                          color: '#2F81F5',
                        }}>
                        {task?.taskType?.taskType}
                      </Text>
                    )}
                    {/* <Text style={{ flex: 1, paddingLeft: 7, fontFamily: 'Montserrat-Medium', fontSize: 15, color: '#2F81F5' }}>
                                            {task.taskType?.taskType}
                                        </Text> */}
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 13,
                    }}>
                    {(task?.request_id &&
                      task?.taskType?.taskType === 'Sample Pickup') ||
                    task?.taskType?.taskType === 'Sample Pickup' ||
                    task?.taskType?.taskType === 'Cash Collection' ? (
                      <TouchableOpacity
                        onPress={() => makeCall(task?.client?.contact_number)}>
                        <Image
                          style={{width: 20, height: 20}}
                          source={require('../../../assets/call.png')}
                        />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => makeCall(task?.pickUpLocation?.contact)}>
                        <Image
                          style={{width: 20, height: 20}}
                          source={require('../../../assets/call.png')}
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        handleOpenModal(task);
                        fetchAcceptedTask(task.id);
                      }}>
                      <Image
                        style={{width: 28, height: 28}}
                        source={require('../../../assets/dotimg.png')}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{flexDirection: 'row', padding: 15}}>
                  <View style={{flex: 1}}>
                    <View style={{position: 'relative', marginBottom: 5}}>
                      <Image
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: 12,
                          height: 12,
                        }}
                        source={require('../../../assets/asicon1.png')}
                      />
                      <Text
                        style={{
                          fontFamily: 'Montserrat-Medium',
                          fontSize: 13,
                          color: '#0C0D36',
                          paddingLeft: 20,
                        }}>
                        Task ID: {task?.displayId ?? 'NA'}
                      </Text>
                    </View>
                    <View style={{position: 'relative', marginBottom: 5}}>
                      <Image
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: 11,
                          height: 13,
                        }}
                        source={require('../../../assets/asicon2.png')}
                      />
                      {(task?.request_id &&
                        task?.taskType?.taskType === 'Sample Pickup') ||
                      task?.taskType?.taskType === 'Sample Pickup' ||
                      task?.taskType?.taskType === 'Cash Collection' ? (
                        <Text
                          style={{
                            fontFamily: 'Montserrat-Medium',
                            fontSize: 13,
                            color: '#0C0D36',
                            paddingLeft: 20,
                          }}>
                          {task?.client?.address ?? 'No Address'}
                        </Text>
                      ) : (
                        <Text
                          style={{
                            fontFamily: 'Montserrat-Medium',
                            fontSize: 13,
                            color: '#0C0D36',
                            paddingLeft: 20,
                          }}>
                          {task?.pickUpLocation?.address ?? 'No Address'}
                        </Text>
                      )}
                    </View>
                    <View style={{position: 'relative', marginBottom: 5}}>
                      <Image
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: 13,
                          height: 13,
                        }}
                        source={require('../../../assets/asicon3.png')}
                      />
                      <Text
                        style={{
                          fontFamily: 'Montserrat-Medium',
                          fontSize: 13,
                          color: '#0C0D36',
                          paddingLeft: 20,
                        }}>
                        {formatTime12Hour(task?.preferredTime?.start_time)} -{' '}
                        {formatTime12Hour(task?.preferredTime?.end_time)}
                      </Text>
                    </View>
                    <View style={{position: 'relative', marginBottom: 5}}>
                      <Image
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: 13,
                          height: 13,
                        }}
                        source={require('../../../assets/asicon4.png')}
                      />
                      <Text
                        style={{
                          fontFamily: 'Montserrat-Medium',
                          fontSize: 13,
                          color: '#0C0D36',
                          paddingLeft: 20,
                        }}>
                        Assigned By: {task?.assigned?.assigner?.employee_name}
                      </Text>
                    </View>
                    {/* <View style={{ position: 'relative' }}>
                                            <Image style={{ position: 'absolute', left: 0, top: 0, width: 16, height: 16 }} source={require('../../../assets/asicon4.png')} />
                                            <Text style={{ fontFamily: 'Montserrat-Medium', fontSize: 13, color: '#0C0D36', paddingLeft: 20 }}>
                                                {task?.pickUpLocation?.client_name ?? task?.pickUpLocation?.centreName ?? '...'}

                                            </Text>
                                        </View> */}
                    {(task?.pickUpLocation?.client_name ||
                      task?.pickUpLocation?.centreName) && (
                      <View style={{position: 'relative'}}>
                        <Image
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: 16,
                            height: 16,
                          }}
                          source={
                            task.pickUpLocation.client_name
                              ? require('../../../assets/asicon4.png') // client icon
                              : require('../../../assets/asicon05.png') // center icon
                          }
                        />
                        <Text
                          style={{
                            fontFamily: 'Montserrat-Medium',
                            fontSize: 13,
                            color: '#0C0D36',
                            paddingLeft: 20,
                          }}>
                          {task.pickUpLocation.client_name ||
                            task.pickUpLocation.centreName}
                        </Text>
                      </View>
                    )}
                  </View>

                  {task?.isUrgent && (
                    <View>
                      <View style={{position: 'relative', marginTop: 30}}>
                        <View
                          style={{
                            width: 16,
                            height: 16,
                            borderWidth: 2,
                            borderColor: '#F43232',
                            borderRadius: 50,
                            position: 'absolute',
                            left: 0,
                            top: 2,
                          }}></View>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: '#F43232',
                            borderRadius: 50,
                            position: 'absolute',
                            left: 4,
                            top: 6,
                          }}></View>
                        <Text
                          style={{
                            fontFamily: 'Montserrat-Medium',
                            color: '#F43232',
                            paddingLeft: 20,
                          }}>
                          Urgent
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.scrollContainer}>
                  {task?.taskFrequency == 'Once' && (
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 4,
                        paddingHorizontal: 15,
                      }}>
                      <Text style={styles.oncetxt}>
                        {formatDate(task?.preferredDate)}
                      </Text>
                      <Text style={styles.oncetxt}>
                        {formatTime12Hour(task?.preferredTime?.start_time)} -{' '}
                        {formatTime12Hour(task?.preferredTime?.end_time)}
                      </Text>
                    </View>
                  )}
                  {task?.taskFrequency == 'Custom days' && (
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 4,
                        paddingHorizontal: 15,
                      }}>
                      <Text style={styles.oncetxt}>
                        {task?.fromDate} - {task?.toDate}
                      </Text>
                    </View>
                  )}
                  {task?.taskFrequency == 'Weekly/Daily' && (
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 4,
                        paddingHorizontal: 15,
                      }}>
                      {Object.entries(task?.selectedDays || {}).map(
                        ([day, selected]) =>
                          selected ? (
                            <Text key={day} style={styles.oncetxt}>
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </Text>
                          ) : null,
                      )}
                      {/* <Text style={styles.oncetxt}>{task?.fromDate}</Text>
                                                       <Text style={styles.oncetxt}>{task?.toDate}</Text> */}
                    </View>
                  )}
                </ScrollView>

                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: '#ECEDF0',
                    padding: 15,
                    marginTop: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                  {/*<TouchableOpacity style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12 }} onPress={() => navigation.navigate('mapNavigation', { task: task })}> */}
                  <TouchableOpacity
                    style={{
                      width: '47%',
                      backgroundColor: '#EFF6FF',
                      borderRadius: 28,
                      padding: 12,
                    }}
                    onPress={() => navigateToUserLocation(task)}>
                    <Text
                      style={{
                        fontFamily: 'Montserrat-SemiBold',
                        color: '#2F81F5',
                        textAlign: 'center',
                      }}>
                      Navigate
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => startTask(task.id)}
                    style={{
                      width: '47%',
                      backgroundColor: '#2F81F5',
                      borderRadius: 28,
                      padding: 12,
                    }}>
                    <Text
                      style={{
                        fontFamily: 'Montserrat-SemiBold',
                        color: '#fff',
                        textAlign: 'center',
                      }}>
                      Start
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View
              style={{
                padding: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 200,
              }}>
              <Image
                style={{width: 200, height: 200, marginTop: -50}}
                source={require('../../../assets/empty.png')}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Load More */}
          {/* && visibleTasks?.length < allTasksData?.length  */}
          {allTasksData?.length > 5 && (
            <TouchableOpacity
              onPress={handleLoadMore}
              style={{
                backgroundColor: '#2F81F5',
                marginHorizontal: 20,
                marginTop: 15,
                padding: 12,
                borderRadius: 10,
                alignItems: 'center',
                marginBottom: 10,
                flexDirection: 'row',
                justifyContent: 'center',
              }}
              disabled={loadingMore}>
              {loadingMore ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text
                    style={{
                      color: 'white',
                      marginLeft: 10,
                      fontFamily: 'Montserrat-SemiBold',
                    }}>
                    Loading...
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={{color: 'white', fontFamily: 'Montserrat-SemiBold'}}>
                    Load More
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ================= MORE INFORMATION MODAL ================= */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              {/* FIXED HEADER */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalText}>More Information</Text>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}>
                  <Image
                    style={{width: 18, height: 18}}
                    source={require('../../../assets/mdlclose.png')}
                  />
                </TouchableOpacity>
              </View>

              {/* SCROLLABLE CONTENT: ITEMS, DESCRIPTION, COMMENTS */}
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}>
                {/* ITEM DETAILS */}
                <View style={styles.itemsSection}>
                  <Text style={styles.itemsSectionTitle}>Item Details</Text>

                  {acceptedTaskLoading ? (
                    <ActivityIndicator size="small" color="#2F81F5" />
                  ) : acceptedTaskDetails?.items?.length > 0 ? (
                    acceptedTaskDetails.items.map((item, index) => (
                      <View key={item.id ?? index} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                          <View
                            style={[
                              styles.itemColorDot,
                              {
                                backgroundColor: item.item?.color || '#401717',
                              },
                            ]}
                          />

                          <View style={styles.itemTitleContainer}>
                            <Text style={styles.itemName}>
                              {item.item?.itemName || 'N/A'}
                            </Text>

                            <Text style={styles.itemDescription}>
                              {item.item?.description || 'Data In Use'}
                            </Text>
                          </View>

                          <View style={styles.statusIndicator} />
                        </View>

                        <View style={styles.itemDivider} />

                        <View style={styles.itemDetailsRow}>
                          <View style={styles.itemDetailColumn}>
                            <Text style={styles.itemLabel}>Quantity</Text>
                            <Text style={styles.itemValue}>
                              {item.quantity ?? 0}
                            </Text>
                          </View>

                          <View style={styles.itemDetailColumn}>
                            <Text style={styles.itemLabel}>Collected At</Text>
                            <Text style={styles.itemValue}>
                              {item.isCollected
                                ? item.collectedAt || 'Collected'
                                : 'Not Collected Yet'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noItemsText}>
                      {acceptedTaskDetails ? 'No items found' : ''}
                    </Text>
                  )}
                </View>

                {/* DESCRIPTION AND COMMENTS */}
                <View style={{padding: 15}}>
                  {/* SELECTED IMAGE PREVIEW */}
                  {images.length > 0 && (
                    <FlatList
                      data={images}
                      horizontal
                      scrollEnabled={false}
                      keyExtractor={(_, index) => index.toString()}
                      contentContainerStyle={{paddingVertical: 5}}
                      renderItem={({item, index}) => (
                        <View style={{marginRight: 10}}>
                          <Image
                            source={{uri: item.uri}}
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: 6,
                            }}
                          />

                          <TouchableOpacity
                            onPress={() => handleDeleteImage(index)}
                            style={styles.deleteImageButton}>
                            <Text style={{color: '#fff', fontWeight: 'bold'}}>
                              ✕
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    />
                  )}

                  {/* DESCRIPTION */}
                  <Text style={styles.label}>Description</Text>

                  <TextInput
                    style={styles.textarea}
                    value={selectedItem?.description || 'No Description'}
                    placeholder="Description here..."
                    multiline={true}
                    editable={false}
                  />

                  {/* COMMENTS HEADING */}
                  <Text style={styles.label}>Comments</Text>

                  {/* ALL COMMENTS SCROLL WITH THE CONTENT */}
                  {selectedTask?.length > 0 ? (
                    selectedTask.map((item, index) => (
                      <View key={item.id ?? index} style={styles.phleBox}>
                        <View style={styles.phleImg}>
                          <Image
                            style={{
                              width: 25,
                              height: 25,
                              borderRadius: 12.5,
                            }}
                            source={
                              item?.commentor?.employeePhoto
                                ? {
                                    uri: `${BASE_API_URL}/${item.commentor.employeePhoto}`,
                                  }
                                : require('../../../assets/userImg.png')
                            }
                          />
                        </View>

                        <View style={styles.phleText}>
                          <View style={styles.phleFlexBox}>
                            <Text style={styles.phleTitle}>
                              {item.commentor?.employee_name || 'Unknown'}
                            </Text>

                            <Text style={styles.phleTime}>
                              {formatMessageDateTime(item.createdAt)}
                            </Text>
                          </View>

                          {/* COMMENT ATTACHMENT */}
                          {item?.attachment?.path ? (
                            <TouchableOpacity
                              onPress={() => {
                                const imageUrl = `${BASE_API_URL}/${item.attachment.path.replace(
                                  /\\/g,
                                  '/',
                                )}`;

                                setFullImageUri(imageUrl);
                                setModalVisible2(true);
                              }}>
                              <Image
                                style={{
                                  width: '100%',
                                  height: 200,
                                  resizeMode: 'cover',
                                  marginVertical: 5,
                                  borderRadius: 8,
                                }}
                                source={{
                                  uri: `${BASE_API_URL}/${item.attachment.path.replace(
                                    /\\/g,
                                    '/',
                                  )}`,
                                }}
                              />
                            </TouchableOpacity>
                          ) : null}

                          {/* COMMENT TEXT */}
                          <Text style={styles.phleDesc}>{item.comment}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={{color: '#888', marginVertical: 10}}>
                      No comments yet.
                    </Text>
                  )}
                </View>
              </ScrollView>

              {/* FIXED BOTTOM COMMENT COMPOSER */}
              <View style={styles.commentComposer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Your Comments"
                  placeholderTextColor="#888"
                  multiline={true}
                  value={commentText}
                  onChangeText={setCommentText}
                />

                {/* ATTACHMENT BUTTON */}
                <TouchableOpacity
                  style={styles.attachmentBtn}
                  onPress={selectImages}>
                  <FontAwesome name="paperclip" size={22} color="#333" />
                </TouchableOpacity>

                {/* SEND BUTTON */}
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={sendComment}
                  disabled={!commentText.trim() && images.length === 0}>
                  <FontAwesome name="paper-plane-o" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ================= FULL IMAGE PREVIEW MODAL ================= */}
        <Modal
          visible={modalVisible2}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}
          onRequestClose={() => setModalVisible2(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.95)',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            {/* CLOSE BUTTON */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 45,
                right: 20,
                zIndex: 10,
                backgroundColor: '#fff',
                borderRadius: 22,
                width: 42,
                height: 42,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => setModalVisible2(false)}>
              <Text style={{fontSize: 22, fontWeight: 'bold', color: '#000'}}>
                ✕
              </Text>
            </TouchableOpacity>

            {/* FULL IMAGE */}
            {fullImageUri ? (
              <Image
                style={{
                  width: '95%',
                  height: '75%',
                  resizeMode: 'contain',
                }}
                source={{uri: fullImageUri}}
              />
            ) : null}
          </View>
        </Modal>

        {/* ================= REJECT REMARKS MODAL ================= */}
        <Modal
          visible={modalVisible3}
          transparent={true}
          animationType="slide"
          onRequestClose={handleClose}>
          <View style={styles.modalOverlay}>
            <View style={styles.rejectModalContainer}>
              <Text style={styles.title}>Enter your remarks</Text>

              <TextInput
                style={styles.textArea}
                placeholder="Write something..."
                placeholderTextColor="#aaa"
                multiline={true}
                numberOfLines={6}
                value={note}
                onChangeText={setNote}
                textAlignVertical="top"
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.buttonClose}
                  onPress={handleClose}>
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.buttonSave}
                  onPress={handleSave}>
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {loading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={{color: '#FFFFFF', marginTop: 10}}>Proccessing...</Text>
        </View>
      )}

      <CustomAlert
        visible={alertVisible}
        type={alertData.type}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  paddingBottom1: {
    paddingBottom: 100,
  },
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  tcbtn: {
    borderWidth: 1,
    borderColor: '#0C0D36',
    borderRadius: 8,
    marginRight: 4,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  active: {
    backgroundColor: '#2F81F5',
    borderColor: '#2F81F5',
  },
  acttext: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#0C0D36',
  },
  testactive: {
    color: '#fff',
  },
  mainbox: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 3,
    marginTop: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  attachmentBtn: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  oncetxt: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#2F81F5',
    backgroundColor: 'rgba(48, 133, 254, 0.1)',
    borderWidth: 1,
    borderColor: '#2F81F5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendBtn: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  // Modal Start
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopEndRadius: 20,
    borderTopLeftRadius: 20,
  },
  modalText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#0C0D36',
  },
  label: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 15,
    color: '#0C0D36',
    paddingBottom: 10,
  },
  input: {
    fontFamily: 'Montserrat-Regular',
    height: 54,
    borderWidth: 1,
    borderColor: '#ECEDF0',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
  },
  textarea: {
    fontFamily: 'Montserrat-Regular',
    height: 54,
    borderWidth: 1,
    borderColor: '#ECEDF0',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
  },

  itemsSection: {
    marginTop: 12,
  },

  itemsSectionTitle: {
    fontSize: 16,
    fontWeight: '350',
    color: '#050404',
    marginBottom: 10,
    marginLeft: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemColorDot: {
    width: 19,
    height: 19,
    borderRadius: 10,
    marginRight: 12,
  },

  itemTitleContainer: {
    flex: 1,
  },

  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },

  itemDescription: {
    fontSize: 13,
    color: '#555555',
    marginTop: 2,
  },

  statusIndicator: {
    width: 22,
    height: 10,
    borderRadius: 6,
    marginLeft: 8,
  },

  itemDivider: {
    height: 1,
    backgroundColor: '#DCE3EF',
    marginVertical: 12,
  },

  itemDetailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  itemDetailColumn: {
    flex: 1,
  },

  itemLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },

  itemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },

  noItemsText: {
    fontSize: 13,
    color: '#777777',
    paddingVertical: 10,
  },
  modalScrollView: {
    flexShrink: 1,
  },

  modalScrollContent: {
    paddingBottom: 10,
  },

  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  modalContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEDF0',
  },

  modalScrollView: {
    flexShrink: 1,
  },

  modalScrollContent: {
    paddingBottom: 10,
  },

  itemsSection: {
    marginTop: 12,
  },

  itemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE3EF',
    borderRadius: 12,
    marginHorizontal: 15,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginBottom: 10,
  },

  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemColorDot: {
    width: 19,
    height: 19,
    borderRadius: 10,
    marginRight: 12,
  },

  itemTitleContainer: {
    flex: 1,
  },

  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },

  itemDescription: {
    fontSize: 13,
    color: '#555555',
    marginTop: 2,
  },

  itemDivider: {
    height: 1,
    backgroundColor: '#DCE3EF',
    marginVertical: 12,
  },

  itemDetailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  itemDetailColumn: {
    flex: 1,
    paddingRight: 5,
  },

  itemLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },

  itemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },

  noItemsText: {
    fontSize: 13,
    color: '#777777',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },

  descriptionSection: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },

  modalFooter: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEDF0',
  },

  modalCloseButton: {
    backgroundColor: '#2F81F5',
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCloseButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  flatList: {
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
    borderColor: '#E5E5E5',
    padding: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  buttonClose: {
    backgroundColor: '#aaa',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  buttonSave: {
    backgroundColor: '#3085FE',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },

  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  modalContainer: {
    width: '100%',
    height: '85%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEDF0',
  },

  modalScrollView: {
    flex: 1,
    minHeight: 0,
  },

  modalScrollContent: {
    paddingBottom: 12,
  },

  commentComposer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ECEDF0',
  },

  commentInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ECEDF0',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0C0D36',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    textAlignVertical: 'top',
  },

  attachmentBtn: {
    width: 46,
    height: 46,
    padding: 0,
    marginBottom: 0,
    borderRadius: 10,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sendBtn: {
    width: 46,
    height: 46,
    padding: 0,
    marginBottom: 0,
    borderRadius: 10,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteImageButton: {
    position: 'absolute',
    top: -5,
    right: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  rejectModalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
  },
});

export default Accepted;
