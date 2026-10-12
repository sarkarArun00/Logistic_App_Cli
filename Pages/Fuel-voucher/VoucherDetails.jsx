import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator, Modal, previewVisible, previewImage } from 'react-native';
import TaskService from '../Services/task_service';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium, Montserrat_400Regular } from '@expo-google-fonts/montserrat';
import { toWords } from 'number-to-words';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { BASE_API_URL } from '../Services/API'

const VoucherDetails = ({ navigation, route }) => {

  const { fuelVoucherId, type } = route.params;
  const [attachmentUri, setattachmentUri] = useState([])
  const [receiptData, setReceiptData] = React.useState(null);
  const [loading, setLoading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true)
        const response = await TaskService.getFeulVoucherById({ fuelVoucherId: fuelVoucherId });
        if (response.status == 1) {
          setReceiptData(response.data);
          setLoading(false)
        } else {
          setReceiptData(null);
          setLoading(false)
        }
      } catch (error) {
        console.error("Error fetching receipt:", error);
        setLoading(false)
      }
    };

    fetchReceipt();
  }, [fuelVoucherId]);


  useEffect(() => {
    const fetchAttachmentById = async () => {
      try {
        const response = await TaskService.getAllAttachmentsById({ fuelVoucherId });
        console.log('attachments ==========', response)
        // return
        if (response.status === 1 && response.data?.length > 0) {
          setattachmentUri(response.data);
        } else {
          setattachmentUri(null);
        }
      } catch (error) {
        console.error('Error fetching attachment:', error);
      }
    };

    if (fuelVoucherId) {
      fetchAttachmentById();
    }
  }, [fuelVoucherId]);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require('../../assets/locate-back.png')} style={styles.backIcon} />
          <Text style={styles.backText}>Fuel Voucher</Text>
        </TouchableOpacity>

        {
          type == "success" ? (
            <View style={styles.paymentBox}>
              <Image source={require('../../assets/success-icon.png')} style={styles.successIcon} />
              <Text style={styles.successText}>Payment Success!</Text>
              <Text style={styles.amountText}>{formatToINR(receiptData?.amount)}</Text>
            </View>

          ) : (
            <View style={styles.paymentBox}>
              <Image source={require('../../assets/Cross.png')} style={styles.successIcon} />
              <Text style={styles.successText}>Payment Failed!</Text>
              <Text style={styles.failedAmountText}>{formatToINR(receiptData?.amount)}</Text>
            </View>
          )
        }

        <View style={styles.receiptBox}>
          <Text style={styles.receiptTitle}>Fuel Voucher Receipt</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Voucher Number:</Text>
            <Text style={styles.value}>{receiptData?.fuelVoucherNo}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Sender Name</Text>
            <Text style={styles.value}>{receiptData?.employee?.employee_name || '_________'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Receiver Name</Text>
            <Text style={styles.value}>_________</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Date</Text>
            <Text style={styles.value}>{formatDateTime(receiptData?.createdAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{receiptData?.paymentMode}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{formatToINR(receiptData?.amount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount In Words</Text>
            {/* <ScrollView horizontal showsHorizontalScrollIndicator={false}> */}
              <Text style={[styles.value, { flexWrap: 'nowrap' }, {width: 190}]}>
                {`${toWords(receiptData?.amount || 0)} only`
                  .toLowerCase()
                  .replace(/\b\w/g, char => char.toUpperCase())}
              </Text>
            {/* </ScrollView> */}
          </View>

        </View>

        <View style={styles.remarksBox}>
          <Text style={styles.remarksLabel}>Remarks:</Text>
          <Text style={styles.remarksValue}>{receiptData?.remarks}</Text>
        </View>

        <View style={styles.attachmentBox}>
          <Text style={styles.attachmentLabel}>Attachment:</Text>

          {attachmentUri && attachmentUri.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {attachmentUri.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setPreviewImage(BASE_API_URL + item.attachment);
                    setPreviewVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: BASE_API_URL + item.attachment }}
                    style={styles.attachmentImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noAttachmentText}>No attachment available</Text>
          )}



        </View>

        <View style={styles.buttonSection}>
          {/* <TouchableOpacity style={styles.pdfButton}>
            <Image source={require('../../assets/downloadIcon.png')} style={styles.downloadIcon} />
            <Text style={styles.pdfText}>Get PDF Receipt</Text>
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
            <Text style={styles.doneText}>Back</Text>
          </TouchableOpacity>
        </View>


        <Modal
          visible={previewVisible}
          transparent={true}
          onRequestClose={() => setPreviewVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setPreviewVisible(false)}>
              <Text style={{ color: '#fff', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
            <Image
              source={{ uri: previewImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
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
};

export default VoucherDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    paddingHorizontal: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  backIcon: {
    width: 23,
    height: 15,
  },
  backText: {
    fontFamily:'Montserrat-SemiBold',
    paddingLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#0C0D36',
  },
  paymentBox: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 24,
    borderRadius: 10,
    marginBottom: 16,
  },
  successIcon: {
    width: 56,
    height: 56,
  },
  successText: {
    fontFamily:'Montserrat-Medium',
    marginTop: 10,
    fontSize: 18,
    fontWeight: '600',
    color: '#0C0D36',
  },
  amountText: {
    fontFamily:'Montserrat-Medium',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27AE60',
    marginTop: 6,
  },
  failedAmountText: {
    fontFamily:'Montserrat-Medium',
    fontSize: 24,
    fontWeight: 'bold',
    color: 'red',
    marginTop: 6,
  },
  receiptBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  receiptTitle: {
    fontFamily:'Montserrat-Medium',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    color: '#0C0D36',
  },
  receiptNumber: {
    fontFamily:'Montserrat-Medium',
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontFamily:'Montserrat-Medium',
    flex:1,
    fontSize: 14,
    color: '#888',
  },
  value: {
    fontFamily:'Montserrat-Medium',
    fontSize: 14,
    fontWeight: '600',
    color: '#0C0D36',
    textAlign:'right',
  },
  separator: {
    borderTopWidth: 1,
    borderTopColor: '#EDEDED',
    borderStyle: 'dashed',
    marginVertical: 16,
  },
  remarksBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  remarksLabel: {
    fontFamily:'Montserrat-Medium',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  remarksValue: {
    fontFamily:'Montserrat-Medium',
    fontSize: 14,
    color: '#444',
  },
  buttonSection: {
    alignItems: 'center',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  downloadIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  pdfText: {
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    fontFamily:'Montserrat-Medium',
    backgroundColor: '#0C0D36',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  doneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  attachmentBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  attachmentLabel: {
    fontFamily:'Montserrat-Medium',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#0C0D36',
  },
  attachmentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  noAttachmentText: {
    fontFamily:'Montserrat-Medium',
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },

  attachmentImage: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
});

