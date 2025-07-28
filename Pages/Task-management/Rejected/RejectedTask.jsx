import { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, TextInput, Linking, Modal, RefreshControl, FlatList, Alert } from 'react-native'
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium, Montserrat_400Regular } from '@expo-google-fonts/montserrat'
import { Picker } from '@react-native-picker/picker';
import { Checkbox } from 'react-native-paper';
// import FontAwesome from '@expo/vector-icons/FontAwesome';
// import * as ImagePicker from 'expo-image-picker';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import TaskStatusTabs from '../TaskStatusTabs'
import TaskService from '../../Services/task_service';
import NotificationCount from '../../Notifications/NotificationCount';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {GlobalStyles} from '../../GlobalStyles';
import { Vibration } from 'react-native';
import { useSearch } from '../../../hooks/userSearch1';





const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};



function RejectedTask({ navigation }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [payMdlVisible, setpayMdlVisible] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState();
    const [collectModalVisible, setCollectModalVisible] = useState(false);
    const [checked, setChecked] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState([]);
    const [selectedItem, setSelectedTaskDesc] = useState('');
    const [commentText, setCommentText] = useState('');
    const [collectCommentText, setCollectCommentText] = useState('');
    const [selectedTaskId, setTaskId] = useState('');
    const [allTasksData, setAllTasksData] = useState([]);
    // const [visibleTasks, setVisibleTasks] = useState([]);
    const [visibleCount, setVisibleCount] = useState(5);
    const { searchQuery, filteredData, search } = useSearch(allTasksData);
    const visibleTasks = searchQuery
        ? filteredData           // Show all if searching
        : filteredData.slice(0, visibleCount); // Show limited if not
    const [refreshing, setRefreshing] = useState(false);

    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = String(date.getFullYear()).slice(-2); // Get last two digits
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;

        return `${day}-${month}-${year} ${hour12}:${minutes} ${ampm}`;
    };


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await TaskService.getMyRejectedTasks();
            if (response.status == 1) {
                setAllTasksData(response.data || []);
                // setVisibleTasks(response.data?.slice(0, 5) || []);
                search('',response.data)
            } else {
                setAllTasksData([]);
                // setVisibleTasks([]);
                search('',[])
            }
        } catch (error) {
            // console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    // Camera Open
    const requestPermission = async (type) => {
        if (type === 'camera') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            return status === 'granted';
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            return status === 'granted';
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
            quality: 1,
        });

        if (!result.canceled) {
            const newImage = { uri: result.assets[0].uri };
            setImages((prev) => [...prev, newImage]);
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
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled) {
            const newImages = result.assets.map((asset) => ({ uri: asset.uri }));
            setImages((prev) => [...prev, ...newImages]);
        }
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

    // Camera End

    const handleOpenModal = async (task) => {
        const response = await TaskService.getTaskComments({ taskId: task.id });
        setSelectedTask(response.data);

        setModalVisible(true);
        setSelectedTaskDesc(task);
    };

    // Call Button
    const makeCall = () => {
        Linking.openURL("tel:7001140151");
    };


    const onRefresh = useCallback(() => {
        fetchData();
        wait(2000).then(() => setRefreshing(false));
    }, []);


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

    return (
        <SafeAreaView style={[styles.container, GlobalStyles.SafeAreaView]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }} >
                    <TouchableOpacity onPress={() => navigation.navigate("TaskStack", { screen: "TaskScreen" })} style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <Image style={{ width: 14, height: 14, }} source={require('../../../assets/leftarrow.png')} />
                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 18, color: '#2F81F5', marginLeft: 4, }}>Rejected Task</Text>
                    </TouchableOpacity>
                    <View>
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
                        onChangeText={(text)=> search(text, allTasksData)}
                    />
                    <Image style={{ position: 'absolute', top: 16, right: 20, width: 20, height: 20, }} source={require('../../../assets/search.png')} />
                </View>

                {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                    <TaskStatusTabs activeTab="Rejected Task" />
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
                                        <TouchableOpacity onPress={() => makeCall(task?.contactNumber)}>
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
                                                Task ID: {task?.displayId ?? 'NA'}
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
                                        {/* <View style={{ position: 'relative' }}>
                                            <Image style={{ position: 'absolute', left: 0, top: 0, width: 16, height: 16 }} source={require('../../../assets/asicon4.png')} />
                                            <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#0C0D36', paddingLeft: 20 }}>
                                                {task?.employee?.employee_name ?? 'No Name'}
                                            </Text>
                                        </View> */}

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

                                <View style={{ borderTopWidth: 1, borderTopColor: '#ECEDF0', padding: 15, marginTop: 12, flexDirection: 'row', alignItems: 'center', }}>
                                    <View><Image style={{ width: 22, height: 22, }} source={require('../../../assets/Cross.png')} /></View>
                                    <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 12, color: '#2F81F5', paddingLeft: 8, }}>Task Rejected at {formatDateTime(task.updated_at)}</Text>
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
                            <View style={{ padding: 15, }}>
                                <View>
                                    <Text style={styles.label}>Client Name</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectedLanguage}
                                            onValueChange={(itemValue, itemIndex) =>
                                                setSelectedLanguage(itemValue)
                                            }>
                                            <Picker.Item label="Arun Sarkar" value="Arun Sarkar" />
                                            <Picker.Item label="Akash Kundu" value="Akash Kundu" />
                                            <Picker.Item label="Arijit Ghosal" value="Arijit Ghosal" />
                                        </Picker>
                                    </View>
                                </View>
                                <View>
                                    <Text style={styles.label}>Payment Mode</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectedLanguage}
                                            onValueChange={(itemValue, itemIndex) =>
                                                setSelectedLanguage(itemValue)
                                            }>
                                            <Picker.Item label="Cash" value="Cash" />
                                            <Picker.Item label="UPI" value="UPI" />
                                            <Picker.Item label="Net Banking" value="Net Banking" />
                                        </Picker>
                                    </View>
                                </View>
                                <View>
                                    <Text style={styles.label}>Enter Amount</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Amount"
                                        placeholderTextColor="#0C0D36"
                                    />
                                </View>
                                <View>
                                    <Text style={styles.label}>Remarks</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Placeholder"
                                        placeholderTextColor="#0C0D36"
                                    />
                                </View>
                                <View>
                                    <TouchableOpacity style={{ backgroundColor: '#2F81F5', borderRadius: 28, paddingVertical: 16, paddingHorizontal: 10, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: 'white', textAlign: 'center', }}>Generate Receipt</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                        </View>
                    </View>
                </Modal>

                {/* Collect Modal */}
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

                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={{ backgroundColor: '#7a7a79', borderRadius: 28, paddingVertical: 16, paddingHorizontal: 10, marginTop: 12 }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: 'white', textAlign: 'center', }}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>

                        </View>
                    </View>
                </Modal>

            </ScrollView>
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
        marginBottom:20,
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

export default RejectedTask;
