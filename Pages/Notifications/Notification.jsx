import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { useFonts, Montserrat_600SemiBold, Montserrat_500Medium } from '@expo-google-fonts/montserrat';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TaskService from '../Services/task_service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import dayjs from 'dayjs';
import {useNotification} from '../../Context/NotificationContext';
import {useGlobalAlert} from '../../Context/GlobalAlertContext';
import {Modal, ScrollView} from 'react-native';

function Notification({navigation}) {
  const [selectedTab, setSelectedTab] = useState('General');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState([]);
  const [approved, setApproved] = useState([]);
  const [refreshApprovals, setRefreshApprovals] = useState(0);
  const viewedIdsRef = useRef(new Set());
  const timeoutRef = useRef(null);
  const {setNotificationCount} = useNotification();
  const {showAlertModal, hideAlert} = useGlobalAlert();

  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedApprovalData, setSelectedApprovalData] = useState(null);
  const [approvalAction, setApprovalAction] = useState('');

  const [approvalModalLoading, setApprovalModalLoading] = useState(false);

  const [approvalDetails, setApprovalDetails] = useState(null);
  const [notificationId, setNotificationId] = useState(null);

  useEffect(() => {
    // const fetchData = async () => {
    //     try {
    //         setLoading(true)
    //         const response = await TaskService.getMyNotifications();
    //         console.log('Response seenNotificationIds:', response.data);

    //         if (response.status == 1) {
    //             const allNotifications = response.data.seen;
    //             setNotifications(allNotifications);
    //             setNotificationCount(response.data.unseen.length);
    //             setLoading(false)
    //         }  else {
    //             setLoading(false)
    //         }
    //     } catch (error) {
    //         console.log('Error fetching notifications:', error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const fetchEmployeeApprovals = async () => {
      try {
        const response = await TaskService.getEmployeeApprovals({
          module: 'Logistic',
        });

        if (response.status == 1) {
          setApprovals(response.data?.pending ?? []);
          setApproved(response.data?.approved ?? []);
        } else {
          console.log('Response: No data found');
        }
      } catch (err) {
        console.log('Error in getEmployeeApprovals:', err);
      }
    };

    // fetchData();
    // fetchNotifications();
    fetchEmployeeApprovals();
  }, [refreshApprovals]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          setLoading(true);

          const response = await TaskService.getMyNotifications();
          //   if (response.status === 1 && response.data.unseen.length > 0) {
          //     const allNotifications = response.data.unseen;
          if (response.status === 1 && response.data.length > 0) {
            const allNotifications = response.data;
            const allIds = allNotifications.map(item => item.id);
            console.log('logistic approval data: ', allNotifications);
            await markNotificationsAsSeen(allIds);
          } else {
            setLoading(false);
            setNotificationCount(0);
          }
        } catch (error) {
          console.log('Error fetching notifications:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, []),
  );

  const fetchNotifications = async () => {
    const response = await TaskService.getMyNotifications();
    if (response.status === 1) {
      // setNotifications(response.data?.seen);
      // setNotificationCount(response.data?.unseen?.length);
      setNotifications(response.data);
      setNotificationCount(
        response.data?.filter(item => item.isRead == false).length,
      );
    } else {
      setNotificationCount(0);
    }
  };

  const markNotificationsAsSeen = async allIds => {
    // notifIds: allIds
    const res = await TaskService.updateNotificationStatus({});
    if (res.status === 1) {
      await fetchNotifications(); // Refresh list
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const init = async () => {
        setLoading(true);
        await fetchNotifications();
        setLoading(false);
      };
      init();
    }, []),
  );

  const deleteGeneNotif = async id => {
    const response = await TaskService.deleteNotification({notifId: id});
    console.log('deleting....', response);
    if (response.status == 1) {
      fetchNotifications();
    } else {
      showAlertModal(response.data, true);
    }
  };

  // const onViewableItemsChanged = useRef(({ viewableItems }) => {
  //     const visibleIds = viewableItems.map(v => v.item.id);

  //     // Add newly visible IDs to the Set
  //     visibleIds.forEach(id => viewedIdsRef.current.add(id));

  //     // Clear previous timeout if any
  //     if (timeoutRef.current) {
  //         clearTimeout(timeoutRef.current);
  //     }

  //     // Set a delay before console logging
  //     timeoutRef.current = setTimeout(() => {
  //         console.log('IDs to be marked as seen:', [...viewedIdsRef.current]);
  //     }, 2000); // adjust delay (in ms) as needed

  // }).current;

  // const viewabilityConfig = {
  //     itemVisiblePercentThreshold: 50,
  // };

  const handleApprove = async (id, userId) => {
    try {
      const response = await TaskService.approveApproval({
        notifId: notificationId,
      });
      if (response.status == 1) {
        console.log('Approval successful:', response);

        setApprovalModalVisible(false);

        setRefreshApprovals(prev => prev + 1);

        Alert.alert('Approval successful');
      } else {
        console.log('Approval failed:', response);
        Alert.alert(response.message);
      }
    } catch (error) {
      console.error('Error approving employee:', error);
    }
  };

  const handleDecline = async notificationId => {
    try {
      const response = await TaskService.declineApproval({
        notifId: notificationId,
      });
      if (response.status == 1) {
        setApprovalModalVisible(false);

        setRefreshApprovals(prev => prev + 1);
      } else {
        console.log('Decline failed:', response);
      }
    } catch (error) {
      console.error('Error declining employee:', error);
    }
  };

  const openApprovalModal = async (item, actionType) => {
    try {
      setApprovalAction(actionType);
      setApprovalModalVisible(true);
      setApprovalModalLoading(true);
      setApprovalDetails(null);
      setNotificationId(item.id);
      const referenceId = String(item?.referenceId ?? '').trim();

      const isCashReceipt = referenceId.toUpperCase().startsWith('CR/');

      let response;

      if (isCashReceipt) {
        // Example: CR/260915/0004
        response = await TaskService.getReqDenomination({
          receiptId: referenceId,
        });
      } else {
        // Fund transfer or other Logistic approval
        response = await TaskService.getLogisticDenomination({
          empId: item?.srcEmp ?? null,
        });
      }

      console.log(
        isCashReceipt ? 'Cash receipt denomination:' : 'Logistic denomination:',
        response,
      );

      if (response?.status === 1) {
        setApprovalDetails(response?.data ?? null);
      } else {
        setApprovalDetails(null);
      }

      console.log('resss check', response?.data);
    } catch (error) {
      console.log('Error fetching denomination:', error);

      setApprovalDetails(null);
    } finally {
      setApprovalModalLoading(false);
    }
  };

  const approvalList = [
    ...approvals.map(item => ({
      ...item,
      sectionType: 'pending',
    })),

    ...(approved?.length > 0
      ? [
          {
            sectionHeader: true,
            title: 'Approved Notifications',
            id: 'approved-header',
          },
          ...approved.map(item => ({
            ...item,
            sectionType: 'approved',
          })),
        ]
      : []),
  ];

  const NotificationItem = ({item}) => (
    <View
      style={{
        flexDirection: 'row',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
      }}>
      <Ionicons
        name={item.status == '1' ? 'mail-outline' : 'mail-outline'}
        size={32}
        color={item.status == '1' ? '#64748B' : '#1E40AF'}
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        <View style={{flex: 1}}>
          <Text style={styles.name}>
            {item.name} <Text style={styles.message}>{item.message}</Text>
          </Text>
          <Text style={styles.time}>
            {dayjs(item.createdAt).format('MMMM D, YYYY h:mm A')}
          </Text>
        </View>
        <View style={{width: 25}}>
          <TouchableOpacity
            onPress={() => {
              deleteGeneNotif(item.id);
            }}>
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{flexDirection: 'row', alignItems: 'center'}}>
          <Image
            style={{width: 14, height: 14}}
            source={require('../../assets/leftarrow.png')}
          />
          <Text
            style={{
              fontFamily: 'Montserrat-SemiBold',
              fontSize: 18,
              color: '#2F81F5',
              marginLeft: 4,
            }}>
            Notifications
          </Text>
        </TouchableOpacity>
        {/* <View style={{ position: 'relative', width: 50, height: 50, borderRadius: '50%', backgroundColor: '#F6FAFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }}>
                    <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
                        <Image style={{ width: 18, height: 18, }} source={require('../../assets/noti.png')} />
                    </TouchableOpacity>
                    <NotificationCount></NotificationCount>
                    <Text style={{ position: 'absolute', fontFamily: 'Montserrat_400Regular', fontSize: 10, lineHeight: 13, color: '#fff', right: 0, top: 0, width: 15, height: 15, backgroundColor: '#F43232', borderRadius: 50, textAlign: 'center', }}>{notifications?.length}</Text>
                </View> */}
      </View>

      <View style={styles.tabs}>
        <View style={styles.borderLine} />
        {['General', 'Approval'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}>
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.activeTabText,
              ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Separate FlatLists based on tab */}
      {selectedTab === 'General' ? (
        <FlatList
          data={notifications}
          renderItem={({item}) => <NotificationItem item={item} />}
          keyExtractor={item => item.id.toString()}
          // onViewableItemsChanged={onViewableItemsChanged}
          // viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}

          // Show "No Notification Found!" when the list is empty
          ListEmptyComponent={
            <View style={{padding: 20, alignItems: 'center'}}>
              <Text
                style={{
                  fontSize: 16,
                  color: '#64748B',
                  fontFamily: 'Montserrat_500Medium',
                }}>
                No notifications found
              </Text>
            </View>
          }
          // Center empty message when no data
          contentContainerStyle={
            notifications.length === 0
              ? {flexGrow: 1, justifyContent: 'center', alignItems: 'center'}
              : null
          }
        />
      ) : (
        <FlatList
          data={selectedTab === 'General' ? notifications : approvalList}
          renderItem={({item}) => {
            // Section Header
            if (item.sectionHeader) {
              return (
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor: '#F8FAFC',
                  }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Montserrat-SemiBold',
                      color: '#64748B',
                    }}>
                    {item.title}
                  </Text>
                </View>
              );
            }

            return selectedTab === 'General' ? (
              <NotificationItem item={item} />
            ) : (
              <View style={styles.notificationContainer}>
                <View style={styles.textContainer}>
                  <Text style={styles.name}>
                    {item?.name || 'Notification'}{' '}
                    <Text style={styles.message}>{item.message}</Text>
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <View>
                    <Text style={styles.time}>
                      {dayjs(item.createdAt).format('DD-MM-YYYY hh:mm A')}
                    </Text>
                  </View>

                  {item.sectionType === 'pending' ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}>
                      {/* <TouchableOpacity
                                                        style={[styles.button, { backgroundColor: '#10B981' }]}
                                                        onPress={() => handleApprove(item?.id, item.srcEmp)}
                                                    >
                                                        <Text style={styles.buttonText}>Approve</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={[styles.button, { backgroundColor: '#EF4444' }]}
                                                        onPress={() => handleDecline(item?.id)}
                                                    >
                                                        <Text style={styles.buttonText}>Decline</Text>
                                                    </TouchableOpacity> */}

                      <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() => openApprovalModal(item, 'approve')}
                        activeOpacity={0.8}>
                        <Ionicons
                          name="eye-outline"
                          size={16}
                          color="#2563EB"
                        />

                        <Text style={styles.viewButtonText}>View</Text>
                      </TouchableOpacity>

                      {/* <TouchableOpacity
                                                        style={[styles.button, { backgroundColor: '#EF4444' }]}
                                                        onPress={() => openApprovalModal(item, 'decline')}
                                                    >
                                                        <Text style={styles.buttonText}>Decline</Text>
                                                    </TouchableOpacity> */}
                    </View>
                  ) : (
                    <View
                      style={{
                        backgroundColor: '#DCFCE7',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 20,
                      }}>
                      <Text
                        style={{
                          color: '#166534',
                          fontSize: 12,
                          fontFamily: 'Montserrat-SemiBold',
                        }}>
                        Approved
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          keyExtractor={item => item?.id.toString()}
          // onViewableItemsChanged={onViewableItemsChanged}
          // viewabilityConfig={viewabilityConfig}
          ListEmptyComponent={() =>
            selectedTab === 'Approval' ? (
              <Text
                style={{textAlign: 'center', marginTop: 350, color: '#999'}}>
                No approval notifications.
              </Text>
            ) : null
          }
          contentContainerStyle={styles.flatListContent}
        />
      )}

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
          }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={{color: '#FFFFFF', marginTop: 10}}>Proccessing...</Text>
        </View>
      )}

      {approvalModalLoading ? (
        <View style={{paddingVertical: 50}}>
          <ActivityIndicator size="large" color="#2F81F5" />

          <Text
            style={{
              textAlign: 'center',
              marginTop: 12,
              color: '#64748B',
              fontFamily: 'Montserrat-Medium',
            }}>
            Fetching payment details...
          </Text>
        </View>
      ) : (
        <>
          <Modal
            visible={approvalModalVisible}
            transparent={true}
            animationType="slide"
            statusBarTranslucent={true}
            onRequestClose={() => setApprovalModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                {/* Fixed Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {approvalAction === 'approve'
                      ? 'Approve Request'
                      : 'Decline Request'}
                  </Text>

                  <TouchableOpacity
                    onPress={() => setApprovalModalVisible(false)}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Ionicons name="close" size={24} color="#0C0D36" />
                  </TouchableOpacity>
                </View>

                {/* Scrollable Content */}
                <ScrollView
                  style={styles.modalScrollView}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled">
                  {/* Denomination Details */}
                  {(() => {
                    const denominations = Array.isArray(approvalDetails)
                      ? approvalDetails
                      : approvalDetails?.denominations ?? [];

                    return denominations.length > 0 ? (
                      <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>
                          Denomination Details
                        </Text>

                        {denominations.map((item, index) => (
                          <View key={item.id ?? index} style={styles.rowCard}>
                            <View style={styles.denominationInfo}>
                              <Image
                                source={
                                  item.denomination_type === 'Coin'
                                    ? require('../../assets/coin.png')
                                    : require('../../assets/note.png')
                                }
                                style={styles.denominationImage}
                              />

                              <View style={{flexShrink: 1}}>
                                <Text style={styles.rowLabel}>
                                  ₹{item.denomination_name}
                                </Text>

                                <Text style={styles.rowSubLabel}>
                                  Qty: {item.denomination_count}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.amountText}>
                              ₹{item.amount}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null;
                  })()}

                  {/* Cheque Details */}
                  {approvalDetails?.cheques?.length > 0 && (
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionTitle}>Cheque Details</Text>

                      {approvalDetails.cheques.map((cheque, index) => (
                        <View
                          key={cheque.id ?? index}
                          style={styles.chequeCard}>
                          <View style={styles.chequeRow}>
                            <Text style={styles.chequeLabel}>Cheque No</Text>
                            <Text style={styles.chequeValue}>
                              {cheque.cheque_no}
                            </Text>
                          </View>

                          <View style={styles.chequeRow}>
                            <Text style={styles.chequeLabel}>Bank</Text>
                            <Text style={styles.chequeValue}>
                              {cheque.bank_name}
                            </Text>
                          </View>

                          <View style={styles.chequeRow}>
                            <Text style={styles.chequeLabel}>Amount</Text>
                            <Text style={styles.chequeValue}>
                              ₹{cheque.amount}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Empty State */}
                  {(() => {
                    const denominations = Array.isArray(approvalDetails)
                      ? approvalDetails
                      : approvalDetails?.denominations ?? [];

                    const hasDenominations = denominations.length > 0;
                    const hasCheques =
                      (approvalDetails?.cheques?.length ?? 0) > 0;

                    return !hasDenominations && !hasCheques ? (
                      <View style={styles.emptyBox}>
                        <Ionicons
                          name="document-text-outline"
                          size={55}
                          color="#CBD5E1"
                        />

                        <Text style={styles.emptyText}>
                          No payment details found
                        </Text>
                      </View>
                    ) : null;
                  })()}
                </ScrollView>
                {/* Fixed Footer - Always Visible */}
                <View style={styles.footerRow}>
                  <TouchableOpacity
                    style={[styles.confirmButton, {backgroundColor: '#EFF6FF'}]}
                    activeOpacity={0.8}
                    onPress={() => {
                      handleDecline(approvalDetails?.id);
                      setApprovalModalVisible(false);
                    }}>
                    <View style={styles.buttonInner}>
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color="#2F81F5"
                      />
                      <Text style={styles.confirmButtonText}>Decline</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.confirmButton, {backgroundColor: '#2F81F5'}]}
                    activeOpacity={0.8}
                    onPress={() => {
                      handleApprove(
                        approvalDetails?.id,
                        approvalDetails?.srcEmp,
                      );
                      setApprovalModalVisible(false);
                    }}>
                    <View style={styles.buttonInner}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text style={styles.confirmApproveButtonText}>
                        Approve
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  notificationContainer: {
    // flexDirection: 'row',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  icon: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  name: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#0C0D36',
  },

  message: {
    fontFamily: 'Montserrat-Medium',
    color: '#4B5563',
  },
  time: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#A5ACB8',
    marginTop: 5,
  },
  tabs: {
    position: 'relative',
    flexDirection: 'row',
    gap: 32,
    marginTop: 15,
  },
  borderLine: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E8EE',
  },

  tabText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    paddingBottom: 15,
    color: '#000',
  },
  activeTabText: {
    color: '#3082F8',
    borderBottomWidth: 2,
    borderBottomColor: '#3082F8',
  },

  itemContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  text: {
    fontFamily: 'Montserrat-SemiBold',

    fontSize: 16,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 5,
  },
  button: {
    height: 40,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Montserrat-Medium',
    color: '#fff',
    fontWeight: '600',
  },

  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 15,
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    color: '#0F172A',
    marginBottom: 12,
  },

  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },

  rowLabel: {
    fontSize: 15,
    fontFamily: 'Montserrat-SemiBold',
    color: '#0C0D36',
  },

  rowSubLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  chequeCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  chequeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 18,
    fontWeight: '500',
    color: '#0C0D36',
  },
  chequeLabel: {
    fontFamily: 'Montserrat-Medium',
    color: '#64748B',
    fontSize: 13,
  },

  chequeValue: {
    color: '#0C0D36',
    fontFamily: 'Montserrat-Medium',
  },

  cancelButton: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },

  cancelButtonText: {
    color: '#0F172A',
    fontFamily: 'Montserrat-SemiBold',
  },

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  emptyText: {
    fontFamily: 'Montserrat-Medium',
    marginTop: 10,
    color: '#94A3B8',
    fontSize: 14,
  },

  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 6,
  },

  viewButtonText: {
    color: '#2563EB',
    fontSize: 13,
    fontFamily: 'Montserrat-SemiBold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  modalContainer: {
    width: '100%',
    maxHeight: '50%',
    minHeight: 580,
    flexShrink: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'column',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },

  modalScrollView: {
    flex: 1,
    minHeight: 0,
  },

  modalScrollContent: {
    padding: 12,
    paddingBottom: 16,
    flexGrow: 1,
  },

  denominationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  denominationImage: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
    marginRight: 10,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },

  confirmButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  confirmButtonText: {
    color: '#2F81F5',
    fontSize: 12,
    fontFamily: 'Montserrat-SemiBold',
  },
  confirmApproveButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Montserrat-SemiBold',
  },
  modalContainer: {
    width: '92%',
    maxHeight: '50%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
  },

  modalScrollView: {
    flexShrink: 1,
  },

  modalScrollContent: {
    padding: 12,
    flexGrow: 0,
  },

  sectionCard: {
    width: '100%',
    alignSelf: 'stretch',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  rowCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },

  denominationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },

  denominationImage: {
    width: 36,
    height: 36,
    marginRight: 10,
    resizeMode: 'contain',
  },

  denominationTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C0D36',
    fontFamily: 'Montserrat-SemiBold',
  },

  rowSubLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },

  amountText: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 8,
    flexShrink: 0,
  },

  footerRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

export default Notification;
