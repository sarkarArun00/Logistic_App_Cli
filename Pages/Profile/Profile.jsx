import { useState, useContext  } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Modal } from 'react-native'
import { AuthContext  } from "../../Context/AuthContext";
// import {
//   useFonts,
//   Montserrat_400Regular,
//   Montserrat_500Medium,
//   Montserrat_700Bold,
// } from '@expo-google-fonts/montserrat';

function Profile({ navigation }) {
    const [modalVisible, setModalVisible] = useState(false);
    const { logout } = useContext(AuthContext );


    // const [fontsLoaded] = useFonts({
    //     Montserrat_700Bold,
    //     Montserrat_400Regular,
    //     Montserrat_500Medium,
    // });

    // if (!fontsLoaded) {
    //     return null;
    // }



    const handleLogout = async () => {
        try {
            await logout();
            navigation.replace('Login'); 
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}>

                <TouchableOpacity onPress={() => navigation.navigate('MainApp', { screen: 'Home' })} style={{ marginBottom: 20, }}>
                    <Image style={{ width: 23, height: 15, }} source={require('../../assets/locate-back.png')} />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                    <View style={{ width: 70, height: 70, borderRadius: '50%', overflow: 'hidden', }}>
                        <Image style={{ width: '100%', height: '100%', objectFit: 'cover', }} source={require('../../assets/user.jpg')} />
                    </View>
                    <View style={{ flex: 1, paddingLeft: 20, }}>
                        <Text style={{ fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#0F0F0F', paddingBottom: 2, }}>Tarun Sana
                            <TouchableOpacity onPress={() => setModalVisible(true)} style={{ paddingLeft: 5, }}>
                                <Image style={{ width: 20, height: 20, }} source={require('../../assets/edit.png')} />
                            </TouchableOpacity>
                        </Text>
                        <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#A0A7BA', }}>ID:22369874</Text>
                    </View>
                </View>

                <View>
                    <TouchableOpacity onPress={() => navigation.navigate('Assigned')} style={styles.tskmain}>
                        <View style={styles.taskbox}>
                            <View style={styles.tskimg}><Image style={{ width: 58, height: 58, }} source={require('../../assets/pficon1.png')} /></View>
                            <Text style={styles.tsktext}>My Task</Text>
                        </View>
                        <View>
                            <Image style={{ width: 8, height: 14, }} source={require('../../assets/rightarrow2.png')} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Attendance')} style={styles.tskmain}>
                        <View style={styles.taskbox}>
                            <View style={styles.tskimg}><Image style={{ width: 58, height: 58, }} source={require('../../assets/pficon2.png')} /></View>
                            <Text style={styles.tsktext}>Atttendence</Text>
                        </View>
                        <View>
                            <Image style={{ width: 8, height: 14, }} source={require('../../assets/rightarrow2.png')} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Receipt',{ page: 'profile' })} style={styles.tskmain}>
                        <View style={styles.taskbox}>
                            <View style={styles.tskimg}><Image style={{ width: 58, height: 58, }} source={require('../../assets/pficon3.png')} /></View>
                            <Text style={styles.tsktext}>Receipts</Text>
                        </View>
                        <View>
                            <Image style={{ width: 8, height: 14, }} source={require('../../assets/rightarrow2.png')} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('MainApp', { screen: 'Wallet' })} style={styles.tskmain}>
                        <View style={styles.taskbox}>
                            <View style={styles.tskimg}><Image style={{ width: 58, height: 58, }} source={require('../../assets/pficon4.png')} /></View>
                            <Text style={styles.tsktext}>Wallet</Text>
                        </View>
                        <View>
                            <Image style={{ width: 8, height: 14, }} source={require('../../assets/rightarrow2.png')} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('MainApp')} style={styles.tskmain}>
                        <View style={styles.taskbox}>
                            <View style={styles.tskimg}><Image style={{ width: 58, height: 58, }} source={require('../../assets/pficon5.png')} /></View>
                            <Text style={styles.tsktext}>Fuel Voucher</Text>
                        </View>
                        <View>
                            <Image style={{ width: 8, height: 14, }} source={require('../../assets/rightarrow2.png')} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tskmain}>
                        <View style={styles.taskbox}>
                            <View style={styles.tskimg}><Image style={{ width: 58, height: 58, }} source={require('../../assets/pficon6.png')} /></View>
                            <Text style={styles.tsktext}>Sample Temperature</Text>
                        </View>
                        <View>
                            <Image style={{ width: 8, height: 14, }} source={require('../../assets/rightarrow2.png')} />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tskmain} onPress={handleLogout}
                    >
                        <View style={styles.taskbox}>
                            <View style={styles.tskimg}><Image style={{ width: 58, height: 58, }} source={require('../../assets/pficon7.png')} /></View>
                            <Text style={styles.tsktext}>Log Out</Text>
                        </View>
                        <View>
                            <Image style={{ width: 8, height: 14, }} source={require('../../assets/rightarrow2.png')} />
                        </View>
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#353A48', textAlign: 'center', paddingVertical: 20, }}>App Version 1.0.0</Text>
                </View>

                {/* Edit Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}>
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                                <Text style={styles.modalText}>Change Picture</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Image style={{ width: 18, height: 18, }} source={require('../../assets/mdlclose.png')} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', justifyContent: 'space-evenly', paddingVertical: 20, }}>
                                <TouchableOpacity style={styles.pfBox}>
                                    <View style={styles.Icon}><Image style={{ width: 24, height: 24, }} source={require('../../assets/camera.png')} /></View>
                                    <Text style={styles.Text}>Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pfBox}>
                                    <View style={styles.Icon}><Image style={{ width: 24, height: 24, }} source={require('../../assets/gallery.png')} /></View>
                                    <Text style={styles.Text}>Gallery</Text>
                                </TouchableOpacity>
                            </View>
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
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 20,
    },
    modalText: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 16,
        color: '#0C0D36',
    },
    Icon: {
        width: 70,
        height: 70,
        borderWidth: 1,
        borderColor: 'rgba(47,129,245,0.2)',
        borderRadius: '50%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    Text: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 14,
        color: '#2F81F5',
        paddingTop: 8,
        textAlign: 'center',
    },
    tskmain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    taskbox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tskimg: {
        width: 58,
        height: 58,
        borderRadius: '50%',
        overflow: 'hidden',
    },
    tsktext: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 16,
        color: '#0C0D36',
        paddingLeft: 15,
    }








})

export default Profile
