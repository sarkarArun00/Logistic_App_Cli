import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium } from '@expo-google-fonts/montserrat';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TaskService from '../Services/task_service';
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationCount from '../Notifications/NotificationCount';



function Notification({ navigation }) {
    const [selectedTab, setSelectedTab] = useState('All');
    const [notifications, setNotifications] = useState([]);



    useEffect(() => {

        const markAllAsSeen = async () => {
            const response = await TaskService.getAllGeneralNotifications();
            if (response.status == 1) {
                const ids = response.data.map(n => n.id);
                await AsyncStorage.setItem("seenNotificationIds", JSON.stringify(ids));
            }
        };

        markAllAsSeen();
        fetchData();
    }, []);

    // const fetchData = async () => {
    //     try {
    //         const userId = await AsyncStorage.getItem("user_id");
    //         let request = {
    //             "userId": userId,
    //             "moduleName": "Logistic",
    //         }
    //         const response = await TaskService.getAllGeneralNotifications(request);
    //         setNotifications(response.data);
    //     } catch (error) {
    //         console.error('Error fetching tasks:', error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const fetchData = async () => {
        try {
            const response = await TaskService.getAllGeneralNotifications();
            if (response.status == 1) {

                const allNotifications = response.data;

                setNotifications(allNotifications);

                // STEP 1: Mark these notifications as seen
                const seenIds = allNotifications.map(n => n.id);
                await AsyncStorage.setItem("seenNotificationIds", JSON.stringify(seenIds));
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };




    const filteredNotifications = () => {
        if (selectedTab === 'Approval') {
            return notifications.filter(n => n.status == '0');
        }
        // if (selectedTab === 'Read') {
        //     return notifications.filter(n => n.status == '1');
        // }
        return notifications;
    };

    const NotificationItem = ({ item }) => (
        <View style={styles.notificationContainer}>
            <Ionicons name={item.status == '1' ? "mail-outline" : "mail-outline"} size={32}
                color={item.status == '1' ? "#64748B" : "#1E40AF"} style={styles.icon} />
            <View style={styles.textContainer}>
                <Text style={styles.name}>{item.name} <Text style={styles.message}>{item.message}</Text></Text>
                <Text style={styles.time}>{item.time}</Text>
            </View>
        </View>
    );


    // const [fontsLoaded] = useFonts({
    //     Montserrat_600SemiBold,
    //     Montserrat_500Medium,
    // });

    // if (!fontsLoaded) {
    //     return null;
    // }

    return (
        <SafeAreaView style={styles.container}>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', }}>
                    <Image style={{ width: 14, height: 14, }} source={require('../../assets/leftarrow.png')} />
                    <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 18, color: '#2F81F5', marginLeft: 4, }}>Notifications</Text>
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
                {/* , 'Unread', 'Read' */}
                {['All','Approval'].map((tab) => (
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

            <FlatList
                data={filteredNotifications()}
                renderItem={({ item }) => <NotificationItem item={item} />}
                keyExtractor={item => item.id}
            />

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
        flexDirection: 'row',
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
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#0C0D36'
    },
    message: {
        fontFamily: 'Montserrat_500Medium',
        color: '#4B5563',
    },
    time: {
        fontFamily: 'Montserrat_500Medium',
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
        fontFamily: 'Montserrat_500Medium',
        fontSize: 16,
        paddingBottom: 15,
    },
    activeTabText: {
        color: '#3082F8',
        borderBottomWidth: 2,
        borderBottomColor: '#3082F8',
    },

})

export default Notification;

