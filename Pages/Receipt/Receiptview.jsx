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
  const imageBase64 = 'data:image/png;base64,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';
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
      padding:20px;
      background-color: #fff;
      color: #000;
    }
    .paymentBox{ text-align:center; background-color:#fff; border-radius:24px; box-shadow:0px 8px 24px 0px #AAAAAA4F; padding:20px; margin-bottom:30px; }
    .paymentBox img{ margin-bottom:15px; }
    .paymentBox .payText{ font-size:16px; line-height:1.2; font-weight:400; color:#474747; margin-bottom:8px; }
    .paymentBox .inrText{ font-size:24px; line-height:1.2; font-weight:600; color:#0C0D36; margin-bottom:0; }

    .receBox{ background-color:#fff; border-radius:24px; box-shadow: 0px 8px 24px 0px #AAAAAA4F; padding:10px 25px 25px; margin-bottom:30px; }
    .receSubBox{ text-align:center; background-color:#F5F6F7; border-radius:12px;  margin-bottom:18px; padding:12px; }
    .receSubBox .receTitle{ font-size:16px; line-height:1.2; font-weight:500; color:#0C0D36; margin-bottom:10px; }
    .receSubBox .receSubTitle{ font-size:14px; line-height:1.2; font-weight:500; color:#707070; }

    .flexDv{ display:flex; justify-content:space-between; margin-bottom:14px; }
    .flexDv .sndTitle{ font-size:13px; line-height:1.2; font-weight:400; color:#707070; }
    .flexDv .sndTitle{ font-size:13px; line-height:1.2; font-weight:500; color:#0C0D36; }

    .border-line{ width:90%; border-top:1px dashed #EDEDED; height:1px; display:block; margin:0 auto 14px; }
    .remarks{ display:flex; align-items:center; background-color:#fff; border-radius:24px; box-shadow: 0px 8px 24px 0px #AAAAAA4F; padding:16px 30px; }
    .remarks .remTitle{ width:88px; font-size:16px; line-height:1.2; font-weight:500; color:#0C0D36; margin:0; }
    .remarks .remSubTitle{ font-size:13px; line-height:1.2; font-weight:400; color:#707070; flex:1; margin:0; padding-top:4px; }



    

  </style>
</head>
<body>
  <div class="paymentBox">
    <img src="${imageBase64}" style="width: 56px; height: 56px;" />
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
    <div class="border-line">&nbsp;</div>
    <div class="flexDv">
      <div class="sndTitle">Amount</div>
      <div class="sndSubTitle">${receiptData?.amount ? `INR ${receiptData.amount}` : '0'} only</div>
    </div>
    <div class="flexDv">
      <div class="sndTitle">Amount In Words</div>
      <div class="sndSubTitle">${toWords(receiptData?.amount || 0).toLowerCase().replace(/\b\w/g, char => char.toUpperCase())} only</div>
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
      height: 841.89, // A4
      width: 595.28,
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
          {/* this line has issue********* */}
          {/* <Text style={{ fontSize: 'Montserrat_600SemiBold', color: '#0C0D36', paddingLeft: 5, }}>Receipt</Text> */}
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
                {receiptData?.amount ? `INR ${receiptData.amount}` : '0'}
              </Text>


            </View>
            <View style={styles.flexDv}>
              <Text style={styles.sndTitle}>Amount In Words</Text>
              <Text style={styles.sndSubTitle}>
                {`${toWords(receiptData?.amount || 0)} only`
                  .toLowerCase()
                  .replace(/\b\w/g, char => char.toUpperCase())}
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
