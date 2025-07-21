import { useState, useEffect, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, ActivityIndicator, View, Text, TouchableOpacity, Image, ScrollView, TextInput, Linking, Modal, PermissionsAndroid, FlatList, Alert } from 'react-native'
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium, Montserrat_400Regular } from '@expo-google-fonts/montserrat'
import { Picker } from '@react-native-picker/picker';
import { Checkbox } from 'react-native-paper';
// import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import TaskStatusTabs from '../TaskStatusTabs'
import TaskService from '../../Services/task_service';
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationCount from '../../Notifications/NotificationCount';
import { launchCamera } from 'react-native-image-picker';
import { BASE_API_URL } from '../../Services/API';

// import * as ImagePicker from 'expo-image-picker';
// import * as ImageManipulator from 'expo-image-manipulator';

import GlobalStyles from '../../GlobalStyles';
import { Vibration } from 'react-native';
import ImageResizer from 'react-native-image-resizer';
import { readFile } from 'react-native-fs'; // For base64

import { useGlobalAlert } from '../../../Context/GlobalAlertContext';
import { lightTheme } from '../../GlobalStyles';
import { useSearch } from '../../../hooks/userSearch1';



function Progress({ navigation }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [payMdlVisible, setpayMdlVisible] = useState(false);
    // const [selectedLanguage, setSelectedLanguage] = useState();
    const [collectModalVisible, setCollectModalVisible] = useState(false);
    const [collectModalVisible1, setCollectModalVisible1] = useState(false);
    const [collectModalVisible2, setCollectModalVisible2] = useState(false);
    const [collectModalVisible3, setCollectModalVisible3] = useState(false);
    const [itemCashData, setItemCashData] = useState(false);
    // const [isExpanded, setIsExpanded] = useState(false);
    const [allTasksData, setAllTasksData] = useState([]);
    // const [visibleTasks, setVisibleTasks] = useState([]);
    const [visibleCount, setVisibleCount] = useState(5);
    const { searchQuery, filteredData, search } = useSearch(allTasksData);
    const visibleTasks = searchQuery
        ? filteredData           
        : filteredData.slice(0, visibleCount); 

    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState([]);
    const [selectedItem, setSelectedTaskDesc] = useState('');
    const [commentText, setCommentText] = useState('');
    const [collectCommentText, setCollectCommentText] = useState('');
    const [selectedTaskId, setTaskId] = useState('');

    const [modalVisible2, setModalVisible2] = useState(false);
    const [fullImageUri, setFullImageUri] = useState(null);
    const [allClients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState(null);


    const [paymentMode, setPaymentMode] = useState('');
    const [amount, setAmount] = useState('');
    const [remarks, setRemarks] = useState('');
    const [taskId, setItemTaskId] = useState(null);
    const [itemInfo, setItemDeliveryData] = useState([]);
    const [itemDetails, setItemConsignemtData] = useState(null);
    // const [itemIds, setItemIds] = useState([]);
    const [deliverRemarks, setDeliveryRemarks] = useState('');

    const [checked, setChecked] = useState(false); // For "Select All"
    const [itemIds, setItemIds] = useState([]); // Selected item IDs



    const { showAlertModal, hideAlert } = useGlobalAlert();

    useEffect(() => {
        fetchData();

        if (itemInfo.length > 0) {
            setChecked(itemIds.length === itemInfo.length);
        }

        if (collectModalVisible2) {
            // Clear images on every open
            setImages([]);
            setDeliveryRemarks('');
        }
    }, [collectModalVisible2, itemIds, itemInfo]);

    useEffect(() => {
        if (collectModalVisible) {
            setImages([]);
            setCollectCommentText('');
        }
    }, [collectModalVisible]);

    useEffect(() => {
        if (collectModalVisible3) {
            setImages([]);
            setDeliveryRemarks('');
            setItemIds([])
        }
    }, [collectModalVisible3]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await TaskService.getMyInProgressTasks();
            console.log('newwwwwwwwwwwww',response)
            setAllTasksData(response.data || []);
            // setVisibleTasks(response.data?.slice(0, 5) || []);
            search('', response.data); //
            setLoading(false);

        } catch (error) {
            console.error('Error fetching tasks:', error);
            search('', []);
        } finally {
            setLoading(false);
        }
    };

    // const handleLoadMore = () => {
    //     setLoadingMore(true);
    //     setTimeout(() => {
    //         setVisibleCount(prev => prev + 5);
    //         setLoadingMore(false);
    //     }, 500);
    // };


    const getClientsAll = async () => {
        try {
            const response = await TaskService.getClientListByLogistic();
            if (response.status == 1) {
                setClients(response.data || []);
            } else {
                setClients([]);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    }

    const sendComment = async () => {
        if (!commentText.trim()) return;

        try {
            const user_id = await AsyncStorage.getItem("user_id");
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


            setSelectedTask(prev => [...prev, response.data]);
            setCommentText('');
            setImages([]);

            const res = await TaskService.getTaskComments({ taskId: selectedItem.id });
            setSelectedTask(res.data);

        } catch (error) {
            console.error('Error sending comment:', error);
        }
    };

    // Camera End
    const handleOpenModal = async (task) => {
        try {
            const response = await TaskService.getTaskComments({ taskId: task.id });
            setSelectedTask(response.data);
        }
        catch (error) {
            // console.error('Error fetching task comments:', error);
        }
        setModalVisible(true);
        setSelectedTaskDesc(task);
        setSelectedClientId(task.client.id);
        setItemTaskId(task.id);

    };


    // Camera Open
    const requestPermission = async (type) => {
        try {
            if (Platform.OS === 'android') {
                if (type === 'camera') {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.CAMERA,
                        {
                            title: 'Camera Permission',
                            message: 'App needs access to your camera to take pictures.',
                            buttonNeutral: 'Ask Me Later',
                            buttonNegative: 'Cancel',
                            buttonPositive: 'OK',
                        }
                    );
                    return granted === PermissionsAndroid.RESULTS.GRANTED;
                } else {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                        {
                            title: 'Storage Permission',
                            message: 'App needs access to your photos.',
                            buttonNeutral: 'Ask Me Later',
                            buttonNegative: 'Cancel',
                            buttonPositive: 'OK',
                        }
                    );
                    return granted === PermissionsAndroid.RESULTS.GRANTED;
                }
            }
            // iOS auto handles permissions via Info.plist
            return true;
        } catch (error) {
            console.error('Permission error:', error);
            return false;
        }
    };


    const openCamera = async () => {
        const hasPermission = await requestPermission('camera');

        if (!hasPermission) {
            showAlertModal('Camera access is needed to take pictures.', true);
            return;
        }

        const options = {
            mediaType: 'photo',
            includeBase64: true,
            quality: 1,
            saveToPhotos: true,
        };

        launchCamera(options, async (response) => {
            if (response.didCancel) {
                console.log('User cancelled camera');
            } else if (response.errorCode) {
                console.error('Camera error:', response.errorMessage);
                showAlertModal('Camera error occurred.', true);
            } else if (response.assets && response.assets.length > 0) {
                const image = response.assets[0];

                // Compress image if needed (below 50KB)
                const compressedImage = await compressImage(image.uri); // Your own compression logic
                setImages([compressedImage]); // Update state
            }
        });
    };



    const compressImage = async (uri) => {
        let currentUri = uri;
        let sizeInKB = Infinity;
        let compressedImage = { uri };

        while (sizeInKB > 50) {
            try {
                const resizedImage = await ImageResizer.createResizedImage(
                    currentUri,
                    500,        // target width
                    500,        // target height
                    'JPEG',
                    50          // quality (0–100)
                );

                // Convert to base64
                const base64 = await readFile(resizedImage.uri, 'base64');
                sizeInKB = base64.length * (3 / 4) / 1024;

                if (sizeInKB <= 50) {
                    compressedImage = {
                        uri: resizedImage.uri,
                        base64,
                    };
                    break;
                }

                currentUri = resizedImage.uri;
            } catch (error) {
                console.error('Compression failed:', error);
                break;
            }
        }
        console.log('Final compressed image size:', sizeInKB, 'KB');
        console.log('Final compressed compressedImage size:', compressedImage);
        return compressedImage;
    };

    const selectImages = () => {
        Alert.alert(
            'Select Image',
            'Choose an option',
            [
                { text: 'Camera', onPress: openCamera },
                // { text: 'Gallery', onPress: openGallery },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handleDeleteImage = (index) => {
        const updatedImages = images.filter((_, i) => i !== index);
        setImages(updatedImages);
    };

    const onCollect = async () => {
        try {

            if (images.length === 0 || !images[0].uri) {
                showAlertModal('Please select an image to upload.', true);
                return;
            }


            let requestBody = {
                taskId: selectedTaskId,
                remarks: collectCommentText,
                itemIds: []
            }

            const response = await TaskService.collectMyTask(requestBody);

            if (response.status == 1) {
                addTaskAttachment(selectedTaskId);
                showAlertModal('Task Collected Successfully!', false);
                setCollectModalVisible(false);
                fetchData();
            } else {
                Alert.alert("Error", "Failed to collect task.");
                showAlertModal('Failed to collect task.', true);
            }
        } catch (error) {
            console.error('Collect task error:', error);
            Alert.alert("Error", "Something went wrong while collecting the task.");
        }
    };


    const addTaskAttachment = async (selectedTaskId) => {
        try {
            const formData = new FormData();
            formData.append('taskId', selectedTaskId);

            if (images.length > 0 && images[0].base64) {
                formData.append('attachment', {
                    uri: 'data:image/jpeg;base64,' + images[0].base64,
                    type: 'image/jpeg',
                    name: 'attachment.jpg',
                });
            }
            const response = await TaskService.addTaskAttachment(formData);
        } catch (error) {
            console.error('Error adding task attachment:', error);
        }
    }

    const navigateToUserLocation = (task) => {
        const locationString = task?.pickUpLocation?.coordinates;

        if (!locationString) {
            showAlertModal('Location not available', true);
            return;
        }

        const [lat, long] = locationString.split(',').map(coord => parseFloat(coord.trim()));

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


    const handleSubmit = async () => {
        if (!selectedClientId) {
            showAlertModal('Please select a client.', true);
            return;
        }
        if (!paymentMode) {
            showAlertModal('Please select a payment mode.', true);
            return;
        }
        if (!amount || isNaN(amount)) {
            showAlertModal('Please enter a valid amount.', true);
            return;
        }

        const request = {
            taskId: taskId,
            clientId: selectedClientId,
            paymentMode: paymentMode,
            amount: amount,
            remarks: remarks,
        };

        try {
            const response = await TaskService.generateNewReceipt(request);

            if (response?.data?.status === 1) {
                showAlertModal('Payment details submitted successfully!', false);
                setSelectedClientId('');
                setPaymentMode('');
                setAmount('');
                setRemarks('');
                setpayMdlVisible(false);
                fetchData()
            } else {
                showAlertModal('Failed to submit payment details.', true);
            }
        } catch (error) {
            console.error('Error while submitting payment:', error);
            Alert.alert('Error', 'Something went wrong while submitting the payment.');
        }
    };

    const onCollectModalOpen = async (task) => {
        setTaskId(task.id);
        if (task.taskType.taskType == 'Item Delivery') {
            setCollectModalVisible2(true);
            setItemDeliveryData(task.items)
        }
        else if (task.taskType.taskType == 'Consignment Pick Up') {
            setCollectModalVisible3(true);
            setItemConsignemtData(task.items)
        }
        else if (task.taskType.taskType == 'Cash Collection') {
            getClientsAll();
            setItemCashData(task?.receipts == 0 ? false : true)
            setSelectedClientId(task.clientId || null)
            setItemTaskId(task.id);
            setpayMdlVisible(true);
        }
        else {
            setCollectModalVisible(true);
        }
    };

    // const toggleItemChecked = (itemId) => {
    //     setItemIds((prevItemIds) => {
    //         const exists = prevItemIds.some((item) => item.id === itemId);

    //         if (exists) {
    //             return prevItemIds.filter((item) => item.id !== itemId);
    //         } else {
    //             return [...prevItemIds, { id: itemId }];
    //         }
    //     });
    // };

    const deliverItem = async () => {
        if (itemIds.length === 0) {
            showAlertModal('Please select at least one item to delivery.', true);
            return;
        }
        setLoading(true);
        let request = {
            taskId: selectedTaskId || [],
            remarks: deliverRemarks,
            itemIds: itemIds,
        };

        try {
            const response = await TaskService.collectMyTask(request);
            if (response.status == 1) {
                addTaskAttachment(selectedTaskId);
                fetchData();
                setCollectModalVisible2(false);
                showAlertModal('Item Delivered Successfully.', false);
                sentNotification(selectedTaskId, 'Delivered Successfully');
                setDeliveryRemarks('');
                setItemIds([]);
            } else {
                showAlertModal('Failed to Deliver', true);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const collectItem = async () => {
        if (itemIds.length === 0) {
            showAlertModal('Please select at least one item to collect.', true);
            return;
        }
        setLoading(true);
        let request = {
            taskId: selectedTaskId,
            remarks: deliverRemarks,
            itemIds: itemIds,
        };

        try {
            setShowAlert(false);
            const response = await TaskService.collectMyTask(request);
            if (response.status == 1) {
                addTaskAttachment(selectedTaskId);
                fetchData();
                setCollectModalVisible3(false);
                showAlertModal('Item Collected Successfully.', false);
                sentNotification(selectedTaskId, 'Collected Successfully ');
                setDeliveryRemarks('');
                setItemIds([]);
            } else {
                showAlertModal('Failed to Deliver.', true);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Something went wrong");
        } finally {
            setLoading(false); // Stop loading
        }
    };

    const sentNotification = async (taskId, message) => {
        const userId = await AsyncStorage.getItem('user_id');
        const userName = await AsyncStorage.getItem('user_name');
        let request = {
            "message": `Task ID: ${taskId} has been ${message} by ${userName}.`,
            "srcEmp": userId,
            "tgtEmp": null,
            "pageId": 0,
            "module": "Operation"
        }

        const response = await TaskService.generateNotification(request);
    }


    const toggleItemChecked = (id) => {
        if (itemIds.some(item => item.id === id)) {
            setItemIds(itemIds.filter(item => item.id !== id));
        } else {
            setItemIds([...itemIds, { id }]);
        }
    };

    const handleSelectAll = () => {
        if (checked) {
            setItemIds([]); // Unselect all
        } else {
            const allIds = itemInfo.map((info) => ({ id: info.item.id }));
            setItemIds(allIds); // Select all
        }
        setChecked(!checked);
    };


    // Call Button
    const makeCall = (call) => {
        Linking.openURL(`tel:${call}`);
    };

    return (
        <SafeAreaView style={[styles.container, GlobalStyles.SafeAreaView]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                    <TouchableOpacity onPress={() => navigation.navigate("TaskStack", { screen: "TaskScreen" })} style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <Image style={{ width: 14, height: 14, }} source={require('../../../assets/leftarrow.png')} />
                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 18, color: '#2F81F5', marginLeft: 4, }}>In Progress Task</Text>
                    </TouchableOpacity>
                    <View >
                        <TouchableOpacity onPress={() => navigation.navigate('Notification')} >
                        <View pointerEvents="none">
                                <NotificationCount />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ position: 'relative', marginTop: 20, }}>
                    <TextInput
                        style={{ fontSize: 14, fontFamily: 'Montserrat_500Medium', height: 50, backgroundColor: '#F6FAFF', borderRadius: 30, paddingLeft: 20, paddingRight: 50, }}
                        placeholder="Search"
                        placeholderTextColor="#0C0D36"
                        value={searchQuery}
                        onChangeText={(text) => search(text, allTasksData)}
                    />
                    <Image style={{ position: 'absolute', top: 16, right: 20, width: 20, height: 20, }} source={require('../../../assets/search.png')} />
                </View>

                {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                    <TaskStatusTabs activeTab="In Progress" />
                </ScrollView> */}

                <View style={{ paddingHorizontal: 3, }}>
                    {visibleTasks && visibleTasks.length > 0 ? (
                        visibleTasks.map((task, index) => (
                            <View style={styles.mainbox} key={task.id || index}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 }}>
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ width: 29, height: 29, borderRadius: 50, backgroundColor: '#edfafc', alignItems: 'center', justifyContent: 'center' }}>
                                            <Image style={{ width: 17, height: 17 }} source={require('../../../assets/texticon.png')} />
                                        </View>
                                        <Text style={{ flex: 1, paddingLeft: 7, fontFamily: 'Montserrat_500Medium', fontSize: 15, color: '#2F81F5' }}>
                                            {task.taskType?.taskType}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                                        <TouchableOpacity onPress={() => makeCall(task?.employee?.phoneNumber)}>
                                            <Image style={{ width: 20, height: 20 }} source={require('../../../assets/call.png')} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleOpenModal(task)}>
                                            <Image style={{ width: 28, height: 28 }} source={require('../../../assets/dotimg.png')} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', padding: 15 }}>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ position: 'relative', marginBottom: 5 }}>
                                            <Image style={{ position: 'absolute', left: 0, top: 0, width: 12, height: 12 }} source={require('../../../assets/asicon1.png')} />
                                            <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#0C0D36', paddingLeft: 20 }}>
                                                Task ID: {task?.id ?? 'NA'}
                                            </Text>
                                        </View>
                                        <View style={{ position: 'relative', marginBottom: 5 }}>
                                            <Image style={{ position: 'absolute', left: 0, top: 0, width: 11, height: 13 }} source={require('../../../assets/asicon2.png')} />
                                            <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#0C0D36', paddingLeft: 20 }}>
                                                {task?.pickUpLocation?.address ?? 'No Address'}
                                            </Text>
                                        </View>
                                        <View style={{ position: 'relative', marginBottom: 5 }}>
                                            <Image style={{ position: 'absolute', left: 0, top: 0, width: 13, height: 13 }} source={require('../../../assets/asicon3.png')} />
                                            <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#0C0D36', paddingLeft: 20 }}>
                                                {task?.preferredTime?.start_time?.slice(0, 5)} - {task?.preferredTime?.end_time?.slice(0, 5)}
                                            </Text>
                                        </View>
                                        <View style={{ position: 'relative', marginBottom: 5 }}>
                                            <Image style={{ position: 'absolute', left: 0, top: 0, width: 13, height: 13 }} source={require('../../../assets/asicon4.png')} />
                                            <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#0C0D36', paddingLeft: 20 }}>
                                                Assigned By: {task?.assigned?.assigner.employee_name}
                                            </Text>
                                        </View>
                                        {(task?.pickUpLocation?.client_name || task?.pickUpLocation?.centreName) && (
                                            <View style={{ position: 'relative' }}>
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
                                                        fontFamily: 'Montserrat_500Medium',
                                                        fontSize: 13,
                                                        color: '#0C0D36',
                                                        paddingLeft: 20,
                                                    }}
                                                >
                                                    {task.pickUpLocation.client_name || task.pickUpLocation.centreName}
                                                </Text>
                                            </View>
                                        )}

                                    </View>

                                    {task?.isUrgent && (
                                        <View key={task.id || index}>
                                            <View style={{ position: 'relative', marginTop: 30 }}>
                                                <View style={{ width: 16, height: 16, borderWidth: 2, borderColor: '#F43232', borderRadius: 50, position: 'absolute', left: 0, top: 2 }}></View>
                                                <View style={{ width: 8, height: 8, backgroundColor: '#F43232', borderRadius: 50, position: 'absolute', left: 4, top: 6 }}></View>
                                                <Text style={{ fontFamily: 'Montserrat_500Medium', color: '#F43232', paddingLeft: 20 }}>Urgent</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                                    {
                                        task?.taskFrequency == 'Once' && (
                                            <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 15 }}>
                                                <Text style={styles.oncetxt}>{task?.preferredDate}</Text>
                                                <Text style={styles.oncetxt}>{task?.preferredTime?.start_time} - {task?.preferredTime?.end_time}</Text>
                                            </View>
                                        )
                                    }
                                    {
                                        task?.taskFrequency == 'Custom days' && (
                                            <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 15 }}>
                                                <Text style={styles.oncetxt}>{task?.fromDate} - {task?.toDate}</Text>
                                            </View>
                                        )
                                    }
                                    {
                                        task?.taskFrequency == 'Weekly/Daily' && (
                                            <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 15 }}>
                                                {Object.entries(task?.selectedDays || {}).map(([day, selected]) =>
                                                    selected ? <Text key={day} style={styles.oncetxt}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text> : null
                                                )}
                                                {/* <Text style={styles.oncetxt}>{task?.fromDate}</Text>
                                                                               <Text style={styles.oncetxt}>{task?.toDate}</Text> */}
                                            </View>
                                        )
                                    }

                                </ScrollView>

                                <View style={{ borderTopWidth: 1, borderTopColor: '#ECEDF0', padding: 15, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', }}>
                                    {/* <TouchableOpacity style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12, }} onPress={() => navigation.navigate('mapNavigation', { task: task })}> */}
                                    <TouchableOpacity style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12 }} onPress={() => navigateToUserLocation(task)}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#2F81F5', textAlign: 'center', }}>Navigate</Text>
                                    </TouchableOpacity>
                                    {
                                        task?.taskType?.taskType === 'Item Delivery' ? (
                                            <TouchableOpacity
                                                onPress={() => onCollectModalOpen(task)}
                                                style={{ width: '47%', backgroundColor: '#2F81F5', borderRadius: 28, padding: 12 }}
                                            >
                                                <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#fff', textAlign: 'center' }}>
                                                    Delivery
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => onCollectModalOpen(task)}
                                                style={{ width: '47%', backgroundColor: '#2F81F5', borderRadius: 28, padding: 12 }}
                                            >
                                                <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#fff', textAlign: 'center' }}>
                                                    Collect
                                                </Text>
                                            </TouchableOpacity>
                                        )
                                    }

                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', marginTop: 200 }}>
                            {/* <Text style={{ fontSize: 16, color: '#999', fontFamily: 'Montserrat_500Medium' }}>
                                No Data Found
                            </Text> */}
                            <Image style={{ width: 200, height: 200, marginTop: -50 }}
                                source={require('../../../assets/empty.png')}
                                resizeMode="contain"
                            />
                        </View>
                    )}
                </View>

                {/* Comment Modal Start Here */}
                <Modal
                    visible={modalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setModalVisible(false)}>
                    <View style={styles.modalBackground}>
                        <View style={[styles.modalContainer, styles.mdlNewContainer]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                                <Text style={styles.modalText}>More Information</Text>
                                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                                    <Image style={{ width: 18, height: 18, }} source={require('../../../assets/mdlclose.png')} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView>
                                <View style={{ padding: 15, }}>
                                    <View>
                                        <Text style={styles.label}>Description</Text>
                                        <TextInput
                                            style={styles.textarea}
                                            placeholder="Placeholder"
                                            multiline={true}
                                            value={selectedItem?.description}
                                        />
                                    </View>

                                    <View>
                                        <View>
                                            {/* <Text style={styles.label}>Attachment</Text>
                                            <TouchableOpacity style={styles.uploadContainer} onPress={selectImages}>
                                                <Image style={{ width: 30, height: 28, marginHorizontal: 'auto', }} source={require('../../../assets/upload-icon.png')} />
                                                <Text style={styles.uploadTitle}>Upload</Text>
                                                <Text style={styles.uploadSubTitle}>Supports JPG, JPEG, and PNG</Text>
                                            </TouchableOpacity> */}

                                            {images.length > 0 ? (
                                                <FlatList
                                                    style={styles.flatList}
                                                    data={images}
                                                    keyExtractor={(item, index) => index.toString()}
                                                    renderItem={({ item, index }) => (
                                                        <View>
                                                            <Image source={{ uri: item.uri }} style={{ width: 60, height: 60, borderRadius: 5, marginRight: 10, }} />
                                                            <TouchableOpacity
                                                                onPress={() => handleDeleteImage(index)}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: -5,
                                                                    right: 5,
                                                                    backgroundColor: 'red',
                                                                    borderRadius: 12,
                                                                    width: 22,
                                                                    height: 22,
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center'
                                                                }}
                                                            >
                                                                <Text style={{ color: 'white', fontSize: 12, lineHeight: 14, }}>✕</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    )}
                                                    horizontal
                                                />
                                            ) : (
                                                <Text ></Text>
                                            )}
                                        </View>

                                        <View>
                                            <Text style={styles.label}>Comments</Text>
                                            <View>

                                                {selectedTask?.map((item, index) => (
                                                    <View key={item.id || index} style={styles.phleBox}>
                                                        <View style={styles.phleImg}>
                                                            <Image
                                                                style={{ width: 25, height: 25 }}
                                                                source={require('../../../assets/userImg.png')}
                                                            />
                                                        </View>
                                                        <View style={styles.phleText}>
                                                            <View style={styles.phleFlexBox}>
                                                                <Text style={styles.phleTitle}>{item.commentor?.employee_name}</Text>
                                                                <Text style={styles.phleTime}>
                                                                    {new Date(item.createdAt).toLocaleTimeString([], {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </Text>
                                                            </View>
                                                            {item?.attachment?.path && item.attachment.path !== "" ? (
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        const imageUrl = `${BASE_API_URL}/${item.attachment.path.replace(/\\/g, "/")}`;
                                                                        setFullImageUri(imageUrl);
                                                                        setModalVisible2(true);
                                                                    }}
                                                                >
                                                                    <Image
                                                                        style={{ width: 320, height: 200, marginVertical: 5 }}
                                                                        source={{ uri: `${BASE_API_URL}/${item.attachment.path.replace(/\\/g, "/")}` }}
                                                                    />
                                                                </TouchableOpacity>
                                                            ) : null}

                                                            <Text style={styles.phleDesc}>{item.comment}</Text>
                                                        </View>
                                                    </View>
                                                ))}


                                                {/* Comments Send */}
                                                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                                                    {/* Comment Input */}
                                                    <View style={{ flex: 1 }}>
                                                        <TextInput
                                                            style={styles.input}
                                                            placeholder="Your Comments"
                                                            multiline={true}
                                                            placeholderTextColor="#0C0D36"
                                                            value={commentText}
                                                            onChangeText={setCommentText}
                                                        />
                                                    </View>

                                                    {/* Attachment Icon */}
                                                    <TouchableOpacity style={styles.attachmentBtn} onPress={selectImages}>
                                                        <FontAwesome name="paperclip" size={24} color="#333" />
                                                    </TouchableOpacity>

                                                    {/* Send Button */}
                                                    <TouchableOpacity style={styles.sendBtn} onPress={sendComment}>
                                                        <FontAwesome name="paper-plane-o" size={24} color="#fff" />
                                                    </TouchableOpacity>
                                                </View>


                                            </View>
                                        </View>
                                    </View>

                                    <TouchableOpacity onPress={() => { setpayMdlVisible(true); setModalVisible(false); }} style={{ backgroundColor: '#2F81F5', borderRadius: 28, paddingVertical: 16, paddingHorizontal: 10, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: 'white', textAlign: 'center', }}>Receive Payment</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>

                        </View>
                    </View>
                </Modal>

                {/* Payment Modal */}
                <Modal
                    visible={payMdlVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setpayMdlVisible(false)}>
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                                <Text style={styles.modalText}>Payment Details</Text>
                                <TouchableOpacity style={styles.closeButton} onPress={() => setpayMdlVisible(false)}>
                                    <Image style={{ width: 18, height: 18, }} source={require('../../../assets/mdlclose.png')} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ padding: 15 }}>
                                <View>
                                    <Text style={styles.label}>Client Name</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectedClientId}
                                            onValueChange={(itemValue) => setSelectedClientId(itemValue)}
                                            style={styles.picker}
                                            dropdownIconColor={lightTheme.inputText}
                                            enabled={!selectedClientId} // ❗️Read-only when ID exists
                                        >
                                            <Picker.Item label="Select Client" value="" />
                                            {allClients.map((client) => (
                                                <Picker.Item key={client.id} label={client.client_name} value={client.id} />
                                            ))}
                                        </Picker>
                                    </View>
                                </View>

                                <View>
                                    <Text style={styles.label}>Payment Mode</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={paymentMode}
                                            onValueChange={(itemValue) => setPaymentMode(itemValue)}
                                            style={styles.picker} // Apply text color here
                                            dropdownIconColor={lightTheme.inputText} // Android only
                                        >
                                            <Picker.Item label="Select Mode" value="" />
                                            <Picker.Item label="Cash" value="Cash" />
                                            {/* <Picker.Item label="UPI" value="UPI" />
                                            <Picker.Item label="Net Banking" value="Net Banking" /> */}
                                        </Picker>
                                    </View>
                                </View>

                                <View>
                                    <Text style={styles.label}>Enter Amount</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Amount"
                                        placeholderTextColor="#0C0D36"
                                        value={amount}
                                        keyboardType="numeric"
                                        onChangeText={setAmount}
                                    />
                                </View>

                                <View>
                                    <Text style={styles.label}>Remarks</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter remarks"
                                        placeholderTextColor="#0C0D36"
                                        value={remarks}
                                        onChangeText={setRemarks}
                                    />
                                </View>

                                <View>
                                    <TouchableOpacity disabled={itemCashData}

                                        onPress={() => {
                                            if (itemCashData == false) {
                                                handleSubmit();
                                            }
                                        }}
                                        style={{
                                            backgroundColor: !itemCashData ? '#2F81F5' : '#B0C4DE',
                                            borderRadius: 28,
                                            paddingVertical: 16,
                                            paddingHorizontal: 10,
                                            opacity: itemCashData ? 1.6 : 1,
                                        }}
                                    >
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: 'white', textAlign: 'center' }}>
                                            Generate Receipt
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                        </View>
                    </View>
                </Modal>

                {/* Sample pickup collect Modal */}
                <Modal
                    visible={collectModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => collectModalVisible(false)}>
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                                <Text style={styles.modalText}>Collect Modal</Text>
                                <TouchableOpacity style={styles.closeButton} onPress={() => setCollectModalVisible(false)}>
                                    <Image style={{ width: 18, height: 18, }} source={require('../../../assets/mdlclose.png')} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ padding: 15, }}>

                                <View>
                                    <Text style={styles.label}>Attachment</Text>

                                    <TouchableOpacity style={styles.uploadContainer} onPress={selectImages}>
                                        <Image style={{ width: 30, height: 28, marginHorizontal: 'auto', }} source={require('../../../assets/upload-icon.png')} />
                                        <Text style={styles.uploadTitle}>Upload</Text>
                                        <Text style={styles.uploadSubTitle}>Supports JPG, JPEG, and PNG</Text>
                                    </TouchableOpacity>

                                    {images.length > 0 ? (
                                        <FlatList
                                            style={styles.flatList}
                                            data={images}
                                            keyExtractor={(item, index) => index.toString()}
                                            renderItem={({ item, index }) => (
                                                <View>
                                                    <Image source={{ uri: item.uri }} style={{ width: 60, height: 60, borderRadius: 5, marginRight: 10, }} />
                                                    <TouchableOpacity
                                                        onPress={() => handleDeleteImage(index)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: -5,
                                                            right: 5,
                                                            backgroundColor: 'red',
                                                            borderRadius: 12,
                                                            width: 22,
                                                            height: 22,
                                                            justifyContent: 'center',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <Text style={{ color: 'white', fontSize: 12, lineHeight: 14, }}>✕</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                            horizontal
                                        />
                                    ) : (
                                        <Text style={styles.noImgSelected}>No images selected</Text>
                                    )}
                                </View>

                                <View>
                                    <Text style={styles.label}>Remarks</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Your Comments"
                                        placeholderTextColor="#0C0D36"
                                        value={collectCommentText}
                                        onChangeText={setCollectCommentText}
                                    />
                                </View>
                                <View style={{ borderTopWidth: 1, borderTopColor: '#ECEDF0', padding: 15, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', }}>
                                    <TouchableOpacity onPress={() => setCollectModalVisible(false)} style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#2F81F5', textAlign: 'center', }}>Close</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={onCollect} style={{ width: '47%', backgroundColor: '#2F81F5', borderRadius: 28, padding: 12, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#fff', textAlign: 'center', }}>Collect</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Report Dispatched Modal */}
                <Modal
                    visible={collectModalVisible1}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => collectModalVisible1(false)}>
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                                <Text style={styles.modalText}>Collect Modal</Text>
                                <TouchableOpacity style={styles.closeButton} onPress={() => setCollectModalVisible(false)}>
                                    <Image style={{ width: 18, height: 18, }} source={require('../../../assets/mdlclose.png')} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ padding: 15, }}>

                                <View>
                                    <Text style={styles.label}>Attachment</Text>

                                    <TouchableOpacity style={styles.uploadContainer} onPress={selectImages}>
                                        <Image style={{ width: 30, height: 28, marginHorizontal: 'auto', }} source={require('../../../assets/upload-icon.png')} />
                                        <Text style={styles.uploadTitle}>Upload</Text>
                                        <Text style={styles.uploadSubTitle}>Supports JPG, JPEG, and PNG</Text>
                                    </TouchableOpacity>

                                    {images.length > 0 ? (
                                        <FlatList
                                            style={styles.flatList}
                                            data={images}
                                            keyExtractor={(item, index) => index.toString()}
                                            renderItem={({ item, index }) => (
                                                <View>
                                                    <Image source={{ uri: item.uri }} style={{ width: 60, height: 60, borderRadius: 5, marginRight: 10, }} />
                                                    <TouchableOpacity
                                                        onPress={() => handleDeleteImage(index)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: -5,
                                                            right: 5,
                                                            backgroundColor: 'red',
                                                            borderRadius: 12,
                                                            width: 22,
                                                            height: 22,
                                                            justifyContent: 'center',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <Text style={{ color: 'white', fontSize: 12, lineHeight: 14, }}>✕</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                            horizontal
                                        />
                                    ) : (
                                        <Text style={styles.noImgSelected}>No images selected</Text>
                                    )}
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, }}>
                                    <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 16, color: '#0C0D36', }}>Select All</Text>
                                    <Checkbox status={checked ? "checked" : "unchecked"} onPress={() => setChecked(!checked)} />
                                </View>

                                <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 16, color: '#0C0D36', paddingBottom: 18, }}>Akash Kundu (Investigation ID)</Text>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, }}>
                                    <View style={{ flexDirection: 'row', flex: 1, }}>
                                        <View style={{ width: 24, height: 24, borderRadius: '50%', borderWidth: 1, borderColor: '#8FEE95', backgroundColor: '#F0FFF1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', }}>
                                            <Image style={{ width: 14, height: 14, }} source={require('../../../assets/texticon2.png')} />
                                        </View>
                                        <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#0C0D36', paddingLeft: 10, }}>Container Type (Bar Code)</Text>
                                    </View>
                                    <Checkbox status={checked ? "checked" : "unchecked"} onPress={() => setChecked(!checked)} />
                                </View>

                                <View>
                                    <Text style={styles.label}>Remarks</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Placeholder"
                                        placeholderTextColor="#0C0D36"
                                    />
                                </View>
                                <View style={{ borderTopWidth: 1, borderTopColor: '#ECEDF0', padding: 15, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', }}>
                                    <TouchableOpacity onPress={() => setCollectModalVisible(false)} style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#2F81F5', textAlign: 'center', }}>Close</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => navigation.navigate('Collected')} style={{ width: '47%', backgroundColor: '#2F81F5', borderRadius: 28, padding: 12, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#fff', textAlign: 'center', }}>Collect</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Delivery Modal */}
                <Modal
                    visible={collectModalVisible2}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => collectModalVisible2(false)}>
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                                <Text style={styles.modalText}>Delivery Modal</Text>
                                <TouchableOpacity style={styles.closeButton} onPress={() => setCollectModalVisible2(false)}>
                                    <Image style={{ width: 18, height: 18, }} source={require('../../../assets/mdlclose.png')} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ padding: 15, }}>

                                <View>
                                    <Text style={styles.label}>Attachment</Text>

                                    <TouchableOpacity style={styles.uploadContainer} onPress={selectImages}>
                                        <Image style={{ width: 30, height: 28, marginHorizontal: 'auto', }} source={require('../../../assets/upload-icon.png')} />
                                        <Text style={styles.uploadTitle}>Upload</Text>
                                        <Text style={styles.uploadSubTitle}>Supports JPG, JPEG, and PNG</Text>
                                    </TouchableOpacity>

                                    {images.length > 0 ? (
                                        <FlatList
                                            style={styles.flatList}
                                            data={images}
                                            keyExtractor={(item, index) => index.toString()}
                                            renderItem={({ item, index }) => (
                                                <View>
                                                    <Image source={{ uri: item.uri }} style={{ width: 60, height: 60, borderRadius: 5, marginRight: 10, }} />
                                                    <TouchableOpacity
                                                        onPress={() => handleDeleteImage(index)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: -5,
                                                            right: 5,
                                                            backgroundColor: 'red',
                                                            borderRadius: 12,
                                                            width: 22,
                                                            height: 22,
                                                            justifyContent: 'center',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <Text style={{ color: 'white', fontSize: 12, lineHeight: 14, }}>✕</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                            horizontal
                                        />
                                    ) : (
                                        <Text style={styles.noImgSelected}>No images selected</Text>
                                    )}
                                </View>


                                <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 16, color: '#0C0D36', paddingBottom: 18, marginTop: 5 }}>Item Details</Text>

                                {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 16, color: '#0C0D36' }}>Select All</Text>
                                <Checkbox status={checked ? "checked" : "unchecked"} onPress={handleSelectAll} />
                                </View> */}
                                {itemInfo?.map((info, index) => (
                                    <View
                                        key={info.id}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: 6,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', flex: 1 }}>
                                            <View
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 12,
                                                    borderWidth: 1,
                                                    borderColor: '#8FEE95',
                                                    backgroundColor: info.item?.color,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Image
                                                    style={{ width: 14, height: 14 }}
                                                    source={require('../../../assets/texticon2.png')}
                                                />
                                            </View>
                                            <Text
                                                style={{
                                                    fontFamily: 'Montserrat_500Medium',
                                                    fontSize: 14,
                                                    color: '#0C0D36',
                                                    paddingLeft: 10,
                                                }}
                                            >
                                                {info.item?.itemName ?? 'Unknown Item'} - {info.quantity}
                                            </Text>
                                        </View>
                                        <Checkbox
                                            status={itemIds.some((item) => item.id === info.item.id) ? 'checked' : 'unchecked'}
                                            onPress={() => toggleItemChecked(info.item.id)}
                                        />

                                    </View>
                                ))}


                                <View>
                                    <Text style={styles.label}>Remarks</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Write here..."
                                        placeholderTextColor="#0C0D36"
                                        value={deliverRemarks}
                                        onChangeText={text => setDeliveryRemarks(text)}
                                    />
                                </View>
                                <View style={{ borderTopWidth: 1, borderTopColor: '#ECEDF0', padding: 15, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', }}>
                                    <TouchableOpacity onPress={() => setCollectModalVisible2(false)} style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#2F81F5', textAlign: 'center', }}>Close</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => deliverItem()} style={{ width: '47%', backgroundColor: '#2F81F5', borderRadius: 28, padding: 12, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#fff', textAlign: 'center', }}>Deliver</Text>
                                    </TouchableOpacity>
                                </View>
                                {loading && (
                                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                        <ActivityIndicator size="large" color="#2F81F5" />
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Consignment Pickup Modal */}
                <Modal
                    visible={collectModalVisible3}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => collectModalVisible3(false)}>
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                                <Text style={styles.modalText}>Consignment Details</Text>
                                <TouchableOpacity style={styles.closeButton} onPress={() => setCollectModalVisible3(false)}>
                                    <Image style={{ width: 18, height: 18, }} source={require('../../../assets/mdlclose.png')} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ padding: 15, }}>

                                <View>
                                    <Text style={styles.label}>Attachment</Text>

                                    <TouchableOpacity style={styles.uploadContainer} onPress={selectImages}>
                                        <Image style={{ width: 30, height: 28, marginHorizontal: 'auto', }} source={require('../../../assets/upload-icon.png')} />
                                        <Text style={styles.uploadTitle}>Upload</Text>
                                        <Text style={styles.uploadSubTitle}>Supports JPG, JPEG, and PNG</Text>
                                    </TouchableOpacity>

                                    {images.length > 0 ? (
                                        <FlatList
                                            style={styles.flatList}
                                            data={images}
                                            keyExtractor={(item, index) => index.toString()}
                                            renderItem={({ item, index }) => (
                                                <View>
                                                    <Image source={{ uri: item.uri }} style={{ width: 60, height: 60, borderRadius: 5, marginRight: 10, }} />
                                                    <TouchableOpacity
                                                        onPress={() => handleDeleteImage(index)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: -5,
                                                            right: 5,
                                                            backgroundColor: 'red',
                                                            borderRadius: 12,
                                                            width: 22,
                                                            height: 22,
                                                            justifyContent: 'center',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <Text style={{ color: 'white', fontSize: 12, lineHeight: 14, }}>✕</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                            horizontal
                                        />
                                    ) : (
                                        <Text style={styles.noImgSelected}>No images selected</Text>
                                    )}
                                </View>


                                <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 16, color: '#0C0D36', paddingBottom: 18, }}>Item Details:</Text>

                                {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, }}>
                                    <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 16, color: '#0C0D36', }}>Select All</Text>
                                    <Checkbox status={checked ? "checked" : "unchecked"} onPress={handleSelectAll} />
                                </View> */}
                                {itemDetails?.map((info, index) => (
                                    <View
                                        key={info.id}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: 6,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', flex: 1 }}>
                                            <View
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 12,
                                                    borderWidth: 1,
                                                    borderColor: '#8FEE95',
                                                    backgroundColor: '#F0FFF1',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Image
                                                    style={{ width: 14, height: 14 }}
                                                    source={require('../../../assets/texticon2.png')}
                                                />
                                            </View>
                                            <Text
                                                style={{
                                                    fontFamily: 'Montserrat_500Medium',
                                                    fontSize: 14,
                                                    color: '#0C0D36',
                                                    paddingLeft: 10,
                                                }}
                                            >
                                                {info.item?.itemName ?? 'Unknown Item'} - {info?.quantity}
                                            </Text>
                                        </View>
                                        <Checkbox
                                            status={itemIds.some((item) => item.id === info.item.id) ? 'checked' : 'unchecked'}
                                            onPress={() => toggleItemChecked(info.item.id)}
                                        />

                                    </View>
                                ))}


                                <View>
                                    <Text style={styles.label}>Remarks</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Write here..."
                                        placeholderTextColor="#0C0D36"
                                        value={deliverRemarks}
                                        onChangeText={text => setDeliveryRemarks(text)}
                                    />
                                </View>
                                <View style={{ borderTopWidth: 1, borderTopColor: '#ECEDF0', padding: 15, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', }}>
                                    <TouchableOpacity onPress={() => setCollectModalVisible3(false)} style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#2F81F5', textAlign: 'center', }}>Close</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => collectItem()} style={{ width: '47%', backgroundColor: '#2F81F5', borderRadius: 28, padding: 12, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#fff', textAlign: 'center', }}>Collect</Text>
                                    </TouchableOpacity>
                                </View>
                                {loading && (
                                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                        <ActivityIndicator size="large" color="#2F81F5" />
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Full image modal */}
                <Modal visible={modalVisible2} transparent={true}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>

                        {/* Close Button */}
                        <TouchableOpacity
                            style={{
                                position: 'absolute',
                                top: 40,
                                right: 20,
                                zIndex: 1,
                                backgroundColor: '#fff',
                                borderRadius: 20,
                                padding: 5,
                            }}
                            onPress={() => setModalVisible2(false)}
                        >
                            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>

                        {/* Full Image */}
                        <Image
                            style={{ width: '90%', height: '70%', resizeMode: 'contain' }}
                            source={{ uri: fullImageUri }}
                        />

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
                    }}
                >
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', marginTop: 10 }}>Proccessing...</Text>
                </View>
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({

    label: {
        fontSize: 16,
        marginBottom: 8,
        color: lightTheme.text,
    },
    pickerContainer: {
        backgroundColor: lightTheme.inputBackground,
        borderWidth: 1,
        borderColor: lightTheme.border,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 16,
    },
    picker: {
        height: 50,
        color: lightTheme.inputText, // Works on iOS and sometimes Android
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
        fontFamily: 'Montserrat_500Medium',
        fontSize: 12,
        color: '#0C0D36',
    },
    testactive: {
        color: '#fff',
    },
    mainbox: {
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 3,
        marginTop: 20,
        borderRadius: 15,
    },
    oncetxt: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 12,
        color: '#2F81F5',
        backgroundColor: 'rgba(48, 133, 254, 0.1)',
        borderWidth: 1,
        borderColor: '#2F81F5',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
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
        fontFamily: 'Montserrat_500Medium',
        fontSize: 16,
        color: '#0C0D36',
    },
    label: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 15,
        color: '#0C0D36',
        paddingBottom: 10,
    },
    input: {
        height: 54,
        borderWidth: 1,
        borderColor: '#ECEDF0',
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 15,
        marginBottom: 15,
        borderRadius: 10,
    },
    pickerContainer: {
        height: 54,
        borderWidth: 1,
        borderColor: '#ECEDF0',
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 0,
        marginBottom: 15,
        borderRadius: 10,
    },
    textarea: {
        height: 54,
        borderWidth: 1,
        borderColor: '#ECEDF0',
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 15,
        marginBottom: 15,
        borderRadius: 10,
    },
    // 
    mdlNewContainer: {
        maxHeight: '70%',
    },
    sendBtn: {
        backgroundColor: '#2F81F5',
        height: 54,
        borderRadius: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    phleBox: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    phleImg: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#7b8691',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    phleText: {
        flex: 1,
        backgroundColor: '#edf1f3',
        borderRadius: 10,
        padding: 10,
    },
    phleFlexBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 6,
    },
    phleTitle: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 13,
        color: '#2F81F5',
        flex: 1,
        paddingRight: 15,
    },
    phleTime: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 12,
        color: '#0C0D36',
    },
    phleDesc: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 13,
        color: '#0C0D36',
    },
    // 
    uploadContainer: {
        borderWidth: 1,
        borderRadius: 12,
        borderStyle: 'dashed',
        backgroundColor: '#FAFAFA',
        borderColor: '#E5E5E5',
        marginBottom: 15,
        padding: 12,
    },
    uploadTitle: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 14,
        color: '#2F81F5',
        textAlign: 'center',
        paddingTop: 10,
        paddingBottom: 3,
    },
    uploadSubTitle: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 13,
        color: '#0C0D36',
        textAlign: 'center',
    },
    flatList: {
        borderWidth: 1,
        borderRadius: 12,
        borderStyle: 'dashed',
        backgroundColor: '#FAFAFA',
        borderColor: '#E5E5E5',
        padding: 12,
    },
    noImgSelected: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 13,
        color: '#0C0D36',
        textAlign: 'center',
        borderWidth: 1,
        borderRadius: 12,
        borderStyle: 'dashed',
        backgroundColor: '#FAFAFA',
        borderColor: '#E5E5E5',
        padding: 12,
    },

    uploadContainer: {
        borderWidth: 1,
        borderRadius: 12,
        borderStyle: 'dashed',
        backgroundColor: '#FAFAFA',
        borderColor: '#E5E5E5',
        marginBottom: 15,
        padding: 12,
    },
    uploadTitle: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 14,
        color: '#2F81F5',
        textAlign: 'center',
        paddingTop: 10,
        paddingBottom: 3,
    },
    uploadSubTitle: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 13,
        color: '#0C0D36',
        textAlign: 'center',
    },
    flatList: {
        borderWidth: 1,
        borderRadius: 12,
        borderStyle: 'dashed',
        backgroundColor: '#FAFAFA',
        borderColor: '#E5E5E5',
        padding: 12,
    },
    noImgSelected: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 13,
        color: '#0C0D36',
        textAlign: 'center',
        borderWidth: 1,
        borderRadius: 12,
        borderStyle: 'dashed',
        backgroundColor: '#FAFAFA',
        borderColor: '#E5E5E5',
        padding: 12,
    },

    attachmentBtn: {
        backgroundColor: '#eee',
        padding: 10,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },

    sendBtn: {
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },

})

export default Progress
