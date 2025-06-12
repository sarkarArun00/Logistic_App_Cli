import { useRoute } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Alert, Text, TouchableOpacity, Pressable, Image, Linking, ScrollView, TouchableWithoutFeedback, TextInput, Modal, Button } from 'react-native';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium } from '@expo-google-fonts/montserrat';
import { Picker } from '@react-native-picker/picker';
import Menu from '../Menu-bar/Menu'
import TaskService from '../Services/task_service';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGlobalAlert } from '../../Context/GlobalAlertContext';
import { globalApiClient, apiClient } from '../../Pages/Services/API';
import { BASE_API_URL } from '../Services/API'

import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';




function Receipt({ navigation }) {
    const [showMenu, setShowMenu] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectClient, setselectClient] = useState();
    const [selectPaymode, setselectPaymode] = useState();
    const [filter, setFilter] = useState(false);
    const [selectPayment, setSelectPayment] = useState(false);
    const [receiptData, setReceiptData] = useState([]);
    const [activeMenuIndex, setActiveMenuIndex] = useState(null);

    const [showCustomAlert, setShowCustomAlert] = useState(false);

    const [alertMessage, setAlertMessage] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [allClients, setClients] = useState([]);

    const [amount, setAmount] = useState('');
    const [remarks, setRemarks] = useState('');

    const { showAlertModal, hideAlert } = useGlobalAlert();



    const route = useRoute();
    const page = route.params?.page ?? null;

    // const [fontsLoaded] = useFonts({
    //     Montserrat_600SemiBold,
    //     Montserrat_500Medium,
    // });

    useEffect(() => {
        // if (!fontsLoaded) return; // 
        if (page === 'home') {
            setModalVisible(true);
        } else {
            setModalVisible(false);
        }

        getAllReceipts();
        getClientsAll();
    }, [page]);

    // if (!fontsLoaded) {
    //     return null; // 
    // }


    const getAllReceipts = async () => {
        try {
            const response = await TaskService.getMyReceipts();
            if (response.status == 1) {
                setReceiptData(response.data);
            }

            console.log('Receipt Data:', response.data);
            return response.data;
        } catch (error) {
            throw null;
        }
    }

    const getClientsAll = () => {
        try {
            TaskService.getAllClients().then((response) => {
                if (response.status == 1) {
                    setClients(response.data || []);
                }
            });
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }

    const handleGenerate = async () => {
        if (!selectClient) {
            showAlertModal('Please select a client.', true)
            return;
        }
        if (!selectPaymode) {
            showAlertModal('Please select a payment mode.', true)
            return;
        }
        if (!amount || isNaN(amount)) {
            showAlertModal('Please enter a valid amount.', true)
            return;
        }

        let userId = await AsyncStorage.getItem('user_id');
        let request = {
            "empId": userId,
            "clientId": selectClient,
            "paymentMode": selectPaymode,
            "amount": amount,
            "remarks": remarks,
        };
        try {
            const response = await TaskService.generateReceipt(request);

            if (response?.status == 1) {
                setModalVisible(false);
                showAlertModal('Receipt generated successfully.', false);
                setselectClient('');
                setselectPaymode('');
                getAllReceipts();
                setAmount('');
                setRemarks('');
            } else {
                showAlertModal(response?.data || 'Something went wrong.', true);
            }
        } catch (error) {
            console.error('Error while submitting payment:', error);
            Alert.alert('Error', 'Something went wrong while submitting the receipt.');
        }

    };

    const openPdfInBrowser = (url) => {
        if (!url || !url.startsWith('http')) {
            Alert.alert('Invalid URL', 'The URL is not valid or missing.');
            return;
        }

        Linking.openURL(url)
            .catch((err) => {
                console.error('Failed to open URL:', err);
                Alert.alert('Error', 'Unable to open PDF.');
            });
    };



    const generateAndSharePDF = async () => {
        const options = {
            html: '<h1>Your Receipt</h1><p>This is your receipt content.</p>',
            fileName: 'receipt',
            directory: 'Documents',
        };

        try {
            const file = await RNHTMLtoPDF.convert(options);
            await Share.open({ url: `file://${file.filePath}` });
        } catch (err) {
            console.error('PDF Generation/Sharing Error:', err);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <Image style={{ width: 14, height: 14, }} source={require('../../assets/leftarrow.png')} />
                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 18, color: '#2F81F5', marginLeft: 4, }}>Receipt</Text>
                    </TouchableOpacity>
                    {/* <View style={{ position: 'relative', width: 50, height: 50, borderRadius: '50%', backgroundColor: '#F6FAFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                        <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
                            <Image style={{ width: 18, height: 18, }} source={require('../../assets/noti.png')} />
                        </TouchableOpacity>
                        <Text style={{ position: 'absolute', fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 13, color: '#fff', right: 0, top: 0, width: 15, height: 15, backgroundColor: '#F43232', borderRadius: 50, textAlign: 'center', }}>2</Text>
                    </View> */}
                </View>

                <View style={{ flexDirection: 'row', marginTop: 20, }}>
                    <View style={{ flex: 1, position: 'relative', }}>
                        <TextInput
                            style={{ fontSize: 14, fontFamily: 'Montserrat_500Medium', height: 50, backgroundColor: '#F6FAFF', borderRadius: 30, paddingLeft: 20, paddingRight: 50, }}
                            placeholder="Search"
                            placeholderTextColor="#0C0D36"
                        />
                        <Image style={{ position: 'absolute', top: 16, right: 20, width: 20, height: 20, }} source={require('../../assets/search.png')} />
                    </View>
                    <TouchableOpacity onPress={() => setFilter(true)} style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: '#F6FAFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginLeft: 14, }}>
                        <Image style={{ width: 25, height: 25, }} source={require('../../assets/filter.png')} />
                        <Text style={{ position: 'absolute', fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 13, color: '#fff', right: 0, top: 0, width: 15, height: 15, backgroundColor: '#F43232', borderRadius: 50, textAlign: 'center', }}>2</Text>
                    </TouchableOpacity>
                </View>

                <View>
                    {Object.entries(receiptData).map(([dateKey, receipts]) => {
                        return (
                            <View key={dateKey}>
                                <Text style={styles.title}>{dateKey}</Text>

                                {receipts.map((item, index) => {
                                    const dateObj = new Date(item.createdAt);
                                    const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


                                    return (
                                        <View key={item.id} style={{ marginBottom: 15 }}>
                                            <View style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}>
                                                <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                                                    <Image style={{ width: 23, height: 30 }} source={require('../../assets/pdf.png')} />

                                                    <View style={{ paddingLeft: 12 }}>
                                                        <Text
                                                            numberOfLines={1}
                                                            ellipsizeMode="tail"
                                                            style={{
                                                                width: 180,
                                                                fontFamily: 'Montserrat_500Medium',
                                                                fontSize: 16,
                                                                color: '#0C0D36',
                                                                paddingBottom: 3,
                                                            }}>
                                                            {item.receiptId || `Receipt Copy ${index + 1}`}
                                                        </Text>
                                                        <Text style={{
                                                            fontFamily: 'Montserrat_500Medium',
                                                            fontSize: 12,
                                                            color: '#0C0D36',
                                                        }}>
                                                            Created at {formattedTime}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <TouchableWithoutFeedback onPress={() => setActiveMenuIndex(null)}>
                                                    <View>
                                                        <Pressable
                                                            style={[styles.touchBtn, { paddingHorizontal: 4 }]}
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                setActiveMenuIndex(activeMenuIndex === `${dateKey}_${index}` ? null : `${dateKey}_${index}`);
                                                            }}>
                                                            <Image style={{ width: 4, height: 23 }} source={require('../../assets/dotimg1.png')} />
                                                        </Pressable>

                                                        {activeMenuIndex === `${dateKey}_${index}` && (
                                                            <View style={styles.viewBx}>
                                                                <TouchableOpacity
                                                                    style={styles.viewText}
                                                                    onPress={() => {
                                                                        navigation.navigate('Receiptview', { receiptId: item.id });
                                                                        setActiveMenuIndex(null);
                                                                    }}>
                                                                    <Text style={styles.downloadText}>View</Text>
                                                                </TouchableOpacity>

                                                                <TouchableOpacity
                                                                    style={styles.viewText}
                                                                    onPress={() => {
                                                                        // Your Download logic
                                                                        setActiveMenuIndex(() => {
                                                                            TaskService.downloadReceipt({ receiptId: item.id }).then((res) => {
                                                                                if (res.status == 1) {
                                                                                    // showAlertModal('Receipt downloaded successfully.', false);
                                                                                    // TaskService.handleReceiptDownload(BASE_API_URL+res.data);
                                                                                    openPdfInBrowser(BASE_API_URL + res.data);
                                                                                } else {
                                                                                    showAlertModal(res?.data || 'Something went wrong.', true);
                                                                                }
                                                                            })
                                                                        });
                                                                    }}>
                                                                    <Text style={styles.downloadText}>Download</Text>
                                                                </TouchableOpacity>

                                                                <TouchableOpacity
                                                                    style={styles.viewText}
                                                                    onPress={() => {
                                                                        generateAndSharePDF();
                                                                    }}>
                                                                    <Text style={styles.downloadText}>Share</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        )}
                                                    </View>
                                                </TouchableWithoutFeedback>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })}
                </View>


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
                                    <Image style={{ width: 18, height: 18 }} source={require('../../assets/mdlclose.png')} />
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
                                    <Text style={styles.label}>Client</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectClient}
                                            onValueChange={(itemValue, itemIndex) =>
                                                setselectClient(itemValue)
                                            }>
                                            <Picker.Item label="Arun Sarkar" value="Arun Sarkar" />
                                            <Picker.Item label="Arijit Sarkar" value="Arijit Sarkar" />
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



            {/* Create Btn */}
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.createBtn}>
                <Text style={styles.createText}>Create</Text>
                <View>
                    <Image style={{ width: 16, height: 16, marginLeft: 8, marginTop: 8 }} source={require('../../assets/pen.png')} />
                </View>
            </TouchableOpacity>

            {/* Create Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                            <Text style={styles.modalText}>Create Receipt:</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Image style={{ width: 18, height: 18 }} source={require('../../assets/mdlclose.png')} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.label}>Client Name</Text>
                        <View style={styles.pickerContainer}>
                            {/* <Picker selectedValue={selectClient} onValueChange={setselectClient}>
                                <Picker.Item label="Select Client" value="" />
                                <Picker.Item label="Arun Sarkar" value="Arun Sarkar" />
                                <Picker.Item label="Arijit G." value="Arijit G." />
                                <Picker.Item label="Akash K." value="Akash K." />
                            </Picker> */}
                            <Picker
                                selectedValue={selectClient} onValueChange={setselectClient}
                            >
                                <Picker.Item label="Select Client" value="" />
                                {allClients.map((client) => (
                                    <Picker.Item key={client.id} label={client.client_name} value={client.id} />
                                ))}
                            </Picker>
                        </View>

                        <Text style={styles.label}>Payment Mode</Text>
                        <View style={styles.pickerContainer}>
                            <Picker selectedValue={selectPaymode} onValueChange={setselectPaymode}>
                                <Picker.Item label="Select Payment Mode" value="" />
                                <Picker.Item label="Cash" value="Cash" />
                                <Picker.Item label="UPI" value="UPI" />
                                <Picker.Item label="Net Banking" value="Net Banking" />
                            </Picker>
                        </View>

                        <Text style={styles.label}>Amount</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Amount"
                            placeholderTextColor="#0C0D36"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Remarks</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Placeholder"
                            placeholderTextColor="#0C0D36"
                            value={remarks}
                            onChangeText={setRemarks}
                        />

                        <TouchableOpacity
                            onPress={handleGenerate}
                            style={{
                                backgroundColor: '#2F81F5',
                                borderRadius: 28,
                                paddingVertical: 16,
                                paddingHorizontal: 10,
                            }}>
                            <Text style={{
                                fontFamily: 'Montserrat_600SemiBold',
                                fontSize: 16,
                                color: 'white',
                                textAlign: 'center',
                            }}>Generate</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 2,
        marginBottom: 8,
        fontFamily: 'Montserrat_500Medium',
    },

    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#fff',
    },
    title: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 16,
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
        bottom: 100,
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

    // Modal Start 
    modalBackground: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalContainer: {
        width: '100%',
        padding: 15,
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


})

export default Receipt
