import React from 'react';
import {StyleSheet, ScrollView, View, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const TaskStatusTabs = ({ activeTab }) => {
    const navigation = useNavigation();

    const tabs = [
        { title: 'Assigned', screen: 'Assigned' },
        { title: 'Accepted', screen: 'Accepted' },
        { title: 'In Progress', screen: 'In Progress' },
        { title: 'Collected', screen: 'Collected' },
        { title: 'Completed', screen: 'Completed' },
        { title: 'Rejected Task', screen: 'Rejected Task' },
    ];

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
            <View style={{ flexDirection: 'row', paddingTop: 20 }}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.screen}
                        style={[styles.tcbtn, activeTab === tab.title && styles.active]}
                        onPress={() => navigation.navigate(tab.screen)}
                        // onPress={() => navigation.navigate('MainApp', { screen: tab.screen })}
                    >
                        <Text style={[styles.acttext, activeTab === tab.title && styles.testactive]}>
                            {tab.title}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};


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


    sendBtn: {
        backgroundColor: '#2F81F5',
        height: 54,
        borderRadius: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
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


})

export default TaskStatusTabs;


