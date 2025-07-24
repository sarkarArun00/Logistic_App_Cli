import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Linking, TextInput, Modal, ActivityIndicator, RefreshControl } from 'react-native';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium } from '@expo-google-fonts/montserrat';
import { Picker } from '@react-native-picker/picker';
import TaskStatusTabs from '../TaskStatusTabs';
import TaskService from '../../Services/task_service';
import NotificationCount from '../../Notifications/NotificationCount';

import {GlobalStyles} from '../../GlobalStyles';
import { useSearch } from '../../../hooks/userSearch1';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; // install if not already

// import { useSearch } from '../../../hooks/useSearch';

const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};




function Completed({ navigation }) {
    const [filter, setFilter] = useState(false);
    const [selectClient, setSelectClient] = useState();
    const [selectTask, setSelectTask] = useState();
    const [selectPriority, setSelectPriority] = useState();
    const [loading, setLoading] = useState(true);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [visibleCount, setVisibleCount] = useState(5);
    const { searchQuery, filteredData, search } = useSearch(completedTasks);
    const visibleTasks = searchQuery
        ? filteredData           // Show all if searching
        : filteredData.slice(0, visibleCount); // Show limited if not

    const [clients, setClients] = useState([]);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${year}-${month}-${day}`; 
    };


    const handleFromDateChange = (event, selectedDate) => {
        setShowFromDatePicker(false);
        if (selectedDate) {
            setFromDate(formatDate(selectedDate));
        }
    };

    const handleToDateChange = (event, selectedDate) => {
        setShowToDatePicker(false);
        if (selectedDate) {
            setToDate(formatDate(selectedDate));
        }
    };



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
    useEffect(() => {
        fetchClients(); // New call for clients
    }, []);


    const onRefresh = useCallback(() => {
        fetchData();
        fetchClients();
        wait(2000).then(() => setRefreshing(false));
    }, []);

    const fetchClients = async () => {
        try {
            const response = await TaskService.getClientListByLogistic();
            console.log("Get All clients:", response.data)
            if (response?.status == 1) {
                setClients(response.data);
                if (response.data.length > 0) {
                    setSelectClient(response.data[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };
    const fetchData = async () => {
        setLoading(true)
        try {
            const payload =
            {
                "fromDate": null,
                "toDate": null,
                "clientId": null,
                "taskType": null,
                "priority": null
            }
            const response = await TaskService.getMyCompletedTasks(payload);
            if (response.status == 1) {
                setCompletedTasks(response.data);
                search('', response.data); // initialize filtered data
                va(false)
            } else {
                setCompletedTasks([]);
                search('', []); // empty list if error
                setLoading(false)
            }
        } catch (error) {
            // console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };
    const applyFilters = async () => {
        setLoading(true);
        try {
            const payload = {
                fromDate: fromDate || null,
                toDate: toDate || null,
                clientId: selectClient || null,
                taskType: selectTask || null,
                priority: selectPriority === 'true' ? true : (selectPriority === 'false' ? false : null)
            };


            const response = await TaskService.getMyCompletedTasks(payload);

            if (response.status === 1) {
                setCompletedTasks(response.data);
                search('', response.data);
                setFilter(false);
            } else {
                setCompletedTasks([]);
                search('', []);
            }
        } catch (error) {
            console.error('Filter apply failed:', error);
        } finally {
            setLoading(false);
        }
    };



    const makeCall = (call) => {
        Linking.openURL(`tel:${call}`);
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

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                    <TouchableOpacity onPress={() => navigation.navigate("TaskStack", { screen: "TaskScreen" })} style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <Image style={{ width: 14, height: 14, }} source={require('../../../assets/leftarrow.png')} />
                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 18, color: '#2F81F5', marginLeft: 4, }}>Completed Task</Text>
                    </TouchableOpacity>
                    <View >
                        <TouchableOpacity onPress={() => navigation.navigate('Notification')} >
                        <View pointerEvents="none">
                                <NotificationCount />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* <View style={{ position: 'relative', marginTop: 20, }}>
                    <TextInput
                        style={{ fontSize: 14, fontFamily: 'Montserrat_500Medium', height: 50, backgroundColor: '#F6FAFF', borderRadius: 30, paddingLeft: 20, paddingRight: 50, }}
                        placeholder="Search"
                        placeholderTextColor="#0C0D36"
                    />
                    <Image style={{ position: 'absolute', top: 16, right: 20, width: 20, height: 20, }} source={require('../../../assets/search.png')} />
                </View> */}
                <View style={{ flexDirection: 'row', marginTop: 20, }}>
                    <View style={{ flex: 1, position: 'relative', }}>
                        <TextInput
                            style={{ fontSize: 14, fontFamily: 'Montserrat_500Medium', height: 50, backgroundColor: '#F6FAFF', borderRadius: 30, paddingLeft: 20, paddingRight: 50, }}
                            placeholder="Search"
                            placeholderTextColor="#0C0D36"
                            value={searchQuery}
                            onChangeText={(text) => search(text, completedTasks)}

                        />
                        <Image style={{ position: 'absolute', top: 16, right: 20, width: 20, height: 20, }} source={require('../../../assets/search.png')} />
                    </View>
                    <TouchableOpacity onPress={() => setFilter(true)} style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: '#F6FAFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginLeft: 14, }}>
                        <Image style={{ width: 25, height: 25, }} source={require('../../../assets/filter.png')} />
                        {/* <Text style={{ position: 'absolute', fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 13, color: '#fff', right: 0, top: 0, width: 15, height: 15, backgroundColor: '#F43232', borderRadius: 50, textAlign: 'center', }}>2</Text> */}
                    </TouchableOpacity>
                </View>

                {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                    <TaskStatusTabs activeTab="Completed" />
                </ScrollView> */}

                <View style={{ paddingHorizontal: 3, }}>
                    {visibleTasks && visibleTasks.length > 0 ? (
                        visibleTasks.map((task, index) => (
                            <View style={styles.mainbox} key={task.id || index}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, }}>
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', }}>
                                        <View style={{ width: 29, height: 29, borderRadius: '50%', backgroundColor: '#edfafc', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', }}>
                                            <Image style={{ width: 17, height: 17, }} source={require('../../../assets/texticon.png')} />
                                        </View>
                                        <Text style={{ flex: 1, paddingLeft: 7, fontFamily: 'Montserrat_500Medium', fontSize: 15, color: '#2F81F5', }}>{task.taskType?.taskType}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, }}>
                                        <TouchableOpacity onPress={() => makeCall(task?.employee?.phoneNumber)}><Image style={{ width: 20, height: 20, }} source={require('../../../assets/call.png')} /></TouchableOpacity>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', padding: 15, }}>
                                    <View style={{ flex: 1, }}>
                                        <View style={{ position: 'relative', marginBottom: 5, }}>
                                            <Image style={{ position: 'absolute', left: 0, top: 0, width: 12, height: 12, }} source={require('../../../assets/asicon1.png')} />
                                            <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#0C0D36', paddingLeft: 20, }}>Task ID: {task?.displayId ?? 'NA'}</Text>
                                        </View>
                                        <View style={{ position: 'relative', marginBottom: 5, }}>
                                            <Image style={{ position: 'absolute', left: 0, top: 0, width: 11, height: 13, }} source={require('../../../assets/asicon2.png')} />
                                            <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#0C0D36', paddingLeft: 20, }}>{task?.pickUpLocation?.address ?? 'No Address'}</Text>
                                        </View>
                                        <View style={{ position: 'relative', marginBottom: 5, }}>
                                            <Image style={{ position: 'absolute', left: 0, top: 0, width: 13, height: 13, }} source={require('../../../assets/asicon3.png')} />
                                            <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#0C0D36', paddingLeft: 20, }}>{task?.preferredTime?.start_time?.slice(0, 5)} - {task?.preferredTime?.end_time?.slice(0, 5)}</Text>
                                        </View>
                                        <View style={{ position: 'relative', marginBottom: 5 }}>
                                            <Image style={{ position: 'absolute', left: 0, top: 0, width: 13, height: 13 }} source={require('../../../assets/asicon4.png')} />
                                            <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#0C0D36', paddingLeft: 20 }}>
                                                Assigned By: {task?.assigned?.assigner?.employee_name}
                                                {/* Assigned By:  */}
                                            </Text>
                                        </View>
                                        {/* <View style={{ position: 'relative', }}>
                                            <Image style={{ position: 'absolute', left: 0, top: 0, width: 16, height: 16, }} source={require('../../../assets/asicon4.png')} />
                                            <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#0C0D36', paddingLeft: 20, }}>{task?.pickUpLocation?.client_name ?? task?.pickUpLocation?.centreName ?? '...'}</Text>
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
                                    <View><Image style={{ width: 22, height: 22, }} source={require('../../../assets/tick.png')} /></View>
                                    <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 12, color: '#2F81F5', paddingLeft: 8, }}>Task Completed at {formatDateTime(task.updated_at)}</Text>
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

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={filter}
                    onRequestClose={() => setFilter(false)}
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>

                            {/* Header */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0' }}>
                                <Text style={styles.modalText}>Filter by:</Text>
                                <TouchableOpacity onPress={() => setFilter(false)}>
                                    <Image style={{ width: 18, height: 18 }} source={require('../../../assets/mdlclose.png')} />
                                </TouchableOpacity>
                            </View>

                            {/* Body */}
                            <View style={{ padding: 15 }}>

                                {/* Date Range */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                    {/* From Date */}
                                    <TouchableOpacity style={styles.dateInput} onPress={() => setShowFromDatePicker(true)}>
                                        <Text style={fromDate ? styles.dateText : styles.placeholderText}>
                                            {fromDate || 'From Date'}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* To Date */}
                                    <TouchableOpacity style={styles.dateInput} onPress={() => setShowToDatePicker(true)}>
                                        <Text style={toDate ? styles.dateText : styles.placeholderText}>
                                            {toDate || 'To Date'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>


                                {showFromDatePicker && (
                                    <DateTimePicker
                                        value={new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={handleFromDateChange}
                                    />
                                )}

                                {showToDatePicker && (
                                    <DateTimePicker
                                        value={new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={handleToDateChange}
                                    />
                                )}


                                {/* Client Picker */}
                                <View>
                                    <Text style={styles.label}>Client</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectClient}
                                            onValueChange={(itemValue) => setSelectClient(itemValue)}
                                        >
                                            {clients.length > 0 ? (
                                                clients.map(client => (
                                                    <Picker.Item
                                                        key={client.id}
                                                        label={client.client_name}
                                                        value={client.id}
                                                    />
                                                ))
                                            ) : (
                                                <Picker.Item label="No Clients Found" value="" />
                                            )}
                                        </Picker>
                                    </View>
                                </View>

                                {/* Task Type */}
                                <View>
                                    <Text style={styles.label}>Task Type</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectTask}
                                            onValueChange={(itemValue) => setSelectTask(itemValue)}
                                        >
                                            <Picker.Item label="All Tasks" value="" />
                                            <Picker.Item label="Pickup" value="pickup" />
                                            <Picker.Item label="Delivery" value="delivery" />
                                        </Picker>
                                    </View>
                                </View>

                                {/* Priority */}
                                <View>
                                    <Text style={styles.label}>Priority</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectPriority}
                                            onValueChange={(itemValue) => setSelectPriority(itemValue)}
                                        >

                                            <Picker.Item label="Normal" value="false" />
                                            <Picker.Item label="Urgent" value="true" />
                                        </Picker>
                                    </View>
                                </View>

                                {/* Footer Buttons */}
                                <View style={{ borderTopWidth: 1, borderTopColor: '#ECEDF0', paddingVertical: 25, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <TouchableOpacity
                                        style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12 }}
                                        onPress={() => {
                                            setFromDate(null);
                                            setToDate(null);
                                            setSelectClient(null);
                                            setSelectTask(null);
                                            setSelectPriority(null);
                                            fetchData(); // reset API
                                        }}
                                    >
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#2F81F5', textAlign: 'center' }}>Reset All</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{ width: '47%', backgroundColor: '#2F81F5', borderRadius: 28, padding: 12 }}
                                        onPress={applyFilters}
                                    >
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#fff', textAlign: 'center' }}>
                                            Apply Filters
                                        </Text>
                                    </TouchableOpacity>

                                </View>
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


    label: {
        fontSize: 13,
        fontFamily: 'Montserrat_500Medium',
        color: '#0C0D36',
        marginBottom: 5,
      },
    dateInput: {
        flex: 1,
        height: 50,
        backgroundColor: '#F6FAFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        justifyContent: 'center',
        paddingHorizontal: 12,
        marginHorizontal: 5,  // spacing between from & to date
      },
      dateText: {
        fontSize: 14,
        fontFamily: 'Montserrat_500Medium',
        color: '#0C0D36',
      },
      placeholderText: {
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
        color: '#999',
      }

})

export default Completed
