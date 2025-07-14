import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, PermissionsAndroid,Platform, TextInput, Modal, Animated, FlatList, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { lightTheme } from '../../GlobalStyles';
import GlobalStyles from '../../GlobalStyles';
import TaskService from '../../Services/task_service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useGlobalAlert } from '../../../Context/GlobalAlertContext';

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import { readFile } from 'react-native-fs';
import FeulVoucherRequest from '../FeulVoucherRequest';
import NotificationCount from '../../Notifications/NotificationCount';



function Pending({ navigation }) {
    const [filter, setFilter] = useState(false);
    const [selectStatus, setselectStatus] = useState();
    const [showMenu, setShowMenu] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectPaymode, setselectPaymode] = useState();
    const [selectVehicle, setVehicle] = useState();
    const bgColor = useRef(new Animated.Value(0)).current;
    const [selectViewMdl, setSelectViewMdl] = useState(false);
    const [images, setImages] = useState([]);
    const [vehicles, setVehicles] = useState([])
    const [fuelVoucherList, setFuelVoucherList] = useState([])
    const [remarks, setRemarks] = useState('')
    const [amount, setAmount] = useState(0)
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [loading, setLoading] = useState(false)
    const [activeMenuId, setActiveMenuId] = useState(null);
    const { showAlertModal, hideAlert } = useGlobalAlert();

      

      useEffect(() => {
        vehicleList();
        getAllFuelVoucher();
        setImages([])
      }, [])

    const vehicleList = async () => {
        try {
            const userId =  await AsyncStorage.getItem('user_id')
            const response = await TaskService.getVehicleByEmpId({employeeId: 209})
            console.log('ressssss', response)
            if(response.status==1) {
                setVehicles(response.data)
            } else {
                setVehicles([])
    
            }
        } catch (error) {
            showAlertModal(error, true)
            setVehicles([])
        } finally{
            setVehicles([])
        }
    }

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
      
        const date = new Date(dateString);
      
        return date
          .toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            month: 'short',       // "Feb"
            day: '2-digit',       // "20"
            year: 'numeric',      // "2025"
            hour: 'numeric',      // "4"
            minute: '2-digit',    // "01"
            hour12: true          // "PM"
          })
          .replace(',', ''); // Optional: Remove comma between date and time
      };
      
      

    const formatToINR = (amount) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
        }).format(amount || 0);
      };

      const getAllFuelVoucher = async () => {
        try {
          setLoading(true);
          const response = await TaskService.getAllFuelVouchers();
          console.log('getAllFuelVoucher response:', response.data.filter((item) => item.opStatus=="pending"))
            
          if (response?.status) {
            setFuelVoucherList(response.data.filter((item) => item.opStatus=="pending"));
          } else {
            setFuelVoucherList([]);
          }
        } catch (error) {
          console.error('Error fetching fuel vouchers:', error);
          setFuelVoucherList([]);
        } finally {
          setLoading(false);
        }
      };



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

    // const onSubmitFuelvoucher = async () => {
    //     const userId = await AsyncStorage.getItem('user_id');
      
    //     if (!selectedVehicle) {
    //         Alert.alert('Missing Information', 'Please select a valid vehicle before submitting.');
    //         return;
    //     }
        
    //     setLoading(true)
    //     const request = {
    //         employeeId: Number(userId),
    //         trackingId: Number(selectedVehicle), 
    //         amount: Number(amount),
    //         paymentMode: selectPaymode,
    //         logisticRemarks: remarks,
    //     };
        
    //     try {
    //         const response = await TaskService.saveFuelVoucher(request);
    //         await submitFuelVoucherAttachments(response.data?.id);
    //         console.log('API Response:', response.data);
    //       showAlertModal('Fuel voucher submitted successfully.', false)
    //       getAllFuelVoucher();
    //       setLoading(false)
    //     } catch (err) {
    //       console.error('API Error:', err);
    //       showAlertModal('Failed to submit fuel voucher.', true)
    //       setLoading(false)

    //     }
    //   };
      

    //   const submitFuelVoucherAttachments = async (fuelVoucherId) => {
    //     if (!images.length) {
    //       console.warn('No image selected');
    //       return;
    //     }
      
    //     const file = images[0]; // get the first image
    //     setLoading(true)
    //     const formData = new FormData();
    //     formData.append('fuelVoucherId', fuelVoucherId);
    //     formData.append('attachment', {
    //       uri: file.uri,
    //       type: file.type || 'image/jpeg',
    //       name: file.name || `attachment_${Date.now()}.jpg`,
    //     });
      
    //     try {
    //       const response = await TaskService.addFuelVoucherAttachment(formData);
    //       if(response.status==1) {
    //         // showAlertModal(response.data, false);
    //         setModalVisible(false)
    //         console.log('Upload success:', response);
    //         setLoading(false)
    //       } else {
    //         showAlertModal('Failed to upload attachments', true);
    //         setLoading(false)
    //       }
    //       return 
    //     } catch (error) {
    //       console.error('Upload error:', error);
    //       setLoading(false)
    //       throw error;
    //     }
    //   };
      


    return (
        <SafeAreaView style={[ 
            styles.container,
            GlobalStyles.SafeAreaView,
            { paddingBottom: lightTheme.paddingBottomNew }
          ]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <Image style={{ width: 14, height: 14, }} source={require('../../../assets/leftarrow.png')} />
                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 18, color: '#2F81F5', marginLeft: 4, }}>Fuel Voucher Request</Text>
                    </TouchableOpacity>
                    <View style={{ position: 'relative', width: 50, height: 50, borderRadius: '50%', backgroundColor: '#F6FAFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                    <TouchableOpacity onPress={() => navigation.navigate('Notification')} >
                            <NotificationCount></NotificationCount>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 20, }}>
                    <View style={{ flex: 1, position: 'relative', }}>
                        <TextInput
                            style={{ fontSize: 14, fontFamily: 'Montserrat_500Medium', height: 50, backgroundColor: '#F6FAFF', borderRadius: 30, paddingLeft: 20, paddingRight: 50, }}
                            placeholder="Search"
                            placeholderTextColor="#0C0D36"
                        />
                        <Image style={{ position: 'absolute', top: 16, right: 20, width: 20, height: 20, }} source={require('../../../assets/search.png')} />
                    </View>
                    <TouchableOpacity onPress={() => setFilter(true)} style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: '#F6FAFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginLeft: 14, }}>
                        <Image style={{ width: 25, height: 25, }} source={require('../../../assets/filter.png')} />
                        <Text style={{ position: 'absolute', fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 13, color: '#fff', right: 0, top: 0, width: 15, height: 15, backgroundColor: '#F43232', borderRadius: 50, textAlign: 'center', }}>2</Text>
                    </TouchableOpacity>
                </View>

                {/* ScrollView Tab */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
                    <View style={{ flexDirection: 'row', paddingTop: 20, }}>
                        <TouchableOpacity onPress={() => navigation.navigate('FeulStack', { screen: 'Pending' })} style={[styles.tcbtn, styles.active]}>
                            <Text style={[styles.acttext, styles.testactive]}>Pending</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('FeulStack', { screen: 'Approved' })} style={[styles.tcbtn,]}>
                            <Text style={[styles.acttext,]}>Approved</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('FeulStack', { screen: 'Processed' })} style={[styles.tcbtn,]}>
                            <Text style={[styles.acttext,]}>Processed</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('FeulStack', { screen: 'Rejected' })} style={[styles.tcbtn,]}>
                            <Text style={[styles.acttext,]}>Rejected</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {fuelVoucherList.map((allVehicles) => (
                <View key={allVehicles.id}>
                    <Text style={styles.title}>{formatDateTime(allVehicles.createdAt)}</Text>

                    <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 15,
                    }}
                    >
                    <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                        <Image
                        style={{ width: 28, height: 20 }}
                        source={require('../../../assets/voucher.png')}
                        />
                        <View style={{ paddingLeft: 6 }}>
                        <Text
                            style={{
                            fontFamily: 'Montserrat_500Medium',
                            fontSize: 16,
                            color: '#0C0D36',
                            paddingBottom: 2,
                            }}
                        >
                            {allVehicles?.fuelVoucherNo}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.bgborder}>
                            <Animated.View style={[styles.animatebg, { backgroundColor }]} />
                            </View>
                            <Text
                            style={{
                                fontFamily: 'Montserrat_600SemiBold',
                                fontSize: 11,
                                color: '#0C0D36',
                            }}
                            >
                            Payment Pending
                            </Text>
                        </View>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ paddingRight: 15 }}>
                        <Text
                            style={{
                            fontFamily: 'Montserrat_600SemiBold',
                            fontSize: 14,
                            color: '#FFBB00',
                            }}
                        >
                            {formatToINR(allVehicles.amount)}
                        </Text>
                        </View>

                        {/* <TouchableOpacity
                        style={[styles.touchBtn, { paddingHorizontal: 4 }]}
                        onPress={() =>
                            setActiveMenuId(
                            activeMenuId === allVehicles.id ? null : allVehicles.id
                            )
                        }
                        >
                        <Image
                            style={{ width: 4, height: 23 }}
                            source={require('../../../assets/dotimg1.png')}
                        />
                        </TouchableOpacity> */}

                        {/* {activeMenuId === allVehicles.id && (
                        <View style={styles.viewBx}>
                            <TouchableOpacity
                            style={styles.viewText}
                            
                            onPress={() => navigation.navigate("VoucherDetails", { fuelVoucherId: allVehicles.id })}
                            >
                            <Text style={styles.downloadText}>View</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                            style={styles.viewText}
                            onPress={() => setActiveMenuId(null)}
                            >
                            <Text style={styles.downloadText}>Download</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                            style={styles.viewText}
                            onPress={() => setActiveMenuId(null)}
                            >
                            <Text style={styles.downloadText}>Share</Text>
                            </TouchableOpacity>
                        </View>
                        )} */}
                    </View>
                    </View>
                </View>
                ))}



                {/* Filter Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={filter}
                    onRequestClose={() => setFilter(false)}>
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                                <Text style={styles.modalText}>Filter by:</Text>
                                <TouchableOpacity onPress={() => setFilter(false)}>
                                    <Image style={{ width: 18, height: 18 }} source={require('../../../assets/mdlclose.png')} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ padding: 15, }}>
                                <View>
                                    <Text style={styles.label}>Date Range</Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', }}>
                                        <View>

                                        </View>
                                        <View></View>
                                    </View>
                                </View>
                                <View>
                                    <Text style={styles.label}>Status</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectStatus}
                                            onValueChange={(itemValue, itemIndex) =>
                                                setselectStatus(itemValue)
                                            }>
                                            <Picker.Item label="Pending" value="Pending" />
                                            <Picker.Item label="Approve" value="Approve" />
                                        </Picker>
                                    </View>
                                </View>
                                <View style={{ borderTopWidth: 1, borderTopColor: '#ECEDF0', paddingVertical: 25, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', }}>
                                    <TouchableOpacity style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#2F81F5', textAlign: 'center', }}>Reset All</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ width: '47%', backgroundColor: '#2F81F5', borderRadius: 28, padding: 12, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#fff', textAlign: 'center', }}>Apply Filters (3)</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>

            </ScrollView>



            {/* Request Btn */}
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.createBtn}>
                <Text style={styles.createText}>Request </Text>
                <View>
                    <Image style={{ width: 12, height: 12, marginLeft: 8, marginTop: 4, }} source={require('../../../assets/plusicon.png')} />
                </View>
            </TouchableOpacity>

            <FeulVoucherRequest visible={modalVisible} onClose={() => setModalVisible(false)} />
            {/* Request Modal */}
            


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
    ScrollView:{
        paddingBottom:185,
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

    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#fff',
    },
    title: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 12,
        color: '#2F81F5',
        marginVertical: 20,
    },
    viewBx: {
        width: 130,
        backgroundColor: '#fff',
        borderRadius: 15,
        position: 'absolute',
        right: 12,
        top: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        paddingVertical: 11,
    },
    viewText: {
        paddingVertical: 8,
        paddingHorizontal: 15,
    },
    downloadText: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 14,
        color: '#0C0D36',
    },
    createBtn: {
        position: 'absolute',
        right: 15,
        bottom: 140,
        backgroundColor: '#EBF2FB',
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 21,
    },
    createText: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 15,
        color: '#3085FE',
    },
    bgborder: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFBB00',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    animatebg: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
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
    testactive: {
        color: '#fff',
    },
    acttext: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 12,
        color: '#0C0D36',
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
    scrlablModalContainer:{
        height:'75%',
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
        marginBottom:10,
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
        marginBottom:10,
    },


})

export default Pending
