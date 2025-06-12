import React, { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ScrollView, PermissionsAndroid, Platform, ToastAndroid } from 'react-native';
import TaskService from '../Services/task_service';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium, Montserrat_400Regular } from '@expo-google-fonts/montserrat';
import { toWords } from 'number-to-words';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';



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



        const generateAndSharePDF = async () => {
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      padding: 15px;
      background-color: #fff;
      color: #000;
    }
    
    .paymentBox {
  background-color: #fff;
  border-radius: 24px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.3);
  padding: 20px;
  margin: 0 5px 30px 5px;
}

.payText {
  font-family: 'Montserrat', sans-serif;
  font-weight: 400;
  font-size: 16px;
  color: #474747;
  text-align: center;
  padding-top: 16px;
  padding-bottom: 10px;
}

.inrText {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 24px;
  color: #0C0D36;
  text-align: center;
}

.receBox {
  background-color: #fff;
  border-radius: 24px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.3);
  padding: 10px 15px;
  margin: 0 5px 30px 5px;
}

.receSubBox {
  background-color: #F5F6F7;
  border-radius: 12px;
  margin-bottom: 18px;
  padding: 10px;
}

.receTitle {
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  font-size: 16px;
  color: #0C0D36;
  text-align: center;
  padding-bottom: 7px;
}

.receSubTitle {
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: #707070;
  text-align: center;
}

.flexDv {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
}

.sndTitle {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #707070;
  flex: 1;
}

.sndSubTitle {
  width: 170px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #0C0D36;
  text-align: right;
}

.remarks {
  background-color: #fff;
  border-radius: 24px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.3);
  padding: 16px 20px;
  margin: 0 5px 30px 5px;
  display: flex;
  align-items: center;
}

.remTitle {
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  font-size: 16px;
  color: #0C0D36;
  width: 88px;
}

.remSubTitle {
  font-family: 'Montserrat', sans-serif;
  font-weight: 400;
  font-size: 13px;
  color: #707070;
  flex: 1;
}

.pdfBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #0C0D36;
  border-radius: 28px;
  padding: 15px;
  margin-bottom: 18px;
}

.pdfText {
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #0C0D36;
  margin-left: 7px;
}

.doneBtn {
  background-color: #0C0D36;
  border-radius: 28px;
  padding: 15px;
}

.doneText {
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #fff;
  text-align: center;
}

  </style>
</head>
<body>
  <div class="paymentBox">
    <img src="file://${Image.resolveAssetSource(require('../../assets/success-icon.png')).uri}" style="width: 56px; height: 56px;" />
    <div class="payText">Payment Success!</div>
    <div class="inrText">INR ${receiptData?.amount || 0}</div>
  </div>

  <div class="receBox">
    <div class="receSubBox">
      <div class="receTitle">Payment Receipt</div>
      <div class="receSubTitle">Receipt Number: ${receiptData?.receiptId || ''}</div>
    </div>

    <div class="flexDv">
      <div class="sndTitle">Sender Name</div>
      <div class="sndSubTitle">${receiptData?.generatedBy || ''}</div>
    </div>
    <div class="flexDv">
      <div class="sndTitle">Receiver Name</div>
      <div class="sndSubTitle">${receiptData?.receiverName || ''}</div>
    </div>
    <div class="flexDv">
      <div class="sndTitle">Payment Date</div>
      <div class="sndSubTitle">${receiptData?.createdAt || ''}</div>
    </div>
    <div class="flexDv">
      <div class="sndTitle">Payment Method</div>
      <div class="sndSubTitle">${receiptData?.paymentMode || ''}</div>
    </div>

    <hr style="border-top: 1px dashed #EDEDED; margin: 14px 0;" />

    <div class="flexDv">
      <div class="sndTitle">Amount</div>
      <div class="sndSubTitle">${toWords(receiptData?.amount || 0).toLowerCase().replace(/\b\w/g, char => char.toUpperCase())} only</div>
    </div>
    <div class="flexDv">
      <div class="sndTitle">Amount In Words</div>
      <div class="sndSubTitle">${toWords(receiptData?.amount || 0).toUpperCase()} ONLY</div>
    </div>
  </div>

  <div class="remarks">
    <div class="remTitle">Remarks:</div>
    <div class="remSubTitle">${receiptData?.remarks || ''}</div>
  </div>
</body>
</html>
`;

const options = {
  html: htmlContent,
  fileName: 'receipt',
  directory: 'Documents',
};


        try {
            const file = await RNHTMLtoPDF.convert(options);
            await Share.open({ url: `file://${file.filePath}` });
        } catch (err) {
            console.log('PDF Generation/Sharing Error:', err);
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
                            <Text style={styles.sndSubTitle}>
                                {`${toWords(receiptData?.amount || 0)} only`
                                    .toLowerCase()
                                    .replace(/\b\w/g, char => char.toUpperCase())}
                            </Text>


                        </View>
                        <View style={styles.flexDv}>
                            <Text style={styles.sndTitle}>Amount In Words</Text>
                            <Text style={styles.sndSubTitle}>
                                {`${toWords(receiptData?.amount || 0)} only`.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.remarks}>
                    <Text style={styles.remTitle}>Remarks:</Text>
                    <Text style={styles.remSubTitle}>{receiptData?.remarks || ''}</Text>
                </View>

                <View>
                    <TouchableOpacity style={styles.pdfBtn} onPress={generateAndSharePDF}>
                        <Image style={{ width: 24, height: 24 }} source={require('../../assets/downloadIcon.png')} />
                        <Text style={styles.pdfText}>Get PDF Receipt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
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
