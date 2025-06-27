import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Dimensions,
  Platform
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

const {width} = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; 

const TaskScreen = () => {
  const navigation = useNavigation();

  const tasks = [
  {
    id: 1,
    title: 'Assigned',
    screen: 'Assigned',
    icon: '📌',
    gradient: ['#D16BA5', '#86A8E7'], 
    shadowColor:'#D16BA5'
  },
  {
    id: 2,
    title: 'Accepted',
    screen: 'Accepted',
    icon: '👍',
    gradient: ['#43C6AC', '#191654'],
    shadowColor:'#43C6AC'
  },
  {
    id: 3,
    title: 'In Progress',
    screen: 'In Progress',
    icon: '🛠️',
    gradient: ['#4776E6', '#8E54E9'],
    shadowColor:'#4776E6'
  },
  {
    id: 4,
    title: 'Collected',
    screen: 'Collected',
    icon: '📦',
    gradient: ['#1D976C', '#93F9B9'], 
    shadowColor:'#1D976C'
  },
  {
    id: 5,
    title: 'Completed',
    screen: 'Completed',
    icon: '✅',
    gradient: ['#1A2980', '#26D0CE'],
    shadowColor:'#1A2980'
  },
  {
    id: 6,
    title: 'Rejected Task',
    screen: 'Rejected Task',
    icon: '⛔',
    gradient: ['#003973', '#E5E5BE'],
    shadowColor:'#003973'
  },
];

  const getCardHeight = (index) => {
    const row = Math.floor(index / 2);
    const isLeftCard = index % 2 === 0;
    
    if (row % 2 === 0) {
      return isLeftCard ? 200 : 200; // Even rows: left shorter, right taller
    } else {
      return isLeftCard ? 200 : 200; // Odd rows: left taller, right shorter
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

  const renderTaskCard = ({item, index}) => {
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
      <View style={[styles.cardWrapper, {marginTop}]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate(item.screen)}>
          <LinearGradient 
            colors={item.gradient} 
            style={[
              styles.taskCard, 
              {height: cardHeight},
              dynamicShadowStyle
            ]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <View style={styles.iconBackground}>
                  <Text style={styles.icon}>{item.icon}</Text>
                </View>
              </View>
              
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
              </View>
              
              <View style={styles.arrowContainer}>
                <View style={styles.arrowBackground}>
                  <Icon name="arrow-right" size={20} color="#fff" />
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.header}>My Tasks</Text>
        <Text style={styles.headerSubtitle}>View and manage your task</Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        renderItem={renderTaskCard}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 45,
    paddingBottom: 30,
    backgroundColor: '#F8FAFC',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardWrapper: {
    width: CARD_WIDTH,
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
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignItems: 'flex-start',
  },
  iconBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    padding: 10,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
    textAlign: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
    letterSpacing: 0.5,
    lineHeight: 22,
  },
  arrowContainer: {
    alignItems: 'flex-end',
  },
  arrowBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TaskScreen;