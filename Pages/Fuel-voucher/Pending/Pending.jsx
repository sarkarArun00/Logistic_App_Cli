import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, TouchableWithoutFeedback, TextInput, Modal, Animated, FlatList, Alert } from 'react-native';
// import { useFonts, Montserrat_600SemiBold, Montserrat_400Regular, Montserrat_500Medium } from '@expo-google-fonts/montserrat'
import { Picker } from '@react-native-picker/picker';
// import * as ImagePicker from 'expo-image-picker';

function Pending({ navigation }) {
    const [filter, setFilter] = useState(false);
    const [selectStatus, setselectStatus] = useState();
    const [showMenu, setShowMenu] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectPaymode, setselectPaymode] = useState();
    const [selectCar, setselectCar] = useState();
    const bgColor = useRef(new Animated.Value(0)).current;
    const [selectViewMdl, setSelectViewMdl] = useState(false);
    const [images, setImages] = useState([]);

    // Camera Open
    const requestPermission = async (type) => {
        if (type === 'camera') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            return status === 'granted';
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            return status === 'granted';
        }
    };

    const openCamera = async () => {
        const hasPermission = await requestPermission('camera');
        if (!hasPermission) {
            Alert.alert('Permission Required', 'Camera access is needed to take pictures.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const newImage = { uri: result.assets[0].uri };
            setImages((prev) => [...prev, newImage]);
        }
    };

    const openGallery = async () => {
        const hasPermission = await requestPermission('gallery');
        if (!hasPermission) {
            Alert.alert('Permission Required', 'Gallery access is needed to select images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled) {
            const newImages = result.assets.map((asset) => ({ uri: asset.uri }));
            setImages((prev) => [...prev, ...newImages]);
        }
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

    // Fonts 
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

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', }}>
                        <Image style={{ width: 14, height: 14, }} source={require('../../../assets/leftarrow.png')} />
                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 18, color: '#2F81F5', marginLeft: 4, }}>Fuel Voucher Request</Text>
                    </TouchableOpacity>
                    <View style={{ position: 'relative', width: 50, height: 50, borderRadius: '50%', backgroundColor: '#F6FAFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                        <TouchableOpacity>
                            <Image style={{ width: 18, height: 18, }} source={require('../../../assets/noti.png')} />
                        </TouchableOpacity>
                        <Text style={{ position: 'absolute', fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 13, color: '#fff', right: 0, top: 0, width: 15, height: 15, backgroundColor: '#F43232', borderRadius: 50, textAlign: 'center', }}>2</Text>
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
                        <TouchableOpacity onPress={() => navigation.navigate('MainApp', { screen: 'Pending' })} style={[styles.tcbtn, styles.active]}>
                            <Text style={[styles.acttext, styles.testactive]}>Pending</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Approved')} style={[styles.tcbtn,]}>
                            <Text style={[styles.acttext,]}>Approved</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Processed')} style={[styles.tcbtn,]}>
                            <Text style={[styles.acttext,]}>Processed</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Rejected')} style={[styles.tcbtn,]}>
                            <Text style={[styles.acttext,]}>Rejected</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <View>
                    <Text style={styles.title}>Feb 22, 2025</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, }}>
                        <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', }}>
                            <View>
                                <Image style={{ width: 28, height: 20, }} source={require('../../../assets/voucher.png')} />
                            </View>
                            <View style={{ paddingLeft: 6, }}>
                                <Text style={{ fontFamily: 'Montserrat_500Medium', fontSize: 16, color: '#0C0D36', paddingBottom: 2, }}>#589AGRD</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                                    <View style={styles.bgborder}><Animated.View style={[styles.animatebg, { backgroundColor }]} /></View>
                                    <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 11, color: '#0C0D36', }}>Payment Pending</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                                <View style={{ paddingRight: 15, }}>
                                    <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: '#FFBB00', }}>3000.00</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.touchBtn, { paddingHorizontal: 4 }]}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(!showMenu);
                                    }}>
                                    <Image style={{ width: 4, height: 23 }} source={require('../../../assets/dotimg1.png')} />
                                </TouchableOpacity>

                                {showMenu && (
                                    <View style={styles.viewBx}>
                                        <TouchableOpacity style={styles.viewText} onPress={() => {
                                            setSelectViewMdl(true);
                                            setShowMenu(false);
                                        }}>
                                            <Text style={styles.downloadText}>View</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.viewText} onPress={() => setShowMenu(false)}>
                                            <Text style={styles.downloadText}>Download</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.viewText} onPress={() => setShowMenu(false)}>
                                            <Text style={styles.downloadText}>Share</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
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

                {/* View Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={selectViewMdl}
                    onRequestClose={() => setSelectViewMdl(false)}>
                    <View style={styles.modalBackground}>
                        <View style={[styles.modalContainer, styles.viewModalContainer]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                                    <Text style={styles.modalText}>Fuel Voucher View</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 10, }}>
                                        <View style={styles.bgborder}><Animated.View style={[styles.animatebg, { backgroundColor }]} /></View>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 13, color: '#FFBB00', }}>Pending</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => setSelectViewMdl(false)}>
                                    <Image style={{ width: 18, height: 18 }} source={require('../../../assets/mdlclose.png')} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView>
                                <View style={{ padding: 15 }}>
                                    <View>
                                        <Text style={styles.label}>Vehicle</Text>
                                        <Text style={styles.selLabel}>Car</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.label}>Model Name</Text>
                                        <Text style={styles.selLabel}>Car</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.label}>Manufacturer</Text>
                                        <Text style={styles.selLabel}>Car</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.label}>Voucher ID</Text>
                                        <Text style={styles.selLabel}>#65546AKJH</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.label}>Employee Name</Text>
                                        <Text style={styles.selLabel}>Akash Kundu</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.label}>Amount</Text>
                                        <Text style={styles.selLabel}>1205</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.label}>Payment Mode</Text>
                                        <Text style={styles.selLabel}>Cash</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.label}>Attachment</Text>
                                        <View style={styles.attachmentImg}>
                                            <Image style={{ width: 50, height: 50, borderRadius: 5, }} source={require('../../../assets/user.jpg')} />
                                            <Image style={{ width: 50, height: 50, borderRadius: 5, }} source={require('../../../assets/user.jpg')} />
                                        </View>
                                    </View>
                                    <View>
                                        <Text style={styles.label}>Remarks</Text>
                                        <Text style={styles.selLabel}>Nice</Text>
                                    </View>
                                </View>
                            </ScrollView>
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

            {/* Request Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalBackground}>
                    <View style={[styles.modalContainer, styles.scrlablModalContainer]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ECEDF0', }}>
                            <Text style={styles.modalText}>Fuel Voucher Request Details</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Image style={{ width: 18, height: 18 }} source={require('../../../assets/mdlclose.png')} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <View style={{ padding: 15, }}>
                                <View>
                                    <Text style={styles.label}>Select Vehicle</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectCar}
                                            onValueChange={(itemValue, itemIndex) =>
                                                setselectCar(itemValue)
                                            }>
                                            <Picker.Item label="Car" value="Car" />
                                            <Picker.Item label="Bike" value="Bike" />
                                        </Picker>
                                    </View>
                                </View>
                                <View>
                                    <Text style={styles.label}>Payment Mode</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectPaymode}
                                            onValueChange={(itemValue, itemIndex) =>
                                                setselectPaymode(itemValue)
                                            }>
                                            <Picker.Item label="Cash" value="Cash" />
                                            <Picker.Item label="UPI" value="UPI" />
                                            <Picker.Item label="Net Banking" value="Net Banking" />
                                        </Picker>
                                    </View>
                                </View>
                                <View>
                                    <Text style={styles.label}>Enter Amount</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Amount"
                                        placeholderTextColor="#0C0D36"
                                    />
                                </View>

                                <View>
                                    <Text style={styles.label}>Attachment</Text>

                                    <TouchableOpacity style={styles.uploadContainer} onPress={selectImages}>
                                        <Image style={{ width: 30, height: 28, marginHorizontal: 'auto', }} source={require('../../../assets/upload-icon.png')} />
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
                                                    <Image source={{ uri: item.uri }} style={{ width:60, height:60, borderRadius:5, marginRight:10, }} />
                                                    <TouchableOpacity
                                                        onPress={() => handleDeleteImage(index)}
                                                        style={{
                                                            position:'absolute',
                                                            top:-5,
                                                            right:5,
                                                            backgroundColor:'red',
                                                            borderRadius:12,
                                                            width:22,
                                                            height:22,
                                                            justifyContent:'center',
                                                            alignItems:'center'
                                                        }}
                                                    >
                                                        <Text style={{ color:'white', fontSize:12, lineHeight:14, }}>✕</Text>
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
                                        placeholder="Placeholder"
                                        placeholderTextColor="#0C0D36"
                                    />
                                </View>
                                <View>
                                    <TouchableOpacity style={{ backgroundColor: '#2F81F5', borderRadius: 28, paddingVertical: 16, paddingHorizontal: 10, }}>
                                        <Text style={{ fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: 'white', textAlign: 'center', }}>Send</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
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
    acttext: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 12,
        color: '#0C0D36',
    },
    testactive: {
        color: '#fff',
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
