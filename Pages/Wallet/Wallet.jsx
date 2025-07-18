import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Animated, Easing, Platform, Modal, TextInput, Button, ActivityIndicator, RefreshControl, TouchableWithoutFeedback } from 'react-native';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium, Montserrat_400Regular } from '@expo-google-fonts/montserrat';
import { Picker } from '@react-native-picker/picker';
import DatePicker from 'react-native-date-picker'
import GlobalStyles from '../GlobalStyles';
import TaskService from '../Services/task_service';
import { useGlobalAlert } from '../../Context/GlobalAlertContext';
import RazorpayCheckout from 'react-native-razorpay';

import RazorpayWebView from './RazorpayWebView'
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { lightTheme } from '../GlobalStyles'
import NotificationCount from '../Notifications/NotificationCount';

const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};


function Wallet({ navigation, progress = 0.5 }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectType, setselectType] = useState();
    const [filter, setFilter] = useState(false);
    const [selectClient, setselectClient] = useState();
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const animatedWidth = useRef(new Animated.Value(0)).current;
    const [employees, setEmployees] = useState([]);

    const [amount, setAmount] = useState('');
    const [remarks, setRemarks] = useState('');
    const [selectPaymode, setSelectPaymode] = useState('cash');
    const [selectEmployee, setSelectEmployee] = useState('');
    const [selectCenter, setSelectCenter] = useState('');

    const { showAlertModal, hideAlert } = useGlobalAlert();

    const [showPayment, setShowPayment] = useState(false);
    const [transactionId, setTransactionId] = useState(null);
    const [allCenters, setCenters] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [allClients, setClients] = useState([]);

    const [animatedValue] = useState(new Animated.Value(0)); // for counter
    const [displayedAmount, setDisplayedAmount] = useState(0); // number to show
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());

    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [selectTransactiontype, setTransactiontype] = useState(false);


    const [activeTransactionId, setActiveTransactionId] = useState(null);
    const [userId, setUserId] = useState(null)

    const user = {
        name: AsyncStorage.getItem('user_name'),
        email: AsyncStorage.getItem('user_email'),
        contact: null
    };


    useEffect(() => {
        Animated.timing(animatedWidth, {
            toValue: progress * 100,
            duration: 500,
            useNativeDriver: false,
        }).start();

        fetchWalletDetails();
        getTransactionHistory();
        getAllCenters();
        getAllClients();
        getUserId();

        const max = details.walletMaxLimit;
        const balance = details.walletBalance;

        if (max > 0 && balance > 0) {
            Animated.timing(animatedValue, {
                toValue: balance,
                duration: 2000,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }).start();
        }

        const listener = animatedValue.addListener(({ value }) => {
            setDisplayedAmount(Math.floor(value));
        });

        return () => {
            animatedValue.removeListener(listener);
        };

    }, [progress, details.walletBalance]);


    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchWalletDetails();
        getTransactionHistory();
        getAllCenters();
        resetFilter();
        wait(2000).then(() => setRefreshing(false));

    }, []);


    const fetchWalletDetails = async () => {
        TaskService.getMyWallet().then((res) => {
            if (res.status == 1) {
                setDetails(res.data);
                console.log('Wallet Details:', res.data);
            } else {
                setDetails([]);
                console.log('Error fetching wallet details:', res.message);
            }
        });
    }

    const getAllCenters = async () => {
        TaskService.getAllCentres().then((res) => {
            if (res.status == 1) {
                setCenters(res.data)
            } else {
                setCenters([])
            }
        })
    }

    const getAllClients = async () => {
        TaskService.getAllClients().then((res) => {
            if (res.status == 1) {
                setClients(res.data)
            } else {
                setClients([])
            }
        })
    }

    const getTransactionHistory = async () => {
        try {
            const today = new Date();
            const tenDaysAgo = new Date(today);
            tenDaysAgo.setDate(today.getDate() - 10);

            const formattedFrom = tenDaysAgo.toISOString().split('T')[0];
            const formattedToday = today.toISOString().split('T')[0];
            let requestData = {
                "fromDate": "",
                "toDate": "",
                "transactionType": "",
                "client": "",
                "limit": 10
            }

            TaskService.getMyTransactions(requestData).then((res) => {
                console.log("wallet trans",res.data)
                if (res.status == 1) {
                    setTransactions(res.data)
                    return
                } else {
                    setTransactions([])
                }
                
            });

        } catch (error) {
            console.error('Error fetching transaction history:', error);
        }
        finally {
            setLoading(false);
        }
    }

    const transferModal = async () => {
        setModalVisible(true);
        getAllEmployees();
    }

    const getAllEmployees = async () => {
        await TaskService.getAllLogistics().then((res) => {
            if (res.status == 1) {
                setEmployees(res.data)
            } else {
                setEmployees([])
            }
        })
    }
    const getUserId = async () => {
        const userId = await AsyncStorage.getItem('user_id');
        setUserId(userId)
      };

    const handleEmployeeTransfer = async () => {
        try {
            if (!selectEmployee) {
                showAlertModal('Please select an employee.', true)
                setLoading(false);
                return;
            }
            else if (!selectType) {
                showAlertModal('Transfer Type is required.', true)
                return;
            }
            else if (!amount || !remarks) {
                showAlertModal('Amount and Remarks are required.', true)
                return;
            } else if (amount > details.walletBalance) {
                showAlertModal("You don't have sufficient balance.", true)
                return;
            } 
            else if(selectEmployee == userId) {
                showAlertModal("You cannot send money to your own account.", true)
                return;
            }
            else if (amount == 0) {
                showAlertModal("You can't transfer less then Rs 1", true)
                return;
            }


            const employeePayload = {
                targetEmpId: Number(selectEmployee),
                amount: Number(amount),
                remarks,
            };

            setLoading(true);
            await TaskService.transferToEmp(employeePayload).then((res) => {
                if (res.status == 1) {
                    showAlertModal('Transfer to employee successful.', false);
                    setModalVisible(false);
                    resetForm();

                    fetchWalletDetails();
                    getTransactionHistory();
                    setLoading(false);
                    setModalVisible(false);
                } else {
                    showAlertModal('Failed Transfer to employee.', true);
                    setModalVisible(false);
                    setLoading(false);
                }
            });

        } catch (error) {
            showAlertModal('Employee transfer failed.', true);
        }
    };

    const handleOrganizationCashTransfer = async () => {

        if (amount > details.walletBalance) {
            showAlertModal("You don't have sufficient balance.", true)
            return;
        }
        const orgPayload = {
            centreId: Number(selectCenter),
            paymentMode: selectPaymode,
            amount: Number(amount),
            remarks
            // transactionId,
        };

        TaskService.transferToOrg(orgPayload).then((res) => {
            if (res.status == 1) {
                showAlertModal("Transfer request placed successfully!", false);
                resetForm();
                onRefresh();
            } else {
                showAlertModal(res.data, true)
            }
        })

        setModalVisible(false);
    };

    const handleOrgaizationPayment = async () => {
        if (!selectPaymode) {
            showAlertModal('Please select a payment mode.', true);
            return;
        }
        if (amount <= 0) {
            showAlertModal('Please enter a valid amount.', true);
            return;
        }
        if (amount > details.walletBalance) {
            showAlertModal("You don't have sufficient balance.", true);
            return;
        }

        setShowPayment(true);
    }

    const resetForm = () => {
        setSelectEmployee('');
        setSelectCenter('');
        setSelectPaymode('');
        setAmount('');
        setRemarks('');
    };


    const handlePaymentSuccess = (paymentData) => {
        setShowPayment(false);
        const transactionId = paymentData.razorpay_payment_id;
        setTransactionId(transactionId);

        showAlertModal('Payment Successful!', false);

        const orgPayload = {
            centreId: Number(selectCenter) || null,
            paymentMode: selectPaymode,
            amount: Number(amount),
            remarks,
            transactionId,
        };

        TaskService.transferToOrg(orgPayload).then((res) => {
            if (res.status == 1) {
                showAlertModal("Transfer request placed successfully!", false);
                resetForm();
                onRefresh();
            } else {
                showAlertModal(res.data, true)
            }
        })

        setModalVisible(false);
    };

    const handlePaymentFailure = (error) => {
        setShowPayment(false);
        showAlertModal('Payment Failed or Dismissed', true);
    };

    const showFromDatePicker = () => {
        setShowFromPicker(true);
    };

    const showToDatePicker = () => {
        setShowToPicker(true);
    };

    const onFromChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowFromPicker(false); // Always hide manually on Android
        }

        if (event?.type === 'set' || Platform.OS === 'ios') {
            if (selectedDate) {
                setFromDate(selectedDate);

                if (selectedDate > toDate) {
                    setToDate(selectedDate);
                    showAlertModal('To Date auto-updated to match From Date: ' + selectedDate.toDateString(), true);
                }
            }
        }
    };

    const onToChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowToPicker(false); // Always hide manually on Android
        }

        if (event?.type === 'set' || Platform.OS === 'ios') {
            if (selectedDate) {
                if (selectedDate >= fromDate) {
                    setToDate(selectedDate);
                } else {
                    showAlertModal('To date cannot be before From date', true);
                }
            }
        }
    };

    const submitFilter = async () => {
        const today = new Date();
        const tenDaysAgo = new Date(today);
        tenDaysAgo.setDate(today.getDate() - 10);

        const formattedFrom = tenDaysAgo.toISOString().split('T')[0];
        const formattedTo = toDate.toISOString().split('T')[0];
        try {
            let requestData = {
                "fromDate": formattedFrom,
                "toDate": formattedTo,
                "transactionType": selectTransactiontype,
                "client": selectClient,
                "limit": 0
            }

            TaskService.getMyTransactions(requestData).then((res) => {
                if (res.status == 1) {
                    setTransactions(res.data)
                    setFilter(false)
                    return
                } else {
                    setTransactions([])
                }
            });
        } catch (error) {
            console.error('Error fetching transaction history:', error);
        }
        finally {
            setLoading(false);
        }
    }

    const resetFilter = async () => {
        const today = new Date();
        setTransactiontype('');
        setselectClient('');
        setFromDate(today);
        setToDate(today);

    }


    const isActiveTrans = (id) => {
        setActiveTransactionId(prevId => (prevId === id ? null : id)); // toggle
      };
      

      const formatToINR = (amount) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
        }).format(amount || 0);
      };

    return (
        <SafeAreaView style={[
            styles.container,
            GlobalStyles.SafeAreaView,
            { paddingBottom: lightTheme.paddingBottomNew }
          ]}>
            <ScrollView showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }>

                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <Image style={{ width: 14, height: 14, }} source={require('../../assets/leftarrow.png')} />
                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 18, color: '#2F81F5', marginLeft: 4, }}>Wallet</Text>
                    </TouchableOpacity>
                    <View style={{ position: 'relative', width: 50, height: 50, marginTop:5, marginRight:2, borderRadius: 25, backgroundColor: '#F6FAFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                    <TouchableOpacity onPress={() => navigation.navigate('Notification')} >
                            <NotificationCount></NotificationCount>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Wallet Details */}
                <View style={styles.walletContainer}>
                    <Text style={styles.balance}>
                        ₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(details.walletBalance || 0)}
                    </Text>
                    <Text style={styles.balancelabel}>Amount Collected</Text>

                    <View style={styles.progressBar}>
                        <Animated.View
                            style={[
                                styles.progressFill,
                                {
                                    width: details.walletMaxLimit > 0
                                        ? animatedValue.interpolate({
                                            inputRange: [0, details.walletMaxLimit],
                                            outputRange: ['0%', '100%'],
                                            extrapolate: 'clamp',
                                        })
                                        : '0%',
                                },
                            ]}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                        <Text style={styles.labelText}>₹0</Text>
                        <Text style={styles.labelText}>₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(details.walletMaxLimit)}</Text>
                    </View>

                    <TouchableOpacity onPress={() => transferModal()} style={styles.amountBtn}>
                        <Text style={styles.amountText}>Transfer Amount</Text>
                    </TouchableOpacity>
                </View>


                {/* Transfer History */}
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, }}>
                        <View style={{ flex: 1, position: 'relative', }}>
                            <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 16, color: '#3085FE', }}>Transaction History</Text>
                        </View>
                        <TouchableOpacity onPress={() => setFilter(true)} style={{ width: 50, height: 50, borderRadius: '25', backgroundColor: '#F6FAFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginLeft: 14, }}>
                            <Image style={{ width: 25, height: 25, }} source={require('../../assets/filter.png')} />
                            <Text style={{ position: 'absolute', fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 13, color: '#fff', right: 0, top: 0, width: 15, height: 15, backgroundColor: '#F43232', borderRadius: 50, textAlign: 'center', }}>2</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ backgroundColor: '#F6FAFF', borderRadius: 20, padding: 15, marginTop: 10 }}>
                        {
                            transactions.map((item) => (
                            <TouchableWithoutFeedback key={item.id} onPress={() => isActiveTrans(item.id)}>
                                <View style={styles.amtBox}>
                                    <View style={styles.amtInnbox}>
                                        <View style={styles.flexBox}>
                                            <View style={styles.arrowBtn}>
                                            {
                                                item.transactionType === 'debit' ? (
                                                <Image style={{ width: 18, height: 18 }} source={require('../../assets/dibitedarrow.png')} />
                                                ) : (
                                                <Image style={{ width: 18, height: 18 }} source={require('../../assets/creditarrow.png')} />
                                                )
                                            }
                                            </View>
                                            <View style={styles.flexText}>
                                            <Text
                                                style={[
                                                styles.recAmnt,
                                                { color: item.transactionType === 'debit' ? 'red' : '#3085FE' }
                                                ]}
                                            >
                                                {item.transactionType === 'debit' ? 'Transfer Amount' : 'Received Amount'}
                                            </Text>
                                            <Text style={styles.clientName}>{item.remarks}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.rightBlock}>
                                            <Text style={styles.creditAmnt}>₹{item.billAmount}</Text>
                                            <Text style={styles.dates}>{dayjs(item.createdAt).format('MMMM D, YYYY h:mm A')}</Text>
                                            {/* {activeTransactionId === item.id && (
                                            <Text style={{ marginTop: 10, fontSize: 8 }}>
                                                Receipt ID: {item.receiptId}
                                                Payment Mode: .....
                                                Transaction ID: {item.transactionId}
                                            </Text>
                                            )} */}
                                        </View>
                                    </View>
                                    <View>
                                    {activeTransactionId === item.id && (
                                    <View style={{ marginTop:10, fontSize:8, borderTopWidth:1, borderTopColor:'#d8dbe0', paddingTop:10, }}>
                                        <View style={styles.transactionDtl}>
                                            <Text style={styles.tranIdd}>Receipt ID:</Text>
                                            <Text style={styles.tranRec}>{item.receipt?.receiptId}</Text>
                                        </View>
                                        {item.paymentMode && (
                                        <View style={styles.transactionDtl}>
                                            <Text style={styles.tranIdd}>Payment Mode:</Text>
                                            <Text style={styles.tranRec}>{item.paymentMode}</Text>
                                        </View>
                                        )}

                                        {item.transactionId && (
                                        <View style={styles.transactionDtl}>
                                            <Text style={styles.tranIdd}>Transaction ID:</Text>
                                            <Text style={styles.tranRec}>{item.transactionId}</Text>
                                        </View>
                                        )}
                                    </View>
                                    )}
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                            ))
                        }
                        </View>

                </View>

                

                {/* Wallet Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}>
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                                <Text style={styles.modalText}>Transfer Details</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Image style={{ width: 18, height: 18 }} source={require('../../assets/mdlclose.png')} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ padding: 15, }}>
                                <View>
                                    <Text style={styles.label}>Transfer Type</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectType}
                                            onValueChange={(itemValue, itemIndex) =>
                                                setselectType(itemValue)
                                            }
                                            style={styles.picker} // Apply text color here
                                            dropdownIconColor={lightTheme.inputText} // Android only 
                                        >
                                            <Picker.Item label="-Select-" value="" />
                                            <Picker.Item label="Employee" value="Employee" />
                                            <Picker.Item label="Organization" value="Organization" />
                                        </Picker>
                                    </View>
                                </View>

                                {selectType === 'Employee' && (
                                    <>
                                        <Text style={styles.label}>Select Employee</Text>
                                        <View style={styles.pickerContainer}>
                                            <Picker
                                                selectedValue={selectEmployee}
                                                onValueChange={(value) => setSelectEmployee(value)}
                                                style={styles.picker} // Apply text color here
                                                dropdownIconColor={lightTheme.inputText} // Android only 
                                            >
                                                <Picker.Item label="-Select-" value="" />
                                                {
                                                    employees.map((item) => (
                                                        <Picker.Item key={item.id} label={item.employee_name} value={item.id} />
                                                    ))
                                                }
                                            </Picker>
                                        </View>
                                    </>
                                )}

                                <Text style={styles.label}>Payment Mode</Text>
                                <View style={[styles.pickerContainer, selectType === 'Employee' && { opacity: 0.5 }]}>
                                    <Picker
                                        selectedValue={selectPaymode}
                                        enabled={selectType !== 'Employee'}
                                        onValueChange={(value) => setSelectPaymode(value)}
                                        style={styles.picker} // Apply text color here
                                        dropdownIconColor={lightTheme.inputText} // Android only 
                                    >
                                        <Picker.Item label="-select-" value="" />
                                        <Picker.Item label="Cash" value="cash" />
                                        <Picker.Item label="Online" value="online" />
                                    </Picker>
                                </View>

                                {selectType === 'Organization' && selectPaymode === 'cash' && (
                                    <>
                                        <Text style={styles.label}>Select Center</Text>
                                        <View style={styles.pickerContainer}>
                                            <Picker
                                                selectedValue={selectCenter}
                                                onValueChange={(value) => setSelectCenter(value)}
                                                style={styles.picker} // Apply text color here
                                                dropdownIconColor={lightTheme.inputText} // Android only 
                                            >
                                                <Picker.Item label="-Select-" value="" />
                                                {
                                                    allCenters.map((item) => (
                                                        <Picker.Item key={item.id} label={item.centreName} value={item.id} />
                                                    ))
                                                }
                                            </Picker>
                                        </View>
                                    </>
                                )}



                                <Text style={styles.label}>Enter Amount</Text>
                                <TextInput
                                    style={styles.input}
                                    value={amount}
                                    onChangeText={setAmount}
                                    placeholder="Enter Amount"
                                    placeholderTextColor="#0C0D36"
                                    keyboardType="numeric"
                                />

                                <Text style={styles.label}>Remarks</Text>
                                <TextInput
                                    style={styles.input}
                                    value={remarks}
                                    onChangeText={setRemarks}
                                    placeholder="Remarks"
                                    placeholderTextColor="#0C0D36"
                                />
                                <View>
                                    {showPayment && (
                                        <Modal visible={showPayment} animationType="slide">
                                            <RazorpayWebView
                                                amount={amount}
                                                user={user}
                                                onSuccess={handlePaymentSuccess}
                                                onFailure={handlePaymentFailure}
                                            />
                                        </Modal>
                                    )}

                                    {/* Wallet Transfer Button */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (!selectType) {
                                                showAlertModal("Please select Transfer Type fisrt.", true)
                                            }
                                            if (selectType === 'Employee') {
                                                handleEmployeeTransfer();
                                                console.log('handleEmployeeTransfer called')
                                            }
                                            else if (selectPaymode === 'online' && selectType === 'Organization') {
                                                handleOrgaizationPayment();
                                                console.log('setShowPayment called')
                                            }
                                            else if (selectPaymode === 'cash' && selectType === 'Organization') {
                                                handleOrganizationCashTransfer();
                                                console.log('handleOrganizationCashTransfer called')
                                            }
                                        }}
                                        style={{
                                            backgroundColor: '#2F81F5',
                                            borderRadius: 28,
                                            paddingVertical: 16,
                                            paddingHorizontal: 10,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontFamily: 'Montserrat_600SemiBold',
                                                fontSize: 16,
                                                color: 'white',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {selectType === 'Employee' ? 'Send' : `Send ₹${amount}`}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                            </View>
                        </View>
                    </View>
                </Modal>

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
                                <View style={{ padding: 0 }}>
                                    <Text>From Date:</Text>
                                    <TouchableOpacity
                                        onPress={showFromDatePicker}
                                        style={{
                                            backgroundColor: '#2F81F5',
                                            paddingVertical: 12,
                                            paddingHorizontal: 16,
                                            borderRadius: 8,
                                            alignItems: 'center',
                                            marginVertical: 8,
                                        }}>
                                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                                            {fromDate.toDateString()}
                                        </Text>
                                    </TouchableOpacity>

                                    {showFromPicker && (
                                        <DateTimePicker
                                            value={fromDate}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={onFromChange}
                                            maximumDate={new Date(2100, 11, 31)}
                                        />
                                    )}

                                    <Text>To Date:</Text>
                                    <TouchableOpacity onPress={showToDatePicker}
                                        style={{
                                            backgroundColor: '#2F81F5',
                                            paddingVertical: 12,
                                            paddingHorizontal: 16,
                                            borderRadius: 8,
                                            alignItems: 'center',
                                            marginVertical: 8,
                                        }}>
                                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{toDate.toDateString()}</Text>
                                    </TouchableOpacity>

                                    {showToPicker && (
                                        <DateTimePicker
                                            value={toDate}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={onToChange}
                                            minimumDate={fromDate}
                                            maximumDate={new Date(2100, 11, 31)}
                                        />
                                    )}
                                </View>
                                <View>
                                    <Text style={styles.label}>Transaction Type</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            style={styles.picker} // Apply text color here
                                            dropdownIconColor={lightTheme.inputText} // Android only
                                            selectedValue={selectTransactiontype}
                                            onValueChange={(itemValue, itemIndex) =>
                                                setTransactiontype(itemValue)
                                            }>
                                            <Picker.Item label="-Select-" value="" />
                                            <Picker.Item label="Credit" value="credit" />
                                            <Picker.Item label="Debit" value="debit" />
                                        </Picker>
                                    </View>
                                </View>
                                <View>
                                    <Text style={styles.label}>Client</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            style={styles.picker} // Apply text color here
                                            dropdownIconColor={lightTheme.inputText} // Android only
                                            selectedValue={selectClient}
                                            onValueChange={(itemValue, itemIndex) =>
                                                setselectClient(itemValue)
                                            }>
                                            <Picker.Item label="-Select-" value="" />
                                            {
                                                allClients.map((item) => (
                                                    <Picker.Item key={item.id} label={item.client_name} value={item.id} />
                                                ))
                                            }

                                        </Picker>
                                    </View>
                                </View>
                                <View style={{ borderTopWidth: 1, borderTopColor: '#ECEDF0', paddingVertical: 25, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', }}>
                                    <TouchableOpacity style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12, }} onPress={() => resetFilter()}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#2F81F5', textAlign: 'center', }}>Reset All</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={{ width: '47%', backgroundColor: '#2F81F5', borderRadius: 28, padding: 12, }} onPress={() => submitFilter()}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', color: '#fff', textAlign: 'center', }}>Apply Filters</Text>
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
    );
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
    balance: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 32,
        color: '#0C0D36',
    },
    balancelabel: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 12,
        color: 'rgba(12,13,54,0.5)',
        marginTop: 10,
    },
    labelText: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 16,
        color: 'rgba(12,13,54,0.5)',
    },
    progressBar: {
        width: '100%',
        height: 18,
        backgroundColor: '#F6FAFF',
        borderRadius: 35,
        overflow: 'hidden',
        marginTop: 22,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#3085FE',
        borderRadius: 35,
    },
    amountBtn: {
        backgroundColor: '#3085FE',
        borderRadius: 28,
        padding: 15,
        marginTop: 20,
    },
    amountText: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
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
        fontFamily: 'Montserrat_500Medium',
        height: 54,
        borderWidth: 1,
        borderColor: '#ECEDF0',
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 15,
        marginBottom: 15,
        borderRadius: 10,
    },
    pickerContainer: {
        fontFamily: 'Montserrat_500Medium',
        height: 54,
        borderWidth: 1,
        borderColor: '#ECEDF0',
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 0,
        marginBottom: 15,
        borderRadius: 10,
    },
    textarea: {
        fontFamily: 'Montserrat_500Medium',
        height: 54,
        borderWidth: 1,
        borderColor: '#ECEDF0',
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 15,
        marginBottom: 15,
        borderRadius: 10,
    },
    //
    amtBox: {
        // flexDirection: 'row',
        // justifyContent: 'space-between',
        // alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 15,
        // iOS Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        // Android Shadow
        elevation: 2,
        padding: 15,
        marginBottom: 12,
    },
    amtInnbox:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionDtl:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom:5,
    },
    tranIdd:{
        fontFamily: 'Montserrat-Medium',
        fontSize:12,
        color:"#000000",
        width:115,
    },
    tranRec:{
        flex:1,
        fontFamily: 'Montserrat-Medium',
        fontSize:12,
        color: '#3085FE',
        flexWrap: 'wrap',
        overflow: 'hidden',
       includeFontPadding: false,
    },
    flexBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
    },
    arrowBtn: {
        width: 34,
        height: 34,
        backgroundColor: '#F4F9FF',
        borderRadius: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flexText: {
        flex: 1,
        paddingLeft: 10,
    },
    recAmnt: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 12,
        color: '#3085FE',
    },
    clientName: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 12,
        color: '#0C0D36',
        paddingTop: 3,
    },
    creditAmnt: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 14,
        color: '#0C0D36',
        textAlign: 'right',
    },
    dates: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 12,
        color: '#0C0D36',
        textAlign: 'right',
        paddingTop: 6,
    },









});


export default Wallet

