import React, { useState, useEffect, useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Modal, Alert, PermissionsAndroid, Platform, Pressable } from 'react-native'
import { AuthContext } from "../../Context/AuthContext";
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import ImageResizer from 'react-native-image-resizer';
import { useGlobalAlert } from '../../Context/GlobalAlertContext';
import { readFile } from 'react-native-fs'; // For base64
import { useFocusEffect } from '@react-navigation/native';
import { BASE_API_URL } from '../Services/API';
import TaskService from '../Services/task_service';
import { Vibration } from 'react-native';


// import {
//   useFonts,
//   Montserrat_400Regular,
//   Montserrat_500Medium,
//   Montserrat_700Bold,
// } from '@expo-google-fonts/montserrat';



function Profile({ navigation }) {
    const [modalVisible, setModalVisible] = useState(false);
    const { logout } = useContext(AuthContext);
    const [profilePic, setProfilePic] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    const { showAlertModal, hideAlert } = useGlobalAlert();
    const [viewerVisible, setViewerVisible] = useState(false);

    // const [fontsLoaded] = useFonts({
    //     Montserrat_700Bold,
    //     Montserrat_400Regular,
    //     Montserrat_500Medium,
    // });

    // if (!fontsLoaded) {
    //     return null;
    // }

    const fetchProfilePicture = async () => {
        try {
            // Fetch the profile picture from your API or local storage
            const response = await TaskService.getUserData();
            if (response.status === 1) {
                setUserInfo(response.data);
                console.log('User Info:', response.data);
            } else {
                console.error('Failed to fetch profile picture:', response.message);
            }
        } catch (error) {
            console.error('Error fetching profile picture:', error);
        }
    };

    useEffect(() => {
        fetchProfilePicture();
    }, [])

    // useFocusEffect(
    //     React.useCallback(() => {
    //         fetchProfilePicture();
    //     }, [])
    // );


    const avatarSource =
        userInfo?.employeePhoto
            ? { uri: BASE_API_URL + userInfo.employeePhoto }
            : require('../../assets/user.jpg');


    const handleLogout = async () => {
        try {
            await logout();
            navigation.replace('Login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };


    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: 'Camera Permission',
                    message: 'App needs camera access to take a profile picture',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    };

    const handleCamera = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Camera permission is required');
            return;
        }

        const options = {
            mediaType: 'photo',
            includeBase64: false,
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

                try {
                    const compressedImage = await compressImage(image.uri);


                    setProfilePic(compressedImage);
                    setModalVisible(false);

                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const timestamp = Date.now();
                    const formData = new FormData();
                    formData.append('image', {
                        uri: 'data:image/jpeg;base64,' + compressedImage.base64,
                        type: 'image/jpeg',
                        name: `${timestamp}.jpg`,
                    });

                    const uploadResponse = await TaskService.changeProfilePicture(formData);
                    console.log('Upload response:', uploadResponse);

                    if (uploadResponse.status === 1) {
                        Vibration.vibrate(100);
                        showAlertModal('Image uploaded successfully!', false);
                        fetchProfilePicture();
                    } else {
                        showAlertModal('Failed to upload image.', true);
                    }

                } catch (error) {
                    console.error('Upload error:', error);
                    showAlertModal('An error occurred while uploading.', true);
                }
            }
        });
    };



    const handleGallery = async () => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                quality: 0.7,
                includeBase64: false, // Not needed since you'll compress and get base64
            },
            async (response) => {
                if (response.didCancel) return;

                if (response.errorCode) {
                    console.error('Gallery error:', response.errorMessage);
                    showAlertModal('Error selecting image from gallery.', true);
                    return;
                }

                if (response.assets && response.assets.length > 0) {
                    const image = response.assets[0];
                    try {
                        const compressedImage = await compressImage(image.uri);

                        // Optional 2-second wait before upload
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        setProfilePic(compressedImage); // Optional
                        setModalVisible(false);

                        const formData = new FormData();
                        const timestamp = Date.now();
                        formData.append('image', {
                            uri: 'data:image/jpeg;base64,' + compressedImage.base64,
                            type: 'image/jpeg',
                            name: `${timestamp}.jpg`,
                        });

                        const uploadResponse = await TaskService.changeProfilePicture(formData);
                        console.log('Upload response:', uploadResponse);

                        if (uploadResponse.status === 1) {
                            Vibration.vibrate(100);
                            showAlertModal('Image uploaded successfully!', false);
                            fetchProfilePicture();
                        } else {
                            showAlertModal('Failed to upload image.', true);
                        }
                    } catch (err) {
                        console.error('Error compressing gallery image:', err);
                        showAlertModal('Error compressing image.', true);
                    }
                }
            }
        );
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
        // console.log('Final compressed compressedImage size:', compressedImage);
        return compressedImage;
    };

    const navigatePage = async () => {
        navigation.navigate('MainApp', {
            screen: 'TaskStack',
            params: {
                screen: 'TaskScreen',
            },
        });
    }


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}>

                <TouchableOpacity onPress={() => navigation.navigate('MainApp', { screen: 'Home' })} style={{ marginBottom: 20, }}>
                    <Image style={{ width: 23, height: 15, }} source={require('../../assets/locate-back.png')} />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                    <>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setViewerVisible(true)}
                            accessibilityRole="imagebutton"
                            accessibilityLabel="View profile photo"
                        >
                            <View
                                style={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: 35,            // half of width/height
                                    overflow: 'hidden',
                                    backgroundColor: '#F6FAFF',
                                }}
                            >
                                <Image
                                    source={avatarSource}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
                            </View>
                        </TouchableOpacity>

                        {/* Fullscreen viewer */}
                        <Modal
                            visible={viewerVisible}
                            transparent
                            animationType="fade"
                            onRequestClose={() => setViewerVisible(false)}
                        >
                            <Pressable
                                style={{
                                    flex: 1,
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                onPress={() => setViewerVisible(false)}
                            >
                                <View
                                    style={{
                                        width: 400,
                                        height: 400,
                                        borderRadius: 200, // Large round shape
                                        overflow: 'hidden',
                                        borderWidth: 3,
                                        borderColor: '#fff', // White border for highlight
                                    }}
                                >
                                    <Image
                                        source={avatarSource}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="cover"
                                    />
                                </View>
                            </Pressable>
                        </Modal>
                    </>
                    <View style={{ flex: 1, paddingLeft: 20, }}>
                        <Text style={{ fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#0F0F0F', paddingBottom: 2, }}>{userInfo?.employee_name}
                            <TouchableOpacity onPress={() => setModalVisible(true)} style={{ paddingLeft: 5, }}>
                                <Image style={{ width: 20, height: 20, }} source={require('../../assets/edit.png')} />
                            </TouchableOpacity>
                        </Text>
                        <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#A0A7BA', }}>ID: {userInfo?.id}</Text>
                    </View>
                </View>

                <View>
                    <TouchableOpacity onPress={() => navigatePage()} style={styles.tskmain}>
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
                    <TouchableOpacity onPress={() => navigation.navigate('Receipt', { page: 'profile' })} style={styles.tskmain}>
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
                    <TouchableOpacity onPress={() => navigation.navigate('MainApp', { screen: 'FeulStack', params: { screen: 'Pending' } })} style={styles.tskmain}>
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
                                <TouchableOpacity style={styles.pfBox} onPress={handleCamera}>
                                    <View style={styles.Icon}><Image style={{ width: 24, height: 24, }} source={require('../../assets/camera.png')} /></View>
                                    <Text style={styles.Text}>Camera</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pfBox} onPress={handleGallery}>
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
