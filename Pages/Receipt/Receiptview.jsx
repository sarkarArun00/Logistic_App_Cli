import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, } from 'react-native';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium, Montserrat_400Regular } from '@expo-google-fonts/montserrat';

function Receiptview({navigation}) {
    // const [fontsLoaded] = useFonts({
    //     Montserrat_600SemiBold,
    //     Montserrat_500Medium,
    //     Montserrat_400Regular,
    // });

    // if (!fontsLoaded) {
    //     return null;
    // }

  return (
    <SafeAreaView style={styles.container}>
        <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} >
                <Image source={require('../../assets/locate-back.png')} style={{width:23, height:15,}} />
                <Text style={{fontSize:'Montserrat_600SemiBold', fontSize:18, color:'#0C0D36', paddingLeft:5,}}>Receipt</Text>
            </TouchableOpacity>

            <View style={styles.paymentBox}>
                <Image style={{width:56, height:56, margin:'auto', }} source={require('../../assets/success-icon.png')} />
                <Text style={styles.payText}>Payment Success!</Text>
                <Text style={styles.inrText}>IDR 1,000,000</Text>
            </View>

            <View style={styles.receBox}>
                <View style={styles.receSubBox}>
                    <Text style={styles.receTitle}>Payment Receipt</Text>
                    <Text style={styles.receSubTitle}>Receipt Number: 14363461538136</Text>
                </View>
                <View>
                    <View style={styles.flexDv}>
                        <Text style={styles.sndTitle}>Sender Name</Text>
                        <Text style={styles.sndSubTitle}>Antonio Roberto {'<FGFGFG>'}</Text>
                    </View>
                    <View style={styles.flexDv}>
                        <Text style={styles.sndTitle}>Receiver Name</Text>
                        <Text style={styles.sndSubTitle}>Antonio Roberto {'<DVFSDGEGT>'}</Text>
                    </View>
                    <View style={styles.flexDv}>
                        <Text style={styles.sndTitle}>Payment Date</Text>
                        <Text style={styles.sndSubTitle}>03 Feb,2024, 13:22:16</Text>
                    </View>
                    <View style={styles.flexDv}>
                        <Text style={styles.sndTitle}>Payment Method</Text>
                        <Text style={styles.sndSubTitle}>Bank Transfer</Text>
                    </View>
                </View>
                <View style={{ width:'80%', borderTopWidth:1, borderTopColor:'#EDEDED', borderStyle: 'dashed', margin:'auto' }}></View>
                <View style={{marginTop:14,}}>
                    <View style={styles.flexDv}>
                        <Text style={styles.sndTitle}>Amount</Text>
                        <Text style={styles.sndSubTitle}>1,000.00</Text>
                    </View>
                    <View style={styles.flexDv}>
                        <Text style={styles.sndTitle}>Amount In Words</Text>
                        <Text style={styles.sndSubTitle}>One thousand</Text>
                    </View>
                </View>
            </View>

            <View style={styles.remarks}>
                <Text style={styles.remTitle}>Remarks:</Text>
                <Text style={styles.remSubTitle}>Amount In Words</Text>
            </View>

            <View>
                <TouchableOpacity style={styles.pdfBtn}>
                    <Image style={{width:24, height:24,}} source={require('../../assets/downloadIcon.png')} />
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
    backButton:{
        flexDirection:'row',
        alignItems:'center',
        marginBottom:30,
    },
    paymentBox:{
        backgroundColor:'#fff',
        borderRadius:24,
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        // Android shadow
        elevation: 4,
        marginHorizontal:5,
        padding:20,
        marginBottom:30,
    },
    payText:{
        fontFamily:'Montserrat_400Regular',
        fontSize:16,
        color:'#474747',
        textAlign:'center',
        paddingTop:16,
        paddingBottom:10,
    },
    inrText:{
        fontFamily:'Montserrat_600SemiBold',
        fontSize:24,
        color:'#0C0D36',
        textAlign:'center',
    },
    receBox:{
        backgroundColor:'#fff',
        borderRadius:24,
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        // Android shadow
        elevation: 4,
        marginHorizontal:5,
        paddingHorizontal:15,
        paddingTop:10,
        paddingBottom:10,
        marginBottom:30,
    },
    receSubBox:{
        backgroundColor:'#F5F6F7',
        borderRadius:12,
        marginBottom:18,
        padding:10,
    },
    receTitle:{
        fontFamily:'Montserrat_500Medium',
        fontSize:16,
        color:'#0C0D36',
        textAlign:'center',
        paddingBottom:7,
    },
    receSubTitle:{
        fontFamily:'Montserrat_500Medium',
        fontSize:13,
        color:'#707070',
        textAlign:'center',
    },
    flexDv:{
        flexDirection:'row',
        justifyContent:'space-between',
        marginBottom:14,
    },
    sndTitle:{
        fontFamily:'Montserrat_600SemiBold',
        fontSize:12,
        color:'#707070',
        flex:1,
    },
    sndSubTitle:{
        width:170,
        fontFamily:'Montserrat_600SemiBold',
        fontSize:12,
        color:'#0C0D36',
        textAlign:'right',
    },
    remarks:{
        backgroundColor:'#fff',
        borderRadius:24,
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        // Android shadow
        elevation: 4,
        marginHorizontal:5,
        paddingHorizontal:20,
        paddingVertical:16,
        marginBottom:30,
        flexDirection:'row',
        alignItems:'center',
    },
    remTitle:{
        fontFamily:'Montserrat_500Medium',
        fontSize:16,
        color:'#0C0D36',
        width:88,
    },
    remSubTitle:{
        fontFamily:'Montserrat_400Regular',
        fontSize:13,
        color:'#707070',
        flex:1,
    },
    pdfBtn:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
        borderWidth:1,
        borderColor:'#0C0D36',
        borderRadius:28,
        padding:15,
        marginBottom:18,
    },
    pdfText:{
        fontFamily:'Montserrat_500Medium',
        fontSize:14,
        color:'#0C0D36',
        marginLeft:7,
    },
    doneBtn:{
        backgroundColor:'#0C0D36',
        borderRadius:28,
        padding:15,
    },
    doneText:{
        fontFamily:'Montserrat_500Medium',
        fontSize:14,
        color:'#fff',
        textAlign:'center',
    },








})
export default Receiptview
