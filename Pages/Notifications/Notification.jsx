import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium } from '@expo-google-fonts/montserrat';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TaskService from '../Services/task_service';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { useNotification } from '../../Context/NotificationContext';
import { useGlobalAlert } from '../../Context/GlobalAlertContext';



function Notification({ navigation }) {
    const [selectedTab, setSelectedTab] = useState('General');
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approvals, setApprovals] = useState([]);
    const viewedIdsRef = useRef(new Set());
    const timeoutRef = useRef(null);
    const { setNotificationCount } = useNotification();
    const { showAlertModal, hideAlert } = useGlobalAlert();

    useEffect(() => {
        // const fetchData = async () => {
        //     try {
        //         setLoading(true)
        //         const response = await TaskService.getMyNotifications();
        //         console.log('Response seenNotificationIds:', response.data);
              
        //         if (response.status == 1) {
        //             const allNotifications = response.data.seen;
        //             setNotifications(allNotifications); 
        //             setNotificationCount(response.data.unseen.length);
        //             setLoading(false)
        //         }  else {
        //             setLoading(false)
        //         }
        //     } catch (error) {
        //         console.log('Error fetching notifications:', error);
        //     } finally {
        //         setLoading(false);
        //     }
        // };

        const fetchEmployeeApprovals = async () => {
            try {
                const response = await TaskService.getEmployeeApprovals({ module: 'Logistic' });
                console.log('Response: getEmployeeApprovals', response);

                if (response.status == 1 && response.data?.pending.length > 0) {
                    setApprovals(response.data?.pending);
                } else {
                    console.log('Response: No data found');
                }
            } catch (err) {
                console.log("Error in getEmployeeApprovals:", err);
            }
        };


        // fetchData();
        // fetchNotifications();
        fetchEmployeeApprovals();
    },[])

    useFocusEffect(
        React.useCallback(() => {
          const fetchData = async () => {
            try {
              setLoading(true);
      
              const response = await TaskService.getMyNotifications();
              if (response.status === 1 && response.data.unseen.length > 0) {
                const allNotifications = response.data.unseen;
                const allIds = allNotifications.map(item => item.id);
                console.log('allIds allIds', allIds);
      
                await markNotificationsAsSeen(allIds);
              } else {
                setLoading(false);
                setNotificationCount(0);
              }
            } catch (error) {
              console.log('Error fetching notifications:', error);
            } finally {
              setLoading(false);
            }
          };
      
          fetchData();
        }, [])
      );
      

    const fetchNotifications = async () => {
        const response = await TaskService.getMyNotifications();
        if (response.status === 1) {
          setNotifications(response.data?.seen);
          setNotificationCount(response.data?.unseen?.length);
        } else {
          setNotificationCount(0);
        }
      };
      
      const markNotificationsAsSeen = async (allIds) => {
        const res = await TaskService.updateNotificationStatus({ notifIds: allIds });
        if (res.status === 1) {
          await fetchNotifications(); // Refresh list
        }
      };
      
      useFocusEffect(
        React.useCallback(() => {
          const init = async () => {
            setLoading(true);
            await fetchNotifications();
            setLoading(false);
          };
          init();
        }, [])
      );
      

      const deleteGeneNotif = async (id) => {
        const response = await TaskService.deleteNotification({notifId: id})
        console.log('deleting....', response)
        if(response.status==1) {
            fetchNotifications();
        } else {
            showAlertModal(response.data, true)
        }
      }



    // const onViewableItemsChanged = useRef(({ viewableItems }) => {
    //     const visibleIds = viewableItems.map(v => v.item.id);

    //     // Add newly visible IDs to the Set
    //     visibleIds.forEach(id => viewedIdsRef.current.add(id));

    //     // Clear previous timeout if any
    //     if (timeoutRef.current) {
    //         clearTimeout(timeoutRef.current);
    //     }

    //     // Set a delay before console logging
    //     timeoutRef.current = setTimeout(() => {
    //         console.log('IDs to be marked as seen:', [...viewedIdsRef.current]);
    //     }, 2000); // adjust delay (in ms) as needed

    // }).current;

    // const viewabilityConfig = {
    //     itemVisiblePercentThreshold: 50,
    // };


    const handleApprove = async (id) => {
        try {
            const response = await TaskService.approveApproval({ notifId: id });
            console.log('response:', response)
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
            const response = await TaskService.declineApproval({ notifId: id });
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


    const NotificationItem = ({ item }) => (
        <View style={{ flexDirection: 'row', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
            <Ionicons name={item.status == '1' ? "mail-outline" : "mail-outline"} size={32}
                color={item.status == '1' ? "#64748B" : "#1E40AF"} style={styles.icon} />
            <View style={styles.textContainer}>
                <View style={{flex:1,}}>
                    <Text style={styles.name}>{item.name} <Text style={styles.message}>{item.message}</Text></Text>
                    <Text style={styles.time}>{dayjs(item.createdAt).format('MMMM D, YYYY h:mm A')}</Text>
                </View>
                <View style={{width:25,}}>
                    <TouchableOpacity onPress={() => {deleteGeneNotif(item.id)}}>
                        <Ionicons name="trash-outline" size={24} color="#EF4444" />
                    </TouchableOpacity>
                </View>
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
                <View style={styles.borderLine} />
                {['General', 'Approval'].map((tab) => (
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
            {selectedTab === 'General' ? (
                <FlatList
                    data={notifications}
                    renderItem={({ item }) => <NotificationItem item={item} />}
                    keyExtractor={item => item.id.toString()}
                    // onViewableItemsChanged={onViewableItemsChanged}
                    // viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}

                    // Show "No Notification Found!" when the list is empty
                    ListEmptyComponent={
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ fontSize: 16, color: '#64748B', fontFamily: 'Montserrat_500Medium' }}>
                                No notifications found
                            </Text>
                        </View>
                    }

                    // Center empty message when no data
                    contentContainerStyle={
                        notifications.length === 0
                            ? { flexGrow: 1, justifyContent: 'center', alignItems: 'center' }
                            : null
                    }
                />
            ) : (
                <FlatList
                    data={selectedTab === 'General' ? notifications : approvals}
                    renderItem={({ item }) =>
                        selectedTab === 'General' ? (
                            <NotificationItem item={item} />
                        ) : (
                            <View style={styles.notificationContainer}>

                                <View style={styles.textContainer}>
                                    <Text style={styles.name}>
                                        {item?.name}{' '}
                                        <Text style={styles.message}>{item.message}</Text>
                                    </Text>
                                </View>


                                <View style={styles.buttonRow}>
                                    <View>
                                        <Text style={styles.time}>
                                            {item?.time}{' '}
                                            {dayjs(item.createdAt).format('MMMM D, YYYY h:mm A')}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                        <TouchableOpacity
                                            style={[styles.button, { backgroundColor: '#10B981' }]}
                                            onPress={() => handleApprove(item?.id)}
                                        >
                                            <Text style={styles.buttonText}>Approve</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.button, { backgroundColor: '#EF4444' }]}
                                            onPress={() => handleDecline(item?.id)}
                                        >
                                            <Text style={styles.buttonText}>Decline</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )
                    }
                    keyExtractor={item => item?.id.toString()}
                    // onViewableItemsChanged={onViewableItemsChanged}
                    // viewabilityConfig={viewabilityConfig}
                    ListEmptyComponent={() =>
                        selectedTab === 'Approval' ? (
                            <Text style={{ textAlign: 'center', marginTop: 350, color: '#999' }}>
                                No approval notifications.
                            </Text>
                        ) : null
                    }
                    contentContainerStyle={styles.flatListContent}
                />
            )}

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
        flexDirection:'row',
        gap:10,
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
        fontSize: 12,
        color: '#A5ACB8',
        marginTop: 5,
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
        marginTop: 5,
    },
    button: {
        height: 40,
        paddingHorizontal: 14,
        paddingVertical: 0,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
})

export default Notification;

