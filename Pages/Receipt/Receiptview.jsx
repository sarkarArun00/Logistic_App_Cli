import React, { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ScrollView, PermissionsAndroid, Platform, ToastAndroid } from 'react-native';
import TaskService from '../Services/task_service';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium, Montserrat_400Regular } from '@expo-google-fonts/montserrat';
import { toWords } from 'number-to-words';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import notifee from '@notifee/react-native';
import FileViewer from 'react-native-file-viewer';



function Receiptview({ navigation, route }) {
    // const [fontsLoaded] = useFonts({
    //     Montserrat_600SemiBold,
    //     Montserrat_500Medium,
    //     Montserrat_400Regular,
    // });

    // if (!fontsLoaded) {
    //     return null;
    // }

    const { receiptId } = route.params;
    const [receiptData, setReceiptData] = React.useState(null);

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                console.log("Receipt ID:", receiptId);
                const response = await TaskService.getReceiptById({ receiptId });
                if (response.status == 1) {
                    console.log("Receipt Data:", response);
                    setReceiptData(response.data);
                } else {
                    setReceiptData(null);
                }
            } catch (error) {
                console.error("Error fetching receipt:", error);
            }
        };

        fetchReceipt();
    }, [receiptId]);


    const requestWritePermission = async () => {
        if (Platform.OS !== 'android') return true;

        const sdkInt = Platform.constants?.Release || parseInt(Platform.Version, 10);

        if (sdkInt >= 30) {
            // MANAGE_EXTERNAL_STORAGE for Android 11+
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.MANAGE_EXTERNAL_STORAGE,
                {
                    title: 'Manage External Storage Permission',
                    message: 'App needs access to manage all files to save receipts in Downloads.',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
            // WRITE_EXTERNAL_STORAGE for Android 10 and below
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: 'Storage Permission Required',
                    message: 'App needs access to your storage to download the PDF.',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
    };

    // Show Android Notification
    const showNotification = async () => {
        await notifee.requestPermission();

        const channelId = await notifee.createChannel({
            id: 'download',
            name: 'Download Notifications',
            importance: AndroidImportance.HIGH,
        });

        await notifee.displayNotification({
            title: '✅ PDF Saved',
            body: 'Receipt successfully saved in Downloads folder.',
            android: {
                channelId,
                pressAction: { id: 'default' },
            },
        });
    };

    // Generate and Save PDF to Download folder
    const generatePDFAndSave = async (receiptData) => {
        const fileName = `receipt_${receiptData.receiptId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
        const htmlContent = `
    <h1 style="text-align: center;">Payment Receipt</h1>
    <p><strong>Receipt No:</strong> ${receiptData.receiptId}</p>
    <p><strong>Sender:</strong> ${receiptData.generatedBy}</p>
    <p><strong>Receiver:</strong> ${receiptData.receivedBy}</p>
    <p><strong>Date:</strong> ${receiptData.createdAt}</p>
    <p><strong>Payment Method:</strong> ${receiptData.paymentMode}</p>
    <p><strong>Amount:</strong> INR ${receiptData.amount}</p>
    <p><strong>Amount In Words:</strong> ${toWords(receiptData.amount)}</p>
    <p><strong>Remarks:</strong> ${receiptData.remarks}</p>
  `;

        try {
            const pdf = await RNHTMLtoPDF.convert({
                html: htmlContent,
                fileName,
                directory: 'Documents', // internal
            });

            const permissionGranted = await requestWritePermission();
            if (!permissionGranted) {
                Alert.alert('Permission denied', 'Storage permission is required to save the PDF.');
                return;
            }

            const destinationPath = `${RNFS.DownloadDirectoryPath}/${fileName}.pdf`;
            await RNFS.copyFile(pdf.filePath, destinationPath);

            ToastAndroid.show('✅ PDF saved to Downloads folder.', ToastAndroid.LONG);
            console.log('PDF saved to:', destinationPath);

            await showNotification();
            await FileViewer.open(destinationPath);
        } catch (err) {
            console.error('Error generating PDF:', err);
            Alert.alert('Error', 'Failed to generate or save PDF.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}>

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} >
                    <Image source={require('../../assets/locate-back.png')} style={{ width: 23, height: 15, }} />
                    <Text style={{ fontSize: 'Montserrat_600SemiBold', fontSize: 18, color: '#0C0D36', paddingLeft: 5, }}>Receipt</Text>
                </TouchableOpacity>

                <View style={styles.paymentBox}>
                    <Image style={{ width: 56, height: 56, margin: 'auto', }} source={require('../../assets/success-icon.png')} />
                    <Text style={styles.payText}>Payment Success!</Text>
                    <Text style={styles.inrText}>{`INR ${receiptData?.amount || 0}`}</Text>
                </View>

                <View style={styles.receBox}>
                    <View style={styles.receSubBox}>
                        <Text style={styles.receTitle}>Payment Receipt</Text>
                        <Text style={styles.receSubTitle}>Receipt Number: {receiptData?.receiptId || ''}</Text>
                    </View>
                    <View>
                        <View style={styles.flexDv}>
                            <Text style={styles.sndTitle}>Sender Name</Text>
                            <Text style={styles.sndSubTitle}>{receiptData?.generatedBy || ''}</Text>
                        </View>
                        <View style={styles.flexDv}>
                            <Text style={styles.sndTitle}>Receiver Name</Text>
                            <Text style={styles.sndSubTitle}></Text>
                        </View>
                        <View style={styles.flexDv}>
                            <Text style={styles.sndTitle}>Payment Date</Text>
                            <Text style={styles.sndSubTitle}>{receiptData?.createdAt || ''}</Text>
                        </View>
                        <View style={styles.flexDv}>
                            <Text style={styles.sndTitle}>Payment Method</Text>
                            <Text style={styles.sndSubTitle}>{receiptData?.paymentMode || ''}</Text>
                        </View>
                    </View>
                    <View style={{ width: '80%', borderTopWidth: 1, borderTopColor: '#EDEDED', borderStyle: 'dashed', margin: 'auto' }}></View>
                    <View style={{ marginTop: 14, }}>
                        <View style={styles.flexDv}>
                            <Text style={styles.sndTitle}>Amount</Text>
                            <Text style={styles.sndSubTitle}>{`INR ${receiptData?.amount || 0}`}</Text>
                        </View>
                        <View style={styles.flexDv}>
                            <Text style={styles.sndTitle}>Amount In Words</Text>
                            <Text style={styles.sndSubTitle}>{toWords(receiptData?.amount || 0)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.remarks}>
                    <Text style={styles.remTitle}>Remarks:</Text>
                    <Text style={styles.remSubTitle}>{receiptData?.remarks || ''}</Text>
                </View>

                <View>
                    <TouchableOpacity style={styles.pdfBtn} onPress={() => generatePDFAndSave(receiptData)}>
                        <Image style={{ width: 24, height: 24 }} source={require('../../assets/downloadIcon.png')} />
                        <Text style={styles.pdfText}>Get PDF Receipt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.doneBtn}>
                        <Text style={styles.doneText}>Done</Text>
                    </TouchableOpacity>
                </View>

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
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    paymentBox: {
        backgroundColor: '#fff',
        borderRadius: 24,
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        // Android shadow
        elevation: 4,
        marginHorizontal: 5,
        padding: 20,
        marginBottom: 30,
    },
    payText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 16,
        color: '#474747',
        textAlign: 'center',
        paddingTop: 16,
        paddingBottom: 10,
    },
    inrText: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 24,
        color: '#0C0D36',
        textAlign: 'center',
    },
    receBox: {
        backgroundColor: '#fff',
        borderRadius: 24,
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        // Android shadow
        elevation: 4,
        marginHorizontal: 5,
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 10,
        marginBottom: 30,
    },
    receSubBox: {
        backgroundColor: '#F5F6F7',
        borderRadius: 12,
        marginBottom: 18,
        padding: 10,
    },
    receTitle: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 16,
        color: '#0C0D36',
        textAlign: 'center',
        paddingBottom: 7,
    },
    receSubTitle: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 13,
        color: '#707070',
        textAlign: 'center',
    },
    flexDv: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    sndTitle: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 12,
        color: '#707070',
        flex: 1,
    },
    sndSubTitle: {
        width: 170,
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 12,
        color: '#0C0D36',
        textAlign: 'right',
    },
    remarks: {
        backgroundColor: '#fff',
        borderRadius: 24,
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        // Android shadow
        elevation: 4,
        marginHorizontal: 5,
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginBottom: 30,
        flexDirection: 'row',
        alignItems: 'center',
    },
    remTitle: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 16,
        color: '#0C0D36',
        width: 88,
    },
    remSubTitle: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 13,
        color: '#707070',
        flex: 1,
    },
    pdfBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#0C0D36',
        borderRadius: 28,
        padding: 15,
        marginBottom: 18,
    },
    pdfText: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 14,
        color: '#0C0D36',
        marginLeft: 7,
    },
    doneBtn: {
        backgroundColor: '#0C0D36',
        borderRadius: 28,
        padding: 15,
    },
    doneText: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
    },








})
export default Receiptview
