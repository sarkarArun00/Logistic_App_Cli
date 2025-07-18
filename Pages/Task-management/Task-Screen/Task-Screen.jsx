import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Dimensions,
  Platform,
  Image,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import TaskService from '../../Services/task_service';

import { useFocusEffect } from '@react-navigation/native';




const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;



const TaskScreen = () => {
  const navigation = useNavigation();
  const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          const response = await TaskService.getAllTaskCount();
          console.log('API Response:', response.data);
  
          // Handle actual data structure
          if (response && response.data) {
            setData(response.data);
            
          } else if (Array.isArray(response)) {
            setData(response); // handle if response is already array
          } else {
            console.warn('Unexpected response shape:', response);
            setData([]);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setData([]);
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, [])
  );
  
  

  const tasks = [
    {
      id: 1,
      title: 'Assigned',
      screen: 'Assigned',
      count: String(data.assignedCount || 0).padStart(2, '0'),
      icon: require('../../../assets/task-icn01.png'),
      gradient: ['#0B75FF', '#569FFF'],
      shadowColor: '#0B75FF'
    },
    {
      id: 2,
      title: 'Accepted',
      screen: 'Accepted',
      count: String(data.acceptedCount || 0).padStart(2, '0'),
      icon: require('../../../assets/task-icn02.png'),
      gradient: ['#40B8A5', '#1CC5AA'],
      shadowColor: '#40B8A5'
    },
    {
      id: 3,
      title: 'In Progress',
      screen: 'In Progress',
      count: String(data.inProgress || 0).padStart(2, '0'),
      icon: require('../../../assets/task-icn03.png'),
      gradient: ['#C8B73C', '#B99400'],
      shadowColor: '#C8B73C'
    },
    {
      id: 4,
      title: 'Collected',
      screen: 'Collected',
      count: String(data.collected || 0).padStart(2, '0'),
      icon: require('../../../assets/task-icn04.png'),
      gradient: ['#3CD1E2', '#1C8996'],
      shadowColor: '#3CD1E2'
    },
    {
      id: 5,
      title: 'Completed',
      screen: 'Completed',
      count: String(data.completed || 0).padStart(2, '0'),
      icon: require('../../../assets/task-icn05.png'),
      gradient: ['#C77DFF', '#8581FF'],
      shadowColor: '#C77DFF'
    },
    {
      id: 6,
      title: 'Rejected',
      screen: 'RejectedTask',
      count: String(data.rejected || 0).padStart(2, '0'),
      icon: require('../../../assets/task-icn06.png'),
      gradient: ['#999999', '#B2B2B2'],
      shadowColor: '#999999'
    },
  ];

  const getCardHeight = (index) => {
    const row = Math.floor(index / 2);
    const isLeftCard = index % 2 === 0;

    if (row % 2 === 0) {
      return isLeftCard ? 170 : 170; // Even rows: left shorter, right taller
    } else {
      return isLeftCard ? 170 : 170; // Odd rows: left taller, right shorter
    }
  };

  const getCardMarginTop = (index) => {
    const row = Math.floor(index / 2);
    const isLeftCard = index % 2 === 0;

    if (row % 2 === 0) {
      // Even rows: left card offset down, right card at top
      return isLeftCard ? 0 : 0;
    } else {
      // Odd rows: left card at top, right card offset down
      return isLeftCard ? 0 : 0;
    }
  };

  const renderTaskCard = ({ item, index }) => {
    const cardHeight = getCardHeight(index);
    const marginTop = getCardMarginTop(index);

    // Dynamic shadow style based on the card's gradient color
    const dynamicShadowStyle = Platform.OS === 'ios'
      ? {
        shadowColor: item.shadowColor,
        shadowOffset: {
          width: 1,
          height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      }
      : {
        elevation: 8,
        shadowColor: item.shadowColor,
      };

    return (
      <View style={[styles.cardWrapper, { marginTop }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate(item.screen)}>
          <LinearGradient
            colors={item.gradient}
            style={[
              styles.taskCard,
              { height: cardHeight },
              dynamicShadowStyle
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.cardContent}>
              <View style={{flexDirection:'row', alignItems:'center', gap:10, marginBottom:15, }}>
                <Image source={item.icon} style={styles.icon} />
                <Text style={styles.title}>{item.count}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.arrowBackground}>
                <Icon name="arrow-right" size={20} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };



  return (
    
    <SafeAreaView style={[
      styles.container, styles.paddingBottom
    ]}
    >
      <StatusBar style={{ paddingTop: STATUS_BAR_HEIGHT, backgroundColor: '#5D5FEF', flex: 1 }}  barStyle="dark-content" />


      <FlatList
        data={Array.isArray(tasks) ? tasks : []}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        renderItem={renderTaskCard}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        ListHeaderComponent={() => (
          <View style={[styles.headerContainer, { marginHorizontal: -20 }, { paddingTop: STATUS_BAR_HEIGHT, marginBottom:20, backgroundColor: '#5D5FEF', borderTopLeftRadius:0, borderBottomLeftRadius:20, flex: 1 }]}>
            <Image
              style={{
                width: '100%',
                height: 220,
                resizeMode: 'cover',
              }}
              source={require('../../../assets/task-shape.png')}
            />
            <View style={{ position: 'absolute', left: 16, bottom: 76 }}>
              <Text style={styles.header}>My Tasks</Text>
              <Text style={styles.headerSubtitle}>View and manage your task</Text>
            </View>
          </View>

        )}
      />


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  paddingBottom: {
    paddingBottom: 45
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 0,
  },
  headerContainer: {
    paddingHorizontal: 0,
    paddingTop: Platform.OS === 'ios' ? 20 : 45,
    paddingBottom: 30,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  header: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#fff',
    marginBottom: 2,
    letterSpacing: 0.05,
  },
  headerSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#fff',
  },

  listContainer: {
    paddingTop:0,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    // paddingTop:20,
  },
  taskCard: {
    borderRadius: 20,
    overflow: 'hidden',
    // Base shadow that will be overridden by dynamic shadows
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    position: 'relative',
    paddingVertical: 52,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 17,
    color: '#fff',
    letterSpacing: -0.5,
    paddingTop:0,
  },
  arrowBackground: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 18,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-50deg' }],
  },
});

export default TaskScreen;