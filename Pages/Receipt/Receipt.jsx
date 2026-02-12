import { useRoute } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Alert, Text, TouchableOpacity, Pressable, Image, RefreshControl, ActivityIndicator, ScrollView, TouchableWithoutFeedback, TextInput, Modal, PermissionsAndroid, Platform } from 'react-native';
// import { useFonts, Montserrat-SemiBold, Montserrat-Medium } from '@expo-google-fonts/montserrat';
import { Picker } from '@react-native-picker/picker';
// import Menu from '../Menu-bar/Menu'
import TaskService from '../Services/task_service';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGlobalAlert } from '../../Context/GlobalAlertContext';
// import { globalApiClient, apiClient } from '../../Pages/Services/API';
// import { BASE_API_URL } from '../Services/API'
import { toWords } from 'number-to-words';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { GlobalStyle, lightTheme } from '../GlobalStyles';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { imageBase64, logoBase64 } from './base64image'
import _ from 'lodash';



const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};

function Receipt({ navigation }) {
    const [showMenu, setShowMenu] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [denominationMdl, setDenominationMdl] = useState(false);
    const [selectClient, setselectClient] = useState();
    const [selectPaymode, setselectPaymode] = useState();
    const [filter, setFilter] = useState(false);
    // const [selectPayment, setSelectPayment] = useState(false);
    const [receiptData, setReceiptData] = useState([]);
    const [activeMenuIndex, setActiveMenuIndex] = useState(null);

    const [loading, setLoading] = useState(true);

    // const [showCustomAlert, setShowCustomAlert] = useState(false);

    const [allClients, setClients] = useState([]);
    const [clientsByLogistic, setClientsByLogistic] = useState([]);

    const [amount, setAmount] = useState('');
    const [remarks, setRemarks] = useState('');

    const { showAlertModal, hideAlert } = useGlobalAlert();

    const [query, setQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);



    const route = useRoute();
    const page = route.params?.page ?? null;

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    const [pickerMode, setPickerMode] = useState(null); // 'from' or 'to'
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);


    const showDatePicker = (mode) => {
        setPickerMode(mode);
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
        setPickerMode(null);
    };

    const handleConfirm = (date) => {
        if (pickerMode === 'from') {
            setFromDate(date);
        } else {
            setToDate(date);
        }
        hideDatePicker();
    };

    const formatDate = (date) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0'); // Months are 0-indexed
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    };




    useEffect(() => {
        if (page === 'home') {
            setModalVisible(true);
        } else {
            setModalVisible(false);
        }

        getAllReceipts();
        getClientsAll();
        getAllClientByLogistic();
    }, [page]);



    const getAllReceipts = async () => {
        setLoading(true);
        try {
            let request = {
                "clientId": null,
                "fromDate": null,
                "toDate": null
            }
            const response = await TaskService.getMyReceipts(request);
            console.log('fetching all data')
            if (response.status == 1) {
                setReceiptData(response.data);
            }
            return response.data;
        } catch (error) {
            throw null;
        } finally {
            setLoading(false);
        }
    }

    const getClientsAll = () => {
        try {
            TaskService.getAllClients().then((response) => {
                if (response.status == 1) {
                    setClients(response.data || []);
                } else {
                    setClients([]);
                }
            });
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }
    const getAllClientByLogistic = () => {
        try {
            TaskService.getClientListByLogistic().then((response) => {
                if (response.status == 1) {
                    setClientsByLogistic(response.data);
                } else {
                    setClientsByLogistic([]);
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


    const generateAndSharePDF = async (item) => {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
            <style>
                 * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body{ font-family: "Montserrat", sans-serif; background:#f0f4f8; padding:20px;  }
        .payment-card{ position:relative; background:#ffffff; border-radius:20px; padding:40px 25px; max-width:550px;  width:100%; position:relative; border:1px solid #e5e7eb; border-top:2px solid #4CAF50; margin:0 auto; }
        .success-icon{ width:60px; height:60px; background:#4CAF50; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 30px; position:relative; animation:pulse 2s infinite; }

        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
            }
            70% {
                box-shadow: 0 0 0 20px rgba(76, 175, 80, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
            }
        }

        .checkmark { color:white; font-size:24px; font-weight:bold; }
        .title{ color:#1f2937; font-size:28px; font-weight:600; text-align:center; margin-bottom:10px; }
        .subtitle{ color:#6b7280; font-size:16px; text-align:center; margin-bottom:0; }
        .amount-section{ text-align:center; margin:20px 0 40px; padding:20px; background:#f9fafb; border-radius:12px; border:1px solid #e5e7eb; }
        .amount-label{ color:#6b7280; font-size:14px; margin-bottom:8px; }
        .amount-value{ color:#1f2937; font-size:36px; font-weight:700; }
        .details-section{ margin-bottom:30px; }
        .detail-row{ display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-bottom:1px solid #e5e7eb; }
        .detail-row:last-child{ border-bottom:none; }
        .detail-label{ color:#6b7280; font-size:14px; }
        .detail-value{ color:#1f2937; font-size:14px; font-weight:500; text-align:right; max-width:200px; }
        .fee-section{ background:#f9fafb; border-radius:8px; padding:15px; margin-top:20px; border:1px solid #e5e7eb; }
        .fee-row{ display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .fee-row:last-child{ margin-bottom:0; font-weight:600; color:#4CAF50; }
        .fee-label{ color:#6b7280; font-size:14px; }
        .fee-value{ color:#1f2937; font-size:14px; }
        .reference-code{ background:rgba(76, 175, 80, 0.1); border:1px solid rgba(76, 175, 80, 0.3); border-radius:8px; padding:12px; margin-top:20px; text-align:center; }
        .reference-label{ color:#4CAF50; font-size:12px; margin-bottom:5px; }
        .reference-value{ color:#1f2937; font-size:16px; font-weight:600; letter-spacing:1px; }
        .partner{ position:relative; z-index:1; color:#1f2937; font-size:16px; line-height:1; font-weight:400; letter-spacing:1px; text-align:center; margin:25px 0 15px; }
        .partner .bg{ display:inline-block; background:#fff; padding:0 6px; }
        .partner .line{ position:absolute; left:0; right:0; top:8px; width:70%; height:1px; background:#e5e7eb; z-index:-1; margin:0 auto; }
        .part-main{ background:#f9fafb; border-radius:8px; padding:15px; margin-top:20px; border:1px solid #e5e7eb; border-top:2px solid #4CAF50; }
        .branding{ display:flex; align-items:center; justify-content:center; }
        .branding .logo{ width:70px; }
        .branding .logo img{ max-width:100%; }
        .branding .text{ padding-left:10px; }
        .branding .text h3{ font-family: "Arima", system-ui; font-size:23px; line-height:1; font-weight:600; color:#33a651; }

        .dv-line{ position:relative; z-index:1; display:flex; align-items:center; justify-content:space-between; margin:0 -40px; margin-top:20px; }
        .round-box-one{ width:30px; height:30px; background:#f0f4f8; border-radius:50%; }
        .round-box-two{ width:30px; height:30px; background:#f0f4f8; border-radius:50%; }
        .dotted-line{ position:absolute; width:100%; height:2px; left:0; right:0; top:50%; transform:translateY(-50%); border:2px dashed #e2e9f0; z-index:-1; }

            </style>
            </head>
            <body>
            <div class="payment-card">
        <div class="success-icon">
            <span class="checkmark">✓</span>
        </div>

        <h1 class="title">Payment Success!</h1>
        <p class="subtitle">Your payment has been successfully processed.</p>
        <div class="dv-line">
            <div class="round-box-one"></div>
            <div class="round-box-two"></div>
            <div class="dotted-line"></div>  
        </div>
        <div class="amount-section">
            <div class="amount-label">Total Payment</div>
            <div class="amount-value">${formatToINR(item?.amount)}</div>
        </div>
        
        <div class="details-section">
            <div class="detail-row">
                <span class="detail-label">Payment Method</span>
                <span class="detail-value">${item?.paymentMode || ''}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Date and Time</span>
                <span class="detail-value">${formatDateTime(item?.createdAt)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Sender Name</span>
                <span class="detail-value">${item?.generatedBy || ''}</span>
            </div>
        </div>
        
        <div class="fee-section">
            <div class="fee-row">
                <span class="fee-label">Amount</span>
                <span class="fee-value">${formatToINR(item?.amount)}</span>
            </div>
            <div class="fee-row">
                <span class="fee-label">Amount In Words</span>
                <span class="fee-value">${toWords(item?.amount || 0).toLowerCase().replace(/\b\w/g, char => char.toUpperCase())} only</span>
            </div>
        </div>
        
        <div class="dv-line">
            <div class="round-box-one"></div>
            <div class="round-box-two"></div>
            <div class="dotted-line"></div>  
        </div>

        <div class="reference-code">
            <div class="reference-label">Payment Receipt</div>
            <div class="reference-value">${item?.receiptId || ''}</div>
        </div>

        <h5 class="partner">
            <span class="bg">Your Trusted Partner</span>
            <span class="line"></span>
        </h5>

        <div class="part-main">
            <div class="branding">
            <div class="logo">
                <img src="${logoBase64}" alt="logo" />
            </div>
            <div class="text">
                <h3>Nirnayan</h3>
            </div>
            </div>
        </div>
    </div>
            </body>
            </html>
            `;

        const receiptName = `Receipt_${item?.receiptId || 'Unknown'}`.replace(/[^a-zA-Z0-9_-]/g, ''); // sanitize filename
        const options = {
            html: htmlContent,
            fileName: receiptName, // no .pdf
            directory: 'Documents',
            height: 841.89,
            width: 595.28,
        };


        try {
            const file = await RNHTMLtoPDF.convert(options);
            await Share.open({ url: `file://${file.filePath}` });
        } catch (err) {
            console.log('PDF Generation/Sharing Error:', err);
        }

    };


    const requestStoragePermission = async () => {
        if (Platform.OS === 'android') {
            if (Platform.Version >= 33) {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
                    PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
                ]);

                return (
                    granted['android.permission.READ_MEDIA_IMAGES'] === PermissionsAndroid.RESULTS.GRANTED ||
                    granted['android.permission.READ_MEDIA_VIDEO'] === PermissionsAndroid.RESULTS.GRANTED
                );
            } else {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'Storage Permission',
                        message: 'App needs access to download PDF.',
                        buttonPositive: 'Allow',
                    }
                );

                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
        }

        return true;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);

        // Format: DD-MM-YY
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = String(date.getFullYear()).slice(-2);

        // Format: HH:MM AM/PM
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hourFormatted = hours % 12 === 0 ? 12 : hours % 12;

        const formattedDate = `${day}-${month}-${year}`;
        const formattedTime = `${hourFormatted}:${minutes} ${ampm}`;

        return `${formattedDate} at ${formattedTime}`;
    };


    const formatToINR = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount || 0);
    };



    const generateAndDownloadPDF = async (item) => {
        const receiptName = `Receipt_${item?.receiptId || 'Unknown'}`.replace(/[^a-zA-Z0-9_-]/g, '');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
            <style>
                 * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body{ font-family: "Montserrat", sans-serif; background:#f0f4f8; padding:20px;  }
        .payment-card{ position:relative; background:#ffffff; border-radius:20px; padding:40px 25px; max-width:550px;  width:100%; position:relative; border:1px solid #e5e7eb; border-top:2px solid #4CAF50; margin:0 auto; }
        .success-icon{ width:60px; height:60px; background:#4CAF50; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 30px; position:relative; animation:pulse 2s infinite; }

        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
            }
            70% {
                box-shadow: 0 0 0 20px rgba(76, 175, 80, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
            }
        }

        .checkmark { color:white; font-size:24px; font-weight:bold; }
        .title{ color:#1f2937; font-size:28px; font-weight:600; text-align:center; margin-bottom:10px; }
        .subtitle{ color:#6b7280; font-size:16px; text-align:center; margin-bottom:0; }
        .amount-section{ text-align:center; margin:20px 0 40px; padding:20px; background:#f9fafb; border-radius:12px; border:1px solid #e5e7eb; }
        .amount-label{ color:#6b7280; font-size:14px; margin-bottom:8px; }
        .amount-value{ color:#1f2937; font-size:36px; font-weight:700; }
        .details-section{ margin-bottom:30px; }
        .detail-row{ display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-bottom:1px solid #e5e7eb; }
        .detail-row:last-child{ border-bottom:none; }
        .detail-label{ color:#6b7280; font-size:14px; }
        .detail-value{ color:#1f2937; font-size:14px; font-weight:500; text-align:right; max-width:200px; }
        .fee-section{ background:#f9fafb; border-radius:8px; padding:15px; margin-top:20px; border:1px solid #e5e7eb; }
        .fee-row{ display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .fee-row:last-child{ margin-bottom:0; font-weight:600; color:#4CAF50; }
        .fee-label{ color:#6b7280; font-size:14px; }
        .fee-value{ color:#1f2937; font-size:14px; }
        .reference-code{ background:rgba(76, 175, 80, 0.1); border:1px solid rgba(76, 175, 80, 0.3); border-radius:8px; padding:12px; margin-top:20px; text-align:center; }
        .reference-label{ color:#4CAF50; font-size:12px; margin-bottom:5px; }
        .reference-value{ color:#1f2937; font-size:16px; font-weight:600; letter-spacing:1px; }
        .partner{ position:relative; z-index:1; color:#1f2937; font-size:16px; line-height:1; font-weight:400; letter-spacing:1px; text-align:center; margin:25px 0 15px; }
        .partner .bg{ display:inline-block; background:#fff; padding:0 6px; }
        .partner .line{ position:absolute; left:0; right:0; top:8px; width:70%; height:1px; background:#e5e7eb; z-index:-1; margin:0 auto; }
        .part-main{ background:#f9fafb; border-radius:8px; padding:15px; margin-top:20px; border:1px solid #e5e7eb; border-top:2px solid #4CAF50; }
        .branding{ display:flex; align-items:center; justify-content:center; }
        .branding .logo{ width:70px; }
        .branding .logo img{ max-width:100%; }
        .branding .text{ padding-left:10px; }
        .branding .text h3{ font-family: "Arima", system-ui; font-size:23px; line-height:1; font-weight:600; color:#33a651; }

        .dv-line{ position:relative; z-index:1; display:flex; align-items:center; justify-content:space-between; margin:0 -40px; margin-top:20px; }
        .round-box-one{ width:30px; height:30px; background:#f0f4f8; border-radius:50%; }
        .round-box-two{ width:30px; height:30px; background:#f0f4f8; border-radius:50%; }
        .dotted-line{ position:absolute; width:100%; height:2px; left:0; right:0; top:50%; transform:translateY(-50%); border:2px dashed #e2e9f0; z-index:-1; }

            </style>
            </head>
            <body>
            <div class="payment-card">
        <div class="success-icon">
            <span class="checkmark">✓</span>
        </div>

        <h1 class="title">Payment Success!</h1>
        <p class="subtitle">Your payment has been successfully processed.</p>
        <div class="dv-line">
            <div class="round-box-one"></div>
            <div class="round-box-two"></div>
            <div class="dotted-line"></div>  
        </div>
        <div class="amount-section">
            <div class="amount-label">Total Payment</div>
            <div class="amount-value">${formatToINR(item?.amount)}</div>
        </div>
        
        <div class="details-section">
            <div class="detail-row">
                <span class="detail-label">Payment Method</span>
                <span class="detail-value">${item?.paymentMode || ''}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Date and Time</span>
                <span class="detail-value">${formatDateTime(item?.createdAt)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Sender Name</span>
                <span class="detail-value">${item?.generatedBy || ''}</span>
            </div>
        </div>
        
        <div class="fee-section">
            <div class="fee-row">
                <span class="fee-label">Amount</span>
                <span class="fee-value">${formatToINR(item?.amount)}</span>
            </div>
            <div class="fee-row">
                <span class="fee-label">Amount In Words</span>
                <span class="fee-value">${toWords(item?.amount || 0).toLowerCase().replace(/\b\w/g, char => char.toUpperCase())} only</span>
            </div>
        </div>
        
        <div class="dv-line">
            <div class="round-box-one"></div>
            <div class="round-box-two"></div>
            <div class="dotted-line"></div>  
        </div>

        <div class="reference-code">
            <div class="reference-label">Payment Receipt</div>
            <div class="reference-value">${item?.receiptId || ''}</div>
        </div>

        <h5 class="partner">
            <span class="bg">Your Trusted Partner</span>
            <span class="line"></span>
        </h5>

        <div class="part-main">
            <div class="branding">
            <div class="logo">
                <img src="${logoBase64}" alt="logo" />
            </div>
            <div class="text">
                <h3>Nirnayan</h3>
            </div>
            </div>
        </div>
    </div>
            </body>
            </html>
            `;

        const options = {
            html: htmlContent,
            fileName: receiptName,
            directory: 'Documents',
            height: 841.89,
            width: 595.28,
        };

        try {
            const hasPermission = await requestStoragePermission();
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Cannot save the PDF without storage permission.');
                return;
            }
            setLoading(true)
            const file = await RNHTMLtoPDF.convert(options);

            // Share the file using react-native-share
            const shareOptions = {
                title: 'Save Receipt PDF',
                url: `file://${file.filePath}`,
                type: 'application/pdf',
                failOnCancel: false,
            };

            const result = await Share.open(shareOptions);

            if (!result.dismissedAction) {
                Alert.alert('Success', 'Receipt shared successfully.');
                setLoading(false)
            }

            console.log('PDF saved at:', file.filePath);
            setLoading(false)
        } catch (err) {
            console.log('PDF Generation/Sharing Error:', err);
            setLoading(false)
        }
    };


    const getStatusColor = (authoriseStatus, generateStatus) => {
        if (authoriseStatus == 0 || generateStatus == 0) {
            return '#DC3545'; // Rejected - Red
        } else if (authoriseStatus == 1 && generateStatus == 1) {
            return '#28A745';
        } else if (generateStatus == 1) {
            return '#007BFF';
        } else {
            return '#6C757D'; // Interim - gray (default fallback)
        }
    };


    const getStatusLabel = (authoriseStatus, generateStatus) => {
        console.log('status check', authoriseStatus, generateStatus)
        if (authoriseStatus == 1 && generateStatus == 1) {
            return 'Authorized';
        } else if (authoriseStatus == 0 || generateStatus == 0) {
            return 'Rejected';
        } else if (generateStatus == 1 && authoriseStatus == null) {
            return 'Unauthorized';
        } else {
            return 'Interim';
        }
    };

    const applyFilter = async () => {
        setLoading(true);
        try {
            let request = {
                "clientId": selectClient,
                "fromDate": formatDate(fromDate),
                "toDate": formatDate(toDate)
            }

            const response = await TaskService.getMyReceipts(request);
            if (response.status == 1) {
                setReceiptData(response.data);
                setFilter(false)
            } else {
                setReceiptData([]);
            }
            return response.data;
        } catch (error) {
            throw null;
        } finally {
            setLoading(false);
        }
    }

    const resetFilter = async () => {
        getAllReceipts();
        setFilter(false)
    }


    const debouncedSearch = useCallback(
        _.debounce(async (text) => {
            try {
                const response = await TaskService.searchReceipt({ searchKey: text });
                if (response.status == 1) {
                    setReceiptData(response.data);
                    console.log('Search response:', response.data);
                } else {
                    setReceiptData([]);
                }
                // You can update state here, e.g., setSearchResults(response.data);
                return
            } catch (error) {
                console.log('Search error:', error);
            }
        }, 1000),
        []
    );



    const handleSearch = (text) => {
        setQuery(text);
        if (text.trim() === '') {
            setTimeout(() => {
                getAllReceipts();
            }, 1200);
        } else {
            debouncedSearch(text);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getAllReceipts();
        wait(2000).then(() => setRefreshing(false));
    }, []);


    ///////////////////////////////
    const DENOMS = { note: [2000, 500, 200, 100, 50, 20, 10], coin: [20, 10, 5, 2, 1] };
    const [tab, setTab] = useState("note");
    const [counts, setCounts] = useState({});

    const update = (v, delta) =>
        setCounts(p => ({ ...p, [v]: Math.max((p[v] || 0) + delta, 0) }));

    const total = Object.entries(counts).reduce((s, [k, v]) => s + k * v, 0);
    ///////////////////////////

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <Image style={{ width: 14, height: 14, }} source={require('../../assets/leftarrow.png')} />
                        <Text style={{ fontFamily: 'Montserrat-SemiBold', fontSize: 18, color: '#2F81F5', marginLeft: 4, }}>Receipt</Text>
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
                            style={{ fontSize: 14, fontFamily: 'Montserrat-Medium', height: 50, backgroundColor: '#F6FAFF', borderRadius: 30, paddingLeft: 20, paddingRight: 50, }}
                            placeholder="Search"
                            placeholderTextColor="#0C0D36"
                            value={query} onChangeText={handleSearch}
                        />
                        <Image style={{ position: 'absolute', top: 16, right: 20, width: 20, height: 20, }} source={require('../../assets/search.png')} />
                    </View>
                    <TouchableOpacity onPress={() => setFilter(true)} style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: '#F6FAFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginLeft: 14, }}>
                        <Image style={{ width: 25, height: 25, }} source={require('../../assets/filter.png')} />
                        {/* <Text style={{ position: 'absolute', fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 13, color: '#fff', right: 0, top: 0, width: 15, height: 15, backgroundColor: '#F43232', borderRadius: 50, textAlign: 'center', }}>2</Text> */}
                    </TouchableOpacity>
                </View>

                <View>

                    {!receiptData || Object.keys(receiptData).length === 0 ? (
                        <Text style={{ textAlign: 'center', marginTop: 360, fontFamily: 'Montserrat-Medium', fontSize: 14, color: '#0C0D36' }}>
                            No data found!
                        </Text>
                    ) : (
                        Object.entries(receiptData).map(([dateKey, receipts]) => (
                            <View key={dateKey} style={{ marginBottom: 20 }}>
                                {/* Date Title */}
                                <Text style={styles.title}>{dateKey}</Text>

                                {receipts.length > 0 ? (
                                    receipts.map((item, index) => {
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
                                                        {/* PDF Icon */}
                                                        <Image style={{ width: 23, height: 30 }} source={require('../../assets/pdf.png')} />

                                                        <View style={{ paddingLeft: 12, flex: 1, paddingRight: 10 }}>
                                                            {/* Receipt Info */}
                                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <View>
                                                                    <Text
                                                                        numberOfLines={1}
                                                                        ellipsizeMode="tail"
                                                                        style={{
                                                                            width: 180,
                                                                            fontFamily: 'Montserrat-Medium',
                                                                            fontSize: 16,
                                                                            color: '#0C0D36',
                                                                            paddingBottom: 3,
                                                                        }}
                                                                    >
                                                                        {item.receiptId || `Receipt Copy ${index + 1}`}
                                                                    </Text>
                                                                    <Text style={{
                                                                        fontFamily: 'Montserrat-Medium',
                                                                        fontSize: 12,
                                                                        color: '#0C0D36',
                                                                    }}>
                                                                        Created at {formattedTime}
                                                                    </Text>
                                                                </View>
                                                                <View>
                                                                    {/* ✅ Status Badge */}
                                                                    {typeof item !== 'undefined' && (
                                                                        <View style={{
                                                                            alignSelf: 'flex-start',
                                                                            backgroundColor: getStatusColor(item.authoriseStatus, item.generateStatus),
                                                                            paddingVertical: 2,
                                                                            paddingHorizontal: 8,
                                                                            borderRadius: 12,
                                                                        }}>
                                                                            <Text style={{ fontSize: 11, color: '#fff', fontFamily: 'Montserrat-Medium' }}>
                                                                                {getStatusLabel(item.authoriseStatus, item.generateStatus)}
                                                                            </Text>
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </View>

                                                    {/* 3-Dot Menu */}
                                                    <TouchableWithoutFeedback onPress={() => setActiveMenuIndex(null)}>
                                                        <View style={{ position: 'relative', zIndex: 1 }}>
                                                            <Pressable
                                                                style={[styles.touchBtn, { paddingHorizontal: 4 }]}
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveMenuIndex(activeMenuIndex === `${dateKey}_${index}` ? null : `${dateKey}_${index}`);
                                                                }}
                                                            >
                                                                <Image style={{ width: 4, height: 23 }} source={require('../../assets/dotimg1.png')} />
                                                            </Pressable>

                                                            {activeMenuIndex === `${dateKey}_${index}` && (
                                                                <View style={styles.viewBx}>
                                                                    <TouchableOpacity
                                                                        style={styles.viewText}
                                                                        onPress={() => {
                                                                            navigation.navigate('Receiptview', { receiptId: item.id, status: item.generateStatus });
                                                                            setActiveMenuIndex(null);
                                                                        }}
                                                                    >
                                                                        <Text style={styles.downloadText}>View</Text>
                                                                    </TouchableOpacity>
                                                                    <TouchableOpacity
                                                                        style={[styles.viewText, item.generateStatus == null && { opacity: 0.5 }]}
                                                                        onPress={() => {
                                                                            if (item.generateStatus != null) {
                                                                                generateAndDownloadPDF(item);
                                                                            }
                                                                        }}
                                                                        disabled={item.generateStatus == null}
                                                                    >
                                                                        <Text style={styles.downloadText}>Download</Text>
                                                                    </TouchableOpacity>

                                                                    <TouchableOpacity
                                                                        style={[styles.viewText, item.generateStatus == null && { opacity: 0.5 }]}
                                                                        onPress={() => {
                                                                            if (item.generateStatus != null) {
                                                                                generateAndSharePDF(item);
                                                                            }
                                                                        }}
                                                                        disabled={item.generateStatus == null}
                                                                    >
                                                                        <Text style={styles.downloadText}>Share</Text>
                                                                    </TouchableOpacity>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </TouchableWithoutFeedback>
                                                </View>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text style={{ textAlign: 'center', marginVertical: 10 }}>No data found!</Text>
                                )}
                            </View>
                        ))
                    )}

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
                                    <View style={styles.row2}>
                                        <TouchableOpacity style={styles.inputBox} onPress={() => showDatePicker('from')}>
                                            <Text style={styles.inputText}>{fromDate ? formatDate(fromDate) : 'From Date'}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.inputBox} onPress={() => showDatePicker('to')}>
                                            <Text style={styles.inputText}>{toDate ? formatDate(toDate) : 'To Date'}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <DateTimePickerModal
                                        isVisible={isDatePickerVisible}
                                        mode="date"
                                        onConfirm={handleConfirm}
                                        onCancel={hideDatePicker}
                                    />
                                </View>

                                <View style={{ marginTop: 10 }}>
                                    <Text style={styles.label}>Client</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            style={styles.picker} // Apply text color here
                                            dropdownIconColor={lightTheme.inputText}
                                            selectedValue={selectClient}
                                            onValueChange={(itemValue, itemIndex) =>
                                                setselectClient(itemValue)
                                            }>
                                            <Picker.Item label="-Select client-" value="" enabled={false} />
                                            {
                                                clientsByLogistic.map((item) => (
                                                    <Picker.Item key={item.id} label={item.client_name} value={item.id} />
                                                ))
                                            }
                                        </Picker>
                                    </View>
                                </View>
                                <View style={{ borderTopWidth: 1, borderTopColor: '#ECEDF0', paddingVertical: 25, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', }}>
                                    <TouchableOpacity onPress={() => { resetFilter() }} style={{ width: '47%', backgroundColor: '#EFF6FF', borderRadius: 28, padding: 12, }}>
                                        <Text style={{ fontFamily: 'Montserrat-SemiBold', color: '#2F81F5', textAlign: 'center', }}>Reset</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { applyFilter() }} style={{ width: '47%', backgroundColor: '#2F81F5', borderRadius: 28, padding: 12, }}>
                                        <Text style={{ fontFamily: 'Montserrat-SemiBold', color: '#fff', textAlign: 'center', }}>Apply Filter</Text>
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
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                                <Text style={styles.modalText}>Create Receipt:</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Image style={{ width: 18, height: 18 }} source={require('../../assets/mdlclose.png')} />
                                </TouchableOpacity>
                            </View>
                            {/* <Text style={styles.label}>Client Name</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectClient} onValueChange={setselectClient}
                            >
                                <Picker.Item label="Select Client" value=""  />
                                {allClients.map((client) => (
                                    <Picker.Item key={client.id} label={client.client_name} value={client.id} dropdownIconColor={lightTheme.inputText}/>
                                ))}
                            </Picker>
                        </View> */}

                            <Text style={styles.label}>Client Name</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectClient}
                                    onValueChange={setselectClient}
                                    style={styles.picker} // Apply text color here
                                    dropdownIconColor={lightTheme.inputText} // Android only
                                >
                                    <Picker.Item label="Select Client" value="" />
                                    {allClients.map((client) => (
                                        <Picker.Item
                                            key={client.id}
                                            label={client.client_name}
                                            value={client.id}
                                        />
                                    ))}
                                </Picker>
                            </View>

                            <Text style={styles.label}>Payment Mode</Text>
                            <View style={styles.pickerContainer}>
                                <Picker selectedValue={selectPaymode} onValueChange={setselectPaymode}
                                    style={styles.picker} // Apply text color here
                                    dropdownIconColor={lightTheme.inputText} // Android only
                                >
                                    <Picker.Item label="Select Payment Mode" value="" />
                                    <Picker.Item label="Cash" value="Cash" />
                                    <Picker.Item label="UPI" value="UPI" />
                                    <Picker.Item label="Net Banking" value="Net Banking" />
                                </Picker>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom:8, }}>
                                <Text style={[styles.label, { lineHeight:16, marginBottom: 0 }]}>Amount</Text>
                                <TouchableOpacity onPress={() => setDenominationMdl(true)} style={{ backgroundColor: '#2F81F5', borderRadius: 5, padding: 0, width: 22, height: 22, alignItems: 'center', }}><Text style={{ color: '#fff', }}>+</Text></TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Amount"
                                placeholderTextColor="#0C0D36"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                            />


                            <View>
                                {/* Header Row */}
                                <View style={styles.denoBoxMain}>
                                    <Text style={[styles.denoLabel, { flex: 2 }]}>Denomination</Text>
                                    <Text style={[styles.denoLabel, { flex: 1 }, styles.centerColumn]}>Qty.</Text>
                                    <Text style={[styles.denoLabel, { flex: 1 }, styles.rightColumn]}>Amount</Text>
                                </View>

                                {/* Data Row */}
                                <View style={styles.denoBoxInn}>
                                    <Text style={[styles.denoValue, { flex: 2 }]}>
                                        <View style={styles.denoValue2}>
                                            <Image style={{ width: 30, height: 17, resizeMode: 'contain', }} source={require('../../assets/money.png')} />
                                            <Text>200</Text>
                                        </View>
                                    </Text>
                                    <Text style={[styles.denoValue, { flex: 1 }, styles.centerColumn]}>1</Text>
                                    <Text style={[styles.denoValue, { flex: 1 }, styles.rightColumn]}>₹200</Text>
                                </View>
                                <View style={styles.denoBoxInn}>
                                    <Text style={[styles.denoValue, { flex: 2 }]}>
                                        <View style={styles.denoValue2}>
                                            <Image style={{ width: 30, height: 17, resizeMode: 'contain', }} source={require('../../assets/money.png')} />
                                            <Text>200</Text>
                                        </View>
                                    </Text>
                                    <Text style={[styles.denoValue, { flex: 1 }, styles.centerColumn]}>1</Text>
                                    <Text style={[styles.denoValue, { flex: 1, }, styles.rightColumn]}>₹200</Text>
                                </View>
                                <View style={styles.sumTotal}>
                                    <Text style={styles.sumTotalLabel}>Sum Total</Text>
                                    <Text style={styles.sumTotaValue}>₹ 300.00</Text>
                                </View>
                            </View>
                            <View>
                                <Text style={styles.label}>Attachment</Text>
                                {/* onPress={selectImages} */}
                                <TouchableOpacity style={styles.uploadContainer} >
                                    <Image style={{ width: 30, height: 28, marginHorizontal: 'auto', }} source={require('../../assets/upload-icon.png')} />
                                    <Text style={styles.uploadTitle}>Upload</Text>
                                    <Text style={styles.uploadSubTitle}>Supports JPG, JPEG, and PNG</Text>
                                </TouchableOpacity>

                                {/* {images.length > 0 ? (
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
                            )} */}
                            </View>

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
                                    fontFamily: 'Montserrat-SemiBold',
                                    fontSize: 16,
                                    color: 'white',
                                    textAlign: 'center',
                                }}>Generate</Text>
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Denomination Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={denominationMdl}
                onRequestClose={() => setDenominationMdl(false)}>
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            paddingVertical: 15, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0',
                        }}>
                            <Text style={styles.modalText}>Enter Denominations:</Text>
                            <TouchableOpacity onPress={() => setDenominationMdl(false)}>
                                <Image style={{ width: 18, height: 18 }} source={require('../../assets/mdlclose.png')} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.toggleWrap}>
                            {["note", "coin"].map(t => (
                                <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.toggleBtn, tab === t && styles.toggleBtnActive]}>
                                    <Text style={tab === t && styles.toggleBtnActiveText}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <ScrollView>
                            {DENOMS[tab].map(val => (
                                <View key={val} style={styles.DenoRows}>
                                    <Text style={styles.amount}>₹{val}</Text>
                                    <View style={styles.counter}>
                                        <TouchableOpacity onPress={() => update(val, -1)} style={styles.counterBtn}><Text>-</Text></TouchableOpacity>
                                        <Text style={styles.countText}>{counts[val] || 0}</Text>
                                        <TouchableOpacity onPress={() => update(val, 1)} style={styles.counterBtn}><Text>+</Text></TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.totalBox}>
                            <Text style={styles.totalText}>Total Amount:</Text>
                            <Text style={styles.totalText}>₹{total}</Text>
                        </View>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#2F81F5',
                                borderRadius: 28,
                                paddingVertical: 16,
                                paddingHorizontal: 10,
                            }}>
                            <Text style={{
                                fontFamily: 'Montserrat-SemiBold',
                                fontSize: 16,
                                color: 'white',
                                textAlign: 'center',
                            }}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>


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
                    <Text style={{ color: '#FFFFFF', marginTop: 10 }}>Loading...</Text>
                </View>
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    // Deno Table Start
    denoBoxMain: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.25)',
        paddingBottom: 12,
        marginBottom: 15,
    },
    denoBoxInn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 14,
    },
    denoLabel: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 13,
        lineHeight: 16,
        color: '#0C0D36',
    },
    denoValue: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 13,
        lineHeight: 16,
        color: '#0C0D36',
    },
    denoValue2: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: '10',
        fontFamily: 'Montserrat-Medium',
        fontSize: 13,
        lineHeight: 16,
        color: '#0C0D36',
    },
    centerColumn: {
        textAlign: 'center',
        alignSelf: 'center',
    },
    rightColumn: {
        textAlign: 'right',
    },
    sumTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.25)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.25)',
        marginBottom: 15,
    },
    sumTotalLabel: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 13,
        lineHeight: 16,
        color: '#0C0D36',
    },
    sumTotaValue: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 13,
        lineHeight: 16,
        color: '#0C0D36',
    },

    // Upload Attachment
    uploadContainer: {
        borderWidth: 1,
        borderRadius: 12,
        borderStyle: 'dashed',
        backgroundColor: '#FAFAFA',
        borderColor: '#E5E5E5',
        marginBottom: 15,
        padding: 12,
        alignItems: 'center',
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

    // Toggle Tabs
    toggleWrap: { flexDirection: "row", gap: 4, marginBottom: 20, },
    toggleBtn: { paddingHorizontal: 20, paddingVertical: 8, borderWidth: 1, borderColor: '#0C0D36', borderRadius: 8, },
    toggleBtnActive: { backgroundColor: "#2F81F5", borderColor: '#2F81F5', },
    toggleBtnActiveText: { fontFamily: 'Montserrat-Medium', fontSize: 12, color: "#fff", },
    // Denomination Rows
    DenoRows: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15, },
    amount: { fontFamily: 'Montserrat-Medium', fontSize: 16, width: 80 },
    // Counter Controls
    counter: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ECEDF0", borderRadius: 5, padding: 5, },
    counterBtn: { width: 35, height: 35, backgroundColor: "#EFEFEF", borderRadius: 5, justifyContent: "center", alignItems: "center" },
    countText: { fontFamily: 'Montserrat-Medium', fontSize: 14, color: '#000', paddingHorizontal: 24, },
    // Footer Total
    totalBox: { padding: 15, marginBottom: 20, backgroundColor: "#FAFAFA", borderWidth: 1, borderColor: '#ECEDF0', borderRadius: 10, flexDirection: "row", justifyContent: "space-between" },
    totalText: { fontFamily: 'Montserrat-SemiBold', color: "#000", fontSize: 14, },

    // Deno Table End

    row2: {
        flexDirection: 'row',
        gap: 10,
    },
    inputBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
    },
    inputText: {
        fontSize: 14,
        color: '#111',
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
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 2,
        marginBottom: 8,
        fontFamily: 'Montserrat-Medium',
    },

    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#fff',
    },
    title: {
        fontFamily: 'Montserrat-Medium',
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
        zIndex: 99,
    },
    viewText: {
        paddingVertical: 8,
        paddingHorizontal: 15,
    },
    downloadText: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 14,
        color: '#0C0D36',
    },
    createBtn: {
        position: 'absolute',
        right: 15,
        bottom: 70,
        backgroundColor: '#EBF2FB',
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 21,
    },

    createText: {
        fontFamily: 'Montserrat-SemiBold',
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
        maxHeight: '80%',
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


})

export default Receipt
