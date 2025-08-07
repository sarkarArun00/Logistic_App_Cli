import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, PermissionsAndroid, Platform, TextInput, Modal, Animated, FlatList, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { lightTheme } from '../GlobalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useGlobalAlert } from '../../Context/GlobalAlertContext';

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import { readFile } from 'react-native-fs';
import TaskService from '../Services/task_service';

function FeulVoucherRequest({ visible, onClose, onSuccess }) {

    const [images, setImages] = useState([]);
    const [vehicles, setVehicles] = useState([])
    const [fuelVoucherList, setFuelVoucherList] = useState([])
    const [remarks, setRemarks] = useState('')
    const [amount, setAmount] = useState(0)
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const bgColor = useRef(new Animated.Value(0)).current;
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectPaymode, setselectPaymode] = useState();
    const [selectVehicle, setVehicle] = useState();
    const { showAlertModal, hideAlert } = useGlobalAlert();

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    const [pickerMode, setPickerMode] = useState(null); // 'from' or 'to'
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);



    useEffect(() => {
        vehicleList();
        // getAllFuelVoucher();
        setImages([])
    }, [])

    const vehicleList = async () => {
        const userId = await AsyncStorage.getItem('user_id')
        const response = await TaskService.getVehicleByEmpId({ employeeId: userId })
        console.log('ressssss', response)
        if (response.status == 1) {
            setVehicles(response.data)
        } else {
            setVehicles([])

        }
    }

    // Camera Open
    const requestPermission = async (type) => {
        try {
            if (Platform.OS === 'android') {
                if (type === 'camera') {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.CAMERA,
                        {
                            title: 'Camera Permission',
                            message: 'App needs access to your camera to take pictures.',
                            buttonNeutral: 'Ask Me Later',
                            buttonNegative: 'Cancel',
                            buttonPositive: 'OK',
                        }
                    );
                    return granted === PermissionsAndroid.RESULTS.GRANTED;
                } else {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                        {
                            title: 'Storage Permission',
                            message: 'App needs access to your photos.',
                            buttonNeutral: 'Ask Me Later',
                            buttonNegative: 'Cancel',
                            buttonPositive: 'OK',
                        }
                    );
                    return granted === PermissionsAndroid.RESULTS.GRANTED;
                }
            }
            // iOS auto handles permissions via Info.plist
            return true;
        } catch (error) {
            console.error('Permission error:', error);
            return false;
        }
    };

    const openCamera = async () => {
        const hasPermission = await requestPermission('camera');

        if (!hasPermission) {
            showAlertModal('Camera access is needed to take pictures.', true);
            return;
        }

        const options = {
            mediaType: 'photo',
            includeBase64: false, // base64 not needed if uploading as binary
            quality: 1,
            saveToPhotos: true,
        };

        launchCamera(options, async (response) => {
            console.log('Camera response:', response);

            if (response.didCancel) {
                console.log('User cancelled camera');
            } else if (response.errorCode) {
                console.error('Camera error:', response.errorMessage);
                showAlertModal('Camera error occurred.', true);
            } else if (response.assets && response.assets.length > 0) {
                const image = response.assets[0];

                // Compress and return binary-compatible object
                const compressedImage = await compressImage(image.uri);

                // Store the file for upload
                setImages([compressedImage]); // compressedImage has { uri, type, name }
            }
        });
    };


    const openGallery = async () => {
        const hasPermission = await requestPermission('gallery');
        if (!hasPermission) {
            Alert.alert('Permission Required', 'Gallery access is needed to select images.');
            return;
        }

        const options = {
            mediaType: 'photo',
            includeBase64: true,
            quality: 1,
        };

        launchImageLibrary(options, async (response) => {
            console.log('Gallery response:', response);
            if (response.didCancel) {
                console.log('User cancelled gallery');
            } else if (response.errorCode) {
                console.error('Gallery error:', response.errorMessage);
                showAlertModal('Gallery error occurred.', true);
            } else if (response.assets && response.assets.length > 0) {
                const image = response.assets[0];

                const compressedImage = await compressImage(image.uri);
                setImages([compressedImage]);
            }
        });
    };


    const compressImage = async (uri) => {
        let currentUri = uri;
        let sizeInKB = Infinity;
        let compressedImage = null;

        while (sizeInKB > 50) {
            try {
                const resizedImage = await ImageResizer.createResizedImage(
                    currentUri,
                    500,        // width
                    500,        // height
                    'JPEG',
                    50          // quality (0–100)
                );

                const base64 = await readFile(resizedImage.uri, 'base64');
                sizeInKB = base64.length * (3 / 4) / 1024;

                if (sizeInKB <= 50) {
                    const fileName = `compressed_${Date.now()}.jpg`;
                    compressedImage = {
                        uri: Platform.OS === 'android' ? resizedImage.uri : resizedImage.uri.replace('file://', ''),
                        type: 'image/jpeg',
                        name: fileName,
                    };
                    break;
                }

                currentUri = resizedImage.uri;
            } catch (error) {
                console.error('Compression failed:', error);
                break;
            }
        }

        console.log('Final compressed image:', compressedImage);
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
    // Camera End

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bgColor, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: false,
                }),
                Animated.timing(bgColor, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    const backgroundColor = bgColor.interpolate({
        inputRange: [0, 1],
        outputRange: ['#FFBB00', 'transparent'],
    });

    const onSubmitFuelvoucher = async () => {
        const userId = await AsyncStorage.getItem('user_id');
        if (!selectedVehicle) {
            Alert.alert('Missing Information', 'Please select a valid vehicle before submitting.');
            return;
        }

        setLoading(true);
        const request = {
            employeeId: Number(userId),
            trackingId: Number(selectedVehicle),
            amount: Number(amount),
            paymentMode: selectPaymode,
            logisticRemarks: remarks,
        };

        try {
            const response = await TaskService.saveFuelVoucher(request);
            await submitFuelVoucherAttachments(response.data?.id);

            showAlertModal('Fuel voucher submitted successfully.', false);

            // ✅ Reset form fields
            setSelectedVehicle(null);
            setAmount('');
            setselectPaymode('');
            setRemarks('');
            setImages([]);

            if (onSuccess) {
                onSuccess(); // ✅ Trigger refresh in parent
            } else {
                onClose(); // fallback if no callback
            }
        } catch (err) {
            console.error('API Error:', err);
            showAlertModal('Failed to submit fuel voucher.', true);
        } finally {
            setLoading(false);
        }
    };

    const submitFuelVoucherAttachments = async (fuelVoucherId) => {
        if (!images.length) {
            console.warn('No image selected');
            return;
        }

        const file = images[0];
        const formData = new FormData();
        formData.append('fuelVoucherId', fuelVoucherId);
        formData.append('attachment', {
            uri: file.uri,
            type: file.type || 'image/jpeg',
            name: file.name || `attachment_${Date.now()}.jpg`,
        });

        try {
            const response = await TaskService.addFuelVoucherAttachment(formData);
            if (response.status == 1) {
                console.log('Upload success:', response);
            } else {
                showAlertModal('Failed to upload attachments', true);
            }
        } catch (error) {
            console.error('Upload error:', error);
        }
    };







    return (
        <Modal
            animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.modalBackground}>
                <View style={[styles.modalContainer, styles.scrlablModalContainer]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                        <Text style={styles.modalText}>Fuel Voucher Request Details</Text>
                        <TouchableOpacity onPress={() => onClose(false)}>
                            <Image style={{ width: 18, height: 18 }} source={require('../../assets/mdlclose.png')} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        <View style={{ padding: 15, }}>
                            <View>
                                <Text style={styles.label}>Select Vehicle</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        style={styles.picker}
                                        dropdownIconColor={lightTheme.inputText}
                                        selectedValue={selectedVehicle?.id || ''} // Make sure to use .id (trackingId) from selectedVehicle
                                        onValueChange={(itemValue) => {
                                            const selected = vehicles.find(v => v.id === itemValue);
                                            setSelectedVehicle(selected.id); // Save full object
                                            console.log('selected', selected.id)
                                        }}
                                    >
                                        <Picker.Item enabled={false} label="Select Vehicle" value="" />
                                        {vehicles.map(v => (
                                            <Picker.Item
                                                key={v.id}
                                                label={v.vehicle?.modelName || 'Unnamed Vehicle'}
                                                value={v.id} // trackingId
                                            />
                                        ))}
                                    </Picker>



                                </View>
                            </View>
                            {/* <View>
                                <Text style={styles.label}>Payment Mode</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        style={styles.picker} // Apply text color here
                                        dropdownIconColor={lightTheme.inputText}
                                        selectedValue={selectPaymode}
                                        onValueChange={(itemValue, itemIndex) =>
                                            setselectPaymode(itemValue)
                                        }>
                                        <Picker.Item key={'cash'} label="Cash" value="cash" />
                                        <Picker.Item key={'UPI'} label="UPI" value="UPI" />
                                        <Picker.Item key={'Net Banking'} label="Net Banking" value="Net Banking" />
                                    </Picker>
                                </View>
                            </View> */}
                            <View>
                                <Text style={styles.label}>Enter Amount</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Amount"
                                    placeholderTextColor="#0C0D36"
                                    value={amount}
                                    onChangeText={setAmount}
                                />
                            </View>

                            <View>
                                <Text style={styles.label}>Attachment</Text>

                                <TouchableOpacity style={styles.uploadContainer} onPress={selectImages}>
                                    <Image style={{ width: 30, height: 28, marginHorizontal: 'auto', }} source={require('../../assets/upload-icon.png')} />
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

                            <View>
                                <Text style={styles.label}>Remarks</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Write here..."
                                    placeholderTextColor="#0C0D36"
                                    value={remarks}
                                    onChangeText={setRemarks}
                                />
                            </View>
                            <View>
                                <TouchableOpacity onPress={() => onSubmitFuelvoucher()} style={{ backgroundColor: '#2F81F5', borderRadius: 28, paddingVertical: 16, paddingHorizontal: 10, }}>
                                    <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 16, color: 'white', textAlign: 'center', }}>Send</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    ScrollView: {
        paddingBottom: 185,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: lightTheme.text,
    },
    pickerContainer: {
        backgroundColor: lightTheme.inputBackground,
        borderWidth: 1,
        borderColor: lightTheme.border,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 16,
    },
    picker: {
        height: 50,
        color: lightTheme.inputText, // Works on iOS and sometimes Android
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
    scrlablModalContainer: {
        height: '75%',
    },
    modalText: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 16,
        color: '#0C0D36',
    },
    label: {
        fontFamily: 'Montserrat-Medium',
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
    selLabel: {
        borderWidth: 1,
        borderColor: '#ECEDF0',
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 15,
        paddingVertical: 15,
        marginBottom: 15,
        borderRadius: 10,
    },
    viewModalContainer: {
        height: '70%',
    },
    attachmentImg: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
        borderWidth: 1,
        borderColor: '#ECEDF0',
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 15,
        paddingVertical: 15,
        marginBottom: 15,
        borderRadius: 10,
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
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        color: '#2F81F5',
        textAlign: 'center',
        paddingTop: 10,
        paddingBottom: 3,
    },
    uploadSubTitle: {
        fontFamily: 'Montserrat-Regular',
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
        marginBottom: 10,
    },
    noImgSelected: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 13,
        color: '#0C0D36',
        textAlign: 'center',
        borderWidth: 1,
        borderRadius: 12,
        borderStyle: 'dashed',
        backgroundColor: '#FAFAFA',
        borderColor: '#E5E5E5',
        padding: 12,
        marginBottom: 10,
    },


})

export default FeulVoucherRequest

