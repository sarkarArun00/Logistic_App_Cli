import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import ImmersiveMode from 'react-native-immersive';
import { ImageBackground } from 'react-native';

const { width, height } = Dimensions.get('window');
const { height: screenHeight } = Dimensions.get('window');

// const { width, height } = Dimensions.get('window');

const Welcome = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef(null);

  const onScroll = (e) => {
    const slide = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slide);
  };

  const handleNext = () => {
    if (currentSlide < 2) {
      scrollViewRef.current?.scrollTo({ x: (currentSlide + 1) * width, animated: true });
    } else {
      navigation.replace('Login');
    }
  };

  useEffect(() => {
    ImmersiveMode.setImmersive(true); // Hide status & nav bar
  
    return () => {
      ImmersiveMode.setImmersive(false); // Show again when leaving screen
    };
  }, []);
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
        >
          
          {/* Slide 1 */}
          <View style={styles.slide}>
            <Image source={require('../../assets/screen1.jpg')} style={styles.images} />

            <View style={styles.textBlock}>
            <ImageBackground
              source={require('../../assets/curvbg1.png')}
              style={styles.imageBackground}
              resizeMode="stretch">
                <View style={styles.addImageBack}>
                  <Image source={require('../../assets/roundlogo.png')} style={styles.roundlogo} />
                  <Text style={styles.weltitle}>Welcome to</Text>
                  <Image source={require('../../assets/nirnayantext.png')} style={styles.nirnayanText} />
                  <Text style={styles.desc}>An advanced healthcare logistics solution—offering real-time tracking,  scheduling, and secure sample delivery</Text>
                  <TouchableOpacity style={styles.btn} onPress={handleNext}>
                    <Text style={styles.btnText}>Next</Text>
                  </TouchableOpacity>
                </View>
            </ImageBackground>
            </View>
          </View>

          {/* Slide 2 */}
          <View style={styles.slide}>
            <Image source={require('../../assets/screen2.jpg')} style={styles.images} />
            <View style={styles.textBlock}>
              <ImageBackground
                source={require('../../assets/curvbg1.png')}
                style={styles.imageBackground}
                resizeMode="stretch">
                  <View style={styles.addImageBack}>
                    <Text style={styles.weltitle}>Real-time</Text>
                    <Text style={styles.subtitle}>Secure Delivery</Text>
                    <Text style={styles.desc}>Experience hassle-free, on-time sample delivery while maintaining all healthcare quality protocols.</Text>
                    <TouchableOpacity style={styles.btn} onPress={handleNext}>
                      <Text style={styles.btnText}>Next</Text>
                    </TouchableOpacity>
                  </View>
              </ImageBackground>
            </View>
          </View>

          {/* Slide 3 */}
          <View style={styles.slide}>
            <Image source={require('../../assets/screen3.jpg')} style={styles.images} />
            <View style={styles.textBlock}>
              <ImageBackground
                source={require('../../assets/curvbg1.png')}
                style={styles.imageBackground}
                resizeMode="stretch">
                <View style={styles.addImageBack}>
                  <Text style={styles.weltitle}>Redefined by</Text>
                  <Text style={styles.subtitle}>Trust & Accuracy</Text>
                  <Text style={styles.desc}>Step into a new era of healthcare logistics with uncompromising accuracy and reliable testing, with the fastest report delivery</Text>
                  <TouchableOpacity style={styles.btn} onPress={handleNext}>
                    <Text style={styles.btnText}>Get Started</Text>
                  </TouchableOpacity>
                </View>
              </ImageBackground>
            </View>
          </View>

        </ScrollView>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[styles.dot, currentSlide === index && styles.activeDot]}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  imageBackground: {
    width:'100%',
    height:'100%',
  },
  addImageBack:{
    // paddingTop:170,
    paddingTop: screenHeight <= 390 ? 170 : 160,
    paddingBottom:85,
    paddingHorizontal:25,
  },
  //////////////
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 0,
  },
  container: {
    flex: 1,
    padding: 0,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    height: height,
  },
  images: {
    width: '100%',
    height:'100%',
    resizeMode: 'cover',
    position:'absolute',
    top:0,
  },
  textBlock:{
    position:"absolute",
    zIndex:2,
    bottom:0,
    textAlign:'center',
    paddingHorizontal:0,
    paddingBottom:0,
  },
  weltitle:{
    fontFamily: 'Montserrat-Regular',
    fontSize:24,
    color:"#787978",
    letterSpacing:2,
    textAlign:'center',
    marginBottom:0,
  },
  nirnayanText:{
    // fontFamily: 'ArimaMadurai-Bold',
    margin:'auto',
    marginBottom:30,
  },
  desc:{
    fontFamily: 'Montserrat-Medium',
    fontSize:16,
    color:"#656565",
    textAlign:'center',
    marginBottom:30,
  },
  btnText:{
    fontFamily: 'Montserrat-Bold',
    fontSize:15,
    color:'#FFFFFF',
    textAlign:'center',
    backgroundColor:'#2F81F5',
    borderRadius:12,
    paddingVertical:16,
  },
  subtitle:{
    fontFamily: 'Montserrat-Bold',
    fontSize:32,
    color:'#2F81F5',
    textAlign:'center',
    marginBottom:25,
  },
  roundlogo: {
    position:'absolute',
    top:50,
    alignSelf:'center',
  },
  pagination: {
    position:'absolute',
    bottom:35,
    left:0,
    right:0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap:0,
    paddingHorizontal:100,
  },
  dot: {
    width:'33.3%',
    height: 4,
    backgroundColor: '#C8DFFF',
  },
  activeDot: {
    backgroundColor: '#2F81F5',
  },
});


