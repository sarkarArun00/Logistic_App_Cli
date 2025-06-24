import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium } from '@expo-google-fonts/montserrat';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TaskService from '../Services/task_service';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';




function Notification({ navigation }) {
    const [selectedTab, setSelectedTab] = useState('All');
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approvals, setApprovals] = useState([]);


    useFocusEffect(
        React.useCallback(() => {
            const markAllAsSeen = async () => {
                const response = await TaskService.getAllGeneralNotifications();
                console.log('Response seenNotificationIds:', response);
                if (response.status == 1) {
                    const ids = response.data.map(n => n.id);
                    await AsyncStorage.setItem("seenNotificationIds", JSON.stringify(ids));
                }
            };

            const fetchData = async () => {
                try {
                    const response = await TaskService.getAllGeneralNotifications();
                    if (response.status == 1) {
                        const allNotifications = response.data;
                        setNotifications(allNotifications);
                        const seenIds = allNotifications.map(n => n.id);
                        await AsyncStorage.setItem("seenNotificationIds", JSON.stringify(seenIds));
                    }
                } catch (error) {
                    console.error('Error fetching notifications:', error);
                } finally {
                    setLoading(false);
                }
            };

            const fetchEmployeeApprovals = async () => {
                try {
                    const response = await TaskService.getEmployeeApprovals();
                    if (response.status == 1) {
                        console.log('Response:', response);
                        setApprovals(response.data);
                    } else {
                        console.log('Response: No data found');
                    }
                } catch (err) {
                    console.log("Error in getEmployeeApprovals:", err);
                }
            };

            markAllAsSeen();
            fetchData();
            fetchEmployeeApprovals();
        }, [])
    );


    const handleApprove = async (id) => {
        try {
            const response = await TaskService.approveApproval({notifId: id});
            if (response.status == 1) {
                console.log('Approval successful:', response);
                setApprovals(prev => prev.filter(item => item.id !== id));
            } else {
                console.log('Approval failed:', response);
            }
        } catch (error) {
            console.error('Error approving employee:', error);
        }
    }

    const handleDecline = async (id) => {
        try {
            const response = await TaskService.declineApproval({notifId: id});
            if (response.status == 1) {
                console.log('Decline successful:', response);
                setApprovals(prev => prev.filter(item => item.id !== id));
            } else {
                console.log('Decline failed:', response);
            }
        } catch (error) {
            console.error('Error declining employee:', error);
        }
    }

    const filteredNotifications = () => {
        return notifications.filter(n => n.status == 0 || n.status == '0');
    };

    const NotificationItem = ({ item }) => (
        <View style={styles.notificationContainer}>
            <Ionicons name={item.status == '1' ? "mail-outline" : "mail-outline"} size={32}
                color={item.status == '1' ? "#64748B" : "#1E40AF"} style={styles.icon} />
            <View style={styles.textContainer}>
                <Text style={styles.name}>{item.name} <Text style={styles.message}>{item.message}</Text></Text>
                <Text style={styles.time}>{dayjs(item.createdAt).format('DD-MM-YY HH:mm')}</Text>
            </View>
        </View>
    );


    return (
        <SafeAreaView style={styles.container}>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', }}>
                    <Image style={{ width: 14, height: 14, }} source={require('../../assets/leftarrow.png')} />
                    <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, color: '#2F81F5', marginLeft: 4, }}>Notifications</Text>
                </TouchableOpacity>
                {/* <View style={{ position: 'relative', width: 50, height: 50, borderRadius: '50%', backgroundColor: '#F6FAFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                    <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
                        <Image style={{ width: 18, height: 18, }} source={require('../../assets/noti.png')} />
                    </TouchableOpacity>
                    <NotificationCount></NotificationCount>
                    <Text style={{ position: 'absolute', fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 13, color: '#fff', right: 0, top: 0, width: 15, height: 15, backgroundColor: '#F43232', borderRadius: 50, textAlign: 'center', }}>{notifications?.length}</Text>
                </View> */}
            </View>

            <View style={styles.tabs}>
                <View style={styles.borderLine}></View>
                {['All', 'Approval'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tab,
                            selectedTab === tab && styles.activeTab
                        ]}
                        onPress={() => setSelectedTab(tab)}
                    >
                        <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Separate FlatLists based on tab */}
            {selectedTab === 'All' ? (
                <FlatList
                    data={notifications}
                    renderItem={({ item }) => <NotificationItem item={item} />}
                    keyExtractor={item => item.id.toString()}
                />
            ) : (
                <FlatList
                    data={approvals}
                    renderItem={({ item }) => (
                        <View style={styles.notificationContainer}>
                            {/* Notification Content */}
                            <View style={styles.textContainer}>
                                <Text style={styles.name}>
                                    {item.name} <Text style={styles.message}>{item.message}</Text>
                                </Text>
                            </View>

                            {/* Buttons */}
                            <View style={styles.buttonRow}>
                                <View>
                                    <Text style={styles.time}>{item.time} {dayjs(item.createdAt).format('DD-MM-YY HH:mm')}</Text>
                                </View>
                                <View style={{flexDirection:'row', alignItems:'center', gap:5, }}>
                                    <TouchableOpacity
                                        style={[styles.button, { backgroundColor: '#10B981' }]} // Green
                                        onPress={() => handleApprove(item.id)}
                                    >
                                        <Text style={styles.buttonText}>Approve</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.button, { backgroundColor: '#EF4444' }]} // Red
                                        onPress={() => handleDecline(item.id)}
                                    >
                                        <Text style={styles.buttonText}>Decline</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                    keyExtractor={item => item.id.toString()}
                    ListEmptyComponent={() => (
                        <Text style={{ textAlign: 'center', marginTop: 350, color: '#999' }}>
                            No approval notifications.
                        </Text>
                    )}
                    contentContainerStyle={styles.flatListContent}
                />


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
    notificationContainer: {
        // flexDirection: 'row',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
    },
    icon: {
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    name: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 16,
        color: '#0C0D36'
    },
    message: {
        fontFamily: 'Montserrat-Medium',
        color: '#4B5563',
    },
    time: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 15,
        color: '#A5ACB8',
        marginTop: 8,
    },
    tabs: {
        position: 'relative',
        flexDirection: 'row',
        gap: 32,
        marginTop: 15,
    },
    borderLine: {
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#E4E8EE',
    },
    tabText: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 16,
        paddingBottom: 15,
    },
    activeTabText: {
        color: '#3082F8',
        borderBottomWidth: 2,
        borderBottomColor: '#3082F8',
    },


    itemContainer: {
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    text: {
        fontSize: 16,
        marginBottom: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginTop:5,
    },
    button: {
        height:40,
        paddingHorizontal: 14,
        paddingVertical: 0,
        borderRadius: 6,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
})

export default Notification;

