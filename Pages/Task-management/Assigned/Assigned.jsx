import { useState, useEffect, useCallback, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
    StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, TextInput, Linking, Modal, ActivityIndicator, RefreshControl,
    Alert, FlatList,
    TextInputBase
} from 'react-native'
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium, Montserrat_400Regular } from '@expo-google-fonts/montserrat'
// import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import TaskService from '../../Services/task_service';
import TaskStatusTabs from '../TaskStatusTabs'
import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as ImagePicker from 'expo-image-picker';
import NotificationCount from '../../Notifications/NotificationCount';
import GlobalStyles from '../../GlobalStyles';
import { Vibration } from 'react-native';
import { useGlobalAlert } from '../../../Context/GlobalAlertContext';
import { BASE_API_URL } from '../../Services/API';
import { lightTheme } from '../../GlobalStyles';
import { useSearch } from '../../../hooks/userSearch1';

const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};

function Assigned({ navigation }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState([]);
    const [selectedItem, setSelectedTaskDesc] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [images, setImages] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [allTasksData, setAllTasksData] = useState([]);
    // const [visibleTasks, setVisibleTasks] = useState([]);
    const [visibleCount, setVisibleCount] = useState(5);
    const { searchQuery, filteredData, search } = useSearch(allTasksData);
    const visibleTasks = searchQuery
        ? filteredData           // Show all if searching
        : filteredData.slice(0, visibleCount); // Show limited if not



    const [modalVisible2, setModalVisible2] = useState(false);
    const [modalVisible3, setModalVisible3] = useState(false);
    const [fullImageUri, setFullImageUri] = useState(null);
    const [note, setNote] = useState('');
    const [taskId, setTaskId] = useState(null);
    const { showAlertModal, hideAlert } = useGlobalAlert();

    // const [fontsLoaded] = useFonts({
    //     Montserrat_600SemiBold,
    //     Montserrat_500Medium,
    //     Montserrat_400Regular,
    // });

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
        wait(2000).then(() => setRefreshing(false));
    }, []);

    const fetchData = async () => {
        try {
            const response = await TaskService.getAssignedTask();
            console.log('sdkjhfjskdfhsdfs', response)
            if (response.status == 1) {
                setAllTasksData(response.data || []);
                // setVisibleTasks(response.data?.slice(0, 5) || []);
                search('', response.data); //
            } else {
                setAllTasksData([]);
                // setVisibleTasks([]);
                search('', []);
            }

        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };


    const taskAccept = async (task_Id) => {
        try {
            setLoading(true);
            const response = await TaskService.acceptTask({ taskId: task_Id });
            if (response.status == 1) {
                showAlertModal("Task Accepted Successfully!", false);
                setTimeout(() => {
                    hideAlert();
                }, 3000)

                // sentNotification(task_Id);
                navigation.navigate('Accepted')
                setLoading(false);
            } else {
                showAlertModal("Error Failed to accept task. Please try again.", true);
                setLoading(false);
            }
        } catch (error) {
            console.error('Error accepting task:', error);
            setLoading(false);
        }
    }



    const handleSave = async () => {
        try {
            const userId = await AsyncStorage.getItem('user_id');
            const response = await TaskService.declineTask({ taskId: taskId, empId: userId, remarks: note });
            if (response.status == 1) {
                showAlertModal("Task Rejected Successfully!", false);
                setTimeout(() => {
                    hideAlert();
                }, 3000)
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

    const declineTaskByUser = async (task_Id) => {
        setTaskId(task_Id);
        setModalVisible3(true)
    }

    const handleOpenModal = async (task) => {
        setModalVisible(true);
        setSelectedTaskDesc(task);
        try {
            const response = await TaskService.getTaskComments({ taskId: task.id });
            setSelectedTask(response.data);
        }
        catch (error) {
            // console.error('Error fetching task comments:', error);
        }
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

            // Update the state with the new comment data
            setSelectedTask(prev => [...prev, response.data]);
            setCommentText('');
            setImages([]); // Clear images after submission

            // Optionally, fetch the latest task comments
            const res = await TaskService.getTaskComments({ taskId: selectedItem.id });
            setSelectedTask(res.data);

        } catch (error) {
            console.error('Error sending comment:', error);
        }
    };

    // Camera Open
    const requestPermission = async (type) => {
        try {
            let permission;
            if (type === 'camera') {
                permission = await ImagePicker.requestCameraPermissionsAsync();
                console.log("Camera permission response:", permission);
            } else {
                permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                console.log("Gallery permission response:", permission);
            }

            return permission.granted === true;
        } catch (error) {
            console.error("Permission error:", error);
            return false;
        }
    };


    const openCamera = async () => {
        const hasPermission = await requestPermission('camera');
        if (!hasPermission) {
            Alert.alert('Permission Required', 'Camera access is needed to take pictures.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,  // Start with high quality to get the original image
            base64: true,  // Required for base64 upload
        });

        if (!result.canceled && result.assets?.length > 0) {
            const image = result.assets[0];

            // Compress the image to under 50KB
            const compressedImage = await compressImage(image.uri);

            // Update state with the compressed image
            setImages([compressedImage]);
        }
    };


    const openGallery = async () => {
        const hasPermission = await requestPermission('gallery');
        if (!hasPermission) {
            Alert.alert('Permission Required', 'Gallery access is needed to select images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
            base64: true,
        });

        if (!result.canceled && result.assets?.length > 0) {
            const image = result.assets[0];

            const compressedImage = await compressImage(image.uri);

            setImages([compressedImage]);
        }
    };

    const compressImage = async (uri) => {
        let sizeInKB = Infinity;
        let compressedImage = { uri };

        while (sizeInKB > 50) {
            const manipulated = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 500 } }],
                {
                    compress: 0.5,
                    format: ImageManipulator.SaveFormat.JPEG,
                    base64: true,
                }
            );

            sizeInKB = manipulated.base64.length * (3 / 4) / 1024;

            if (sizeInKB <= 50) {
                compressedImage = manipulated;
                break;
            }

            uri = manipulated.uri; // Use the new URI for further compression
        }

        console.log(`Compressed image size: ${Math.round(sizeInKB)} KB`);
        return compressedImage;
    };


    const selectImages = () => {
        Alert.alert(
            'Select Image',
            'Choose an option',
            [
                { text: 'Camera', onPress: openCamera },
                { text: 'Gallery', onPress: openGallery },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handleDeleteImage = (index) => {
        const updatedImages = images.filter((_, i) => i !== index);
        setImages(updatedImages);
    };

    // const sentNotification = async (taskId) => {
    //     const userId = await AsyncStorage.getItem('user_id');
    //     const userName = await AsyncStorage.getItem('user_name');
    //     let request = {
    //         "message": `Task ID: ${taskId} has been accepted by ${userName}.`,
    //         "srcEmp": userId,
    //         "tgtEmp": null,
    //         "pageId": 0,
    //         "module": "Operation"
    //     }

    //     const response = await TaskService.generateNotification(request);
    //     console.log("Notification response:", response.data);
    // }
    // if (!fontsLoaded) {
    //     return null;
    // }

    // Call Button
    const makeCall = (call) => {
        Linking.openURL(`tel:${call}`);
    };

    return (
        <SafeAreaView style={[
            styles.container,
            GlobalStyles.SafeAreaView,

        ]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                    <TouchableOpacity onPress={() => navigation.navigate("TaskStack", { screen: "TaskScreen" })} style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <Image style={{ width: 14, height: 14, }} source={require('../../../assets/leftarrow.png')} />
                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 18, color: '#2F81F5', marginLeft: 4, }}>Assigned Task</Text>
                    </TouchableOpacity>
                    <View >
                        <TouchableOpacity onPress={() => navigation.navigate('Notification')} >
                            <NotificationCount></NotificationCount>
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
                    <View style={{ flexDirection: 'row', paddingTop: 20, }}>
                        <TaskStatusTabs activeTab="Assigned" />
                    </View>
                </ScrollView> */}

                <View style={{ paddingHorizontal: 3, }}>
                    {visibleTasks && visibleTasks.length > 0 ? (
                        visibleTasks.map((task, index) => (
                            <View key={task.id ?? index} style={styles.mainbox}>
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
                                        {/* {
                                            task?.pickUpLocation?.client_name && (
                                                <View style={{ position: 'relative' }}>
                                                    <Image style={{ position: 'absolute', left: 0, top: 0, width: 16, height: 16 }} source={require('../../../assets/asicon4.png')} />
                                                    <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#0C0D36', paddingLeft: 20 }}>
                                                        {task?.pickUpLocation?.client_name}
                                                    </Text>
                                                </View>
                                            )

                                        } */}

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
                                        <View>
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

                                <View style={{ borderTopWidth: 1, borderTopColor: '#ECEDF0', padding: 15, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <TouchableOpacity style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12 }} onPress={() => declineTaskByUser(task.id)}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#2F81F5', textAlign: 'center' }} >Reject</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => taskAccept(task.id)} style={{ width: '47%', backgroundColor: '#2F81F5', borderRadius: 28, padding: 12 }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#fff', textAlign: 'center' }}>Accept</Text>
                                    </TouchableOpacity>
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


                    {!searchQuery && visibleTasks.length < filteredData.length && (
                        <TouchableOpacity
                            onPress={handleLoadMore}
                            style={{
                                backgroundColor: '#2F81F5',
                                marginHorizontal: 20,
                                marginTop: 15,
                                padding: 12,
                                borderRadius: 10,
                                alignItems: 'center',
                                marginBottom: 50,
                                flexDirection: 'row',
                                justifyContent: 'center',
                            }}
                            disabled={loadingMore}
                        >
                            {loadingMore ? (
                                <>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text style={{ color: 'white', marginLeft: 10, fontFamily: 'Montserrat_600SemiBold' }}>
                                        Loading...
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={{ color: 'white', fontFamily: 'Montserrat_600SemiBold' }}>
                                        Load More
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                </View>


                {/* Comments Modal Start Here */}
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


                                <View style={{ padding: 15, }}>
                                    <View>
                                        <Text style={styles.label}>Description</Text>
                                        <TextInput
                                            style={styles.textarea} value={selectedItem?.description}
                                            placeholder="Placeholder"
                                            multiline={true}
                                        />
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
                            </ScrollView>

                        </View>
                    </View>
                </Modal>


                {/* Modal for Full Image */}
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


                {/* Reject remarks modal */}
                <Modal visible={modalVisible3} transparent={true} animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.title}>Enter your remarks</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Write something..."
                                placeholderTextColor="#aaa"
                                multiline={true}
                                numberOfLines={6}
                                value={note}
                                onChangeText={setNote}
                            />

                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={styles.buttonClose} onPress={handleClose}>
                                    <Text style={styles.buttonText}>Close</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.buttonSave} onPress={handleSave}>
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
        fontFamily: 'Montserrat_400Regular',
        height: 54,
        borderWidth: 1,
        borderColor: '#ECEDF0',
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 15,
        marginBottom: 15,
        borderRadius: 10,
    },
    textarea: {
        fontFamily: 'Montserrat_400Regular',
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
        marginTop: 8,
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

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '95%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    textArea: {
        height: 120,
        borderColor: '#ccc',
        borderWidth: 1,
        textAlignVertical: 'top',
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
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

})
export default Assigned
