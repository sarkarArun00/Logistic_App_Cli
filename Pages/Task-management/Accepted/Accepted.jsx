import { useState, useEffect, useCallback, useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    StyleSheet, View, Text, Alert, TouchableOpacity, Image, ScrollView, TextInput, Linking, Modal, RefreshControl, ActivityIndicator
} from 'react-native';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium, Montserrat_400Regular } from '@expo-google-fonts/montserrat';
import TaskService from '../../Services/task_service';
import TaskStatusTabs from '../TaskStatusTabs'
import NotificationCount from '../../Notifications/NotificationCount';
import GlobalStyles from '../../GlobalStyles';
import { useGlobalAlert } from '../../../Context/GlobalAlertContext';




const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};

function Accepted({ navigation }) {
    // Hooks must be declared at the top — not conditionally
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [visibleTasks, setVisibleTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState([]);
    const [selectedItem, setSelectedTaskDesc] = useState('');
    const [visibleCount, setVisibleCount] = useState(5);
    const [allTasksData, setAllTasksData] = useState([]);
    const [loadingMore, setLoadingMore] = useState(false);

    const { showAlertModal, hideAlert } = useGlobalAlert();

    // const [fontsLoaded] = useFonts({
    //     Montserrat_600SemiBold,
    //     Montserrat_500Medium,
    //     Montserrat_400Regular,
    // });

    useEffect(() => {
        fetchAcceptedData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAcceptedData();
        wait(2000).then(() => setRefreshing(false));
    }, []);


    const fetchAcceptedData = async () => {
        try {
            const response = await TaskService.getAcceptedTask();
            if (response.status == 1) {

                setAllTasksData(response.data || []);
                setVisibleTasks(response.data?.slice(0, 5) || []);
            } else {
                setAllTasksData([]);
                setVisibleTasks([]);
            }
        } catch (error) {
            // console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const startTask = async (task_Id) => {
        try {
            setLoading(true)
            const response = await TaskService.startNewTask({ taskId: task_Id });
            if (response.status == 1) {
                showAlertModal('Task Started Successfully', false);
                sentNotification(task_Id);
                fetchAcceptedData();
                navigation.navigate('In Progress')
                setLoading(false)
            } else {
                showAlertModal(response.data, true);
                setLoading(false)
            }
        } catch (error) {
            console.error('Error starting task:', error);
            setLoading(false)
        }
    }

    const sentNotification = async (taskId) => {
        const userId = await AsyncStorage.getItem('user_id');
        const userName = await AsyncStorage.getItem('user_name');
        let request = {
            "message": `Task ID: ${taskId} has been started by ${userName}.`,
            "srcEmp": userId,
            "tgtEmp": null,
            "pageId": 0,
            "module": "Operation"
        }

        const response = await TaskService.generateNotification(request);
        console.log("Notification response:", response.data);
    }

    const handleLoadMore = () => {
        setLoadingMore(true);
        setTimeout(() => {
            const newCount = visibleCount + 5;
            setVisibleCount(newCount);
            setVisibleTasks(allTasksData.slice(0, newCount));
            setLoadingMore(false);
        }, 500);
    };


    const handleOpenModal = async (task) => {
        setModalVisible(true);
        setSelectedTaskDesc(task);
    };

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

    // Call Button
    const makeCall = (call) => {
        Linking.openURL(`tel:${call}`);
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

    return (
        <SafeAreaView style={[styles.container, GlobalStyles.SafeAreaView]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                    <TouchableOpacity onPress={() => navigation.navigate('MainApp', { screen: 'TaskScreen' })} style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <Image style={{ width: 14, height: 14, }} source={require('../../../assets/leftarrow.png')} />
                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 18, color: '#2F81F5', marginLeft: 4, }}>Task Management</Text>
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
                    />
                    <Image style={{ position: 'absolute', top: 16, right: 20, width: 20, height: 20, }} source={require('../../../assets/search.png')} />
                </View>

                {/* Tab Navigation */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                    <TaskStatusTabs activeTab="Accepted" />
                </ScrollView>

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
                                        {/* <View style={{ position: 'relative' }}>
                                            <Image style={{ position: 'absolute', left: 0, top: 0, width: 16, height: 16 }} source={require('../../../assets/asicon4.png')} />
                                            <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#0C0D36', paddingLeft: 20 }}>
                                                {task?.pickUpLocation?.client_name ?? task?.pickUpLocation?.centreName ?? '...'}

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
                                    {/*<TouchableOpacity style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12 }} onPress={() => navigation.navigate('mapNavigation', { task: task })}> */}
                                    <TouchableOpacity style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12 }} onPress={() => navigateToUserLocation(task)}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#2F81F5', textAlign: 'center' }}>Navigate</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => startTask(task.id)} style={{ width: '47%', backgroundColor: '#2F81F5', borderRadius: 28, padding: 12 }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#fff', textAlign: 'center' }}>Start</Text>
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

                    {/* Load More */}
                    {visibleTasks?.length < allTasksData?.length && (
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


                {/* Modal Start Here */}
                <Modal
                    visible={modalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setModalVisible(false)}>
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                                <Text style={styles.modalText}>More Information</Text>
                                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                                    <Image style={{ width: 18, height: 18, }} source={require('../../../assets/mdlclose.png')} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ padding: 15, }}>
                                {/* <View style={{ marginBottom: 10, }}>
                                    <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 15, paddingBottom: 15, }}>Akash Kundu (#ABG70015) </Text>
                                    <View style={{ flexDirection: 'row', marginBottom: 10, }}>
                                        <View style={{ width: 24, height: 24, borderWidth: 1, borderColor: '#1AA123', borderRadius: '50%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                                            <Image style={{ width: 14, height: 14, }} source={require('../../../assets/texticon2.png')} />
                                        </View>
                                        <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 15, paddingLeft: 10, }}>Container Name (Bar Code)</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', marginBottom: 10, }}>
                                        <View style={{ width: 24, height: 24, borderWidth: 1, borderColor: '#1AA123', borderRadius: '50%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                                            <Image style={{ width: 14, height: 14, }} source={require('../../../assets/texticon2.png')} />
                                        </View>
                                        <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 15, paddingLeft: 10, }}>Container Name (Bar Code)</Text>
                                    </View>

                                </View> */}

                                <View>
                                    <Text style={styles.label}>Description</Text>
                                    <TextInput
                                        style={styles.textarea} value={selectedItem?.description || 'No Description'}
                                        placeholder="Placeholder"
                                        multiline={true}
                                    />
                                </View>

                                <TouchableOpacity onPress={() => { setModalVisible(false); }} style={{ backgroundColor: '#2F81F5', borderRadius: 28, paddingVertical: 16, paddingHorizontal: 10, }}>
                                    <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: 'white', textAlign: 'center', }}>Close</Text>
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
    }


})

export default Accepted