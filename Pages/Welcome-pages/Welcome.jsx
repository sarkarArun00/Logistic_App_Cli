// import React from 'react';
// import { View, Text, Button, StyleSheet } from 'react-native';

// const Welcome = ({ navigation }) => {
//   const handleNext = () => {
//     navigation.replace('Login'); //  navigates to Login screen
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to the App!</Text>
//       <Button title="Next" onPress={handleNext} />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f4f4f4',
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
// });

// export default Welcome;

// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   Image,
//   ScrollView,
//   Dimensions,
//   TouchableOpacity,
//   StyleSheet,
//   SafeAreaView
// } from 'react-native';

// const { width, height } = Dimensions.get('window');

// const Welcome = ({ navigation }) => {
//   const [currentSlide, setCurrentSlide] = useState(0);

//   const onScroll = (e) => {
//     const slide = Math.round(e.nativeEvent.contentOffset.x / width);
//     setCurrentSlide(slide);
//   };

// //   const handleNext = () => {
// //     navigation.replace('Login');
// //   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.container}>
//         <ScrollView
//           horizontal
//           pagingEnabled
//           onScroll={onScroll}
//           showsHorizontalScrollIndicator={false}
//           style={styles.scrollView}
//         >
//           {/* Slide 1 */}
//           <View style={styles.slide}>
//             <Image source={require('../../assets/screen1.jpg')} style={styles.image} />
//             <View style={styles.textBlock}>
//                 <Text style={styles.weltitle}>Welcome to</Text>
//                 <Image source={require('../../assets/nirnayantext.png')} style={styles.nirnayanText} />
//                 <Text style={styles.desc}>
//                 Streamline your logistics with real-time tracking, route optimization, and end-to-end delivery management
//                 </Text>
//                 <TouchableOpacity style={styles.btn}>
//                 <Text style={styles.btnText}>Next</Text>
//                 </TouchableOpacity>
//             </View>
//             <View style={styles.curvbg}>
//                 <Image source={require('../../assets/roundlogo.png')} style={styles.roundlogo} />
//                 <Image source={require('../../assets/curvbg.png')} style={styles.curvImg} />
//             </View>
//           </View>

//           {/* Slide 2 */}
//           <View style={styles.slide}>
//             <Image source={require('../../assets/screen2.jpg')} style={styles.image} />
//             <View style={styles.textBlock}>
//                 <Text style={styles.maintitle}>Trained Phlebotomist</Text>
//                 <Text style={styles.subtitle}>Technician performs collection</Text>
//                 <Text style={styles.desc}>
//                 Maecenas scelerisque convallis rutrum Maecenas scelerisque Maecenas scelerisque convallis rutrum
//                 </Text>
//                 <TouchableOpacity style={styles.btn}>
//                 <Text style={styles.btnText}>Next</Text>
//                 </TouchableOpacity>
//             </View>
//             <View style={styles.curvbg}>
//                 <Image source={require('../../assets/curvbg.png')} style={styles.curvImg} />
//             </View>
//           </View>

//           {/* Slide 3 */}
//           <View style={styles.slide}>
//             <Image source={require('../../assets/screen3.jpg')} style={styles.image} />
//             <View style={styles.textBlock}>
//                 <Text style={styles.maintitle}>
//                 Smart Logistics for a <Text style={styles.highlight}>Moving World</Text>
//                 </Text>
//                 <Text style={styles.subtitle}>Technician performs collection</Text>
//                 <Text style={styles.desc}>
//                 Maecenas scelerisque convallis rutrum Maecenas scelerisque Maecenas scelerisque convallis rutrum
//                 </Text>
//                 <TouchableOpacity style={styles.btn}>
//                 <Text style={styles.btnText}>Get Started Now</Text>
//                 </TouchableOpacity>
//             </View>
//             <View style={styles.curvbg}>
//                 <Image source={require('../../assets/curvbg.png')} style={styles.curvImg} />
//             </View>
//           </View>
//         </ScrollView>

//         {/* Pagination Dots */}
//         <View style={styles.pagination}>
//           {[0, 1, 2].map((index) => (
//             <View
//               key={index}
//               style={[styles.dot, currentSlide === index && styles.activeDot]}
//             />
//           ))}
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default Welcome;

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#fff',
//     padding: 0,
//   },
//   container: {
//     flex: 1,
//     padding: 0,
//     backgroundColor: '#fff',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   slide: {
//     width: width,
//     padding: 0,
//     position:'relative',
//   },
//   image: {
//     width: '100%',
//     height:'100%',
//     resizeMode: 'cover',
//   },
//   textBlock:{
//     position:"absolute",
//     zIndex:2,
//     bottom:60,
//     textAlign:'center',
//     paddingHorizontal:50,
//     paddingBottom:50,
//   },
//   weltitle:{
//     fontFamily: 'Montserrat-Regular',
//     fontSize:24,
//     color:"#0D0D0D",
//     letterSpacing:2,
//     textAlign:'center',
//     marginBottom:13,
//   },
//   nirnayanText:{
//     margin:'auto',
//     marginBottom:60,
//   },
//   desc:{
//     fontFamily: 'Montserrat-Medium',
//     fontSize:16,
//     color:"#A4A4A4",
//     textAlign:'center',
//     marginBottom:50,
//   },
//   btnText:{
//     fontFamily: 'Montserrat-Bold',
//     fontSize:20,
//     color:'#FFFFFF',
//     textAlign:'center',
//     backgroundColor:'#2F81F5',
//     borderRadius:12,
//     paddingVertical:16,
//   },
//   maintitle:{
//     fontFamily: 'Montserrat-Bold',
//     fontSize:30,
//     color:'#05A854',
//     textAlign:'center',
//     marginBottom:0,
//   },
//   highlight:{
//     fontFamily: 'Montserrat-Light',
//   },
//   subtitle:{
//     fontFamily: 'Montserrat-Regular',
//     fontSize:20,
//     color:'#636E68',
//     textAlign:'center',
//     marginBottom:25,
//   },
//   curvbg:{
//     position:'absolute',
//     bottom:0,
//   },
//   roundlogo:{
//     position:'absolute',
//     zIndex:1,
//     top:77,
//     alignSelf: 'center',
//   },







//   pagination: {
//     position:'absolute',
//     bottom:50,
//     left:0,
//     right:0,
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap:0,
//     paddingHorizontal:100,
//   },
//   dot: {
//     width:'33.3%',
//     height: 4,
//     backgroundColor: '#34A89B',
//   },
//   activeDot: {
//     backgroundColor: '#E2D117',
//   },
// });

import React, { useState, useRef } from 'react';
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

const { width } = Dimensions.get('window');

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
            <Image source={require('../../assets/screen1.jpg')} style={styles.image} />
            <View style={styles.textBlock}>
              <Text style={styles.weltitle}>Welcome to</Text>
              <Image source={require('../../assets/nirnayantext.png')} style={styles.nirnayanText} />
              <Text style={styles.desc}>
                An advanced healthcare logistics solution—offering real-time tracking,  scheduling, and secure sample delivery
              </Text>
              <TouchableOpacity style={styles.btn} onPress={handleNext}>
                <Text style={styles.btnText}>Next</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.curvbg}>
              <Image source={require('../../assets/roundlogo.png')} style={styles.roundlogo} />
              <Image source={require('../../assets/curvbg.png')} style={styles.curvImg} />
            </View>
          </View>

          {/* Slide 2 */}
          <View style={styles.slide}>
            <Image source={require('../../assets/screen2.jpg')} style={styles.image} />
            <View style={styles.textBlock}>
              <Text style={styles.maintitle}>Real-time Secure Delivery</Text>
              {/* <Text style={styles.subtitle}>Technician performs collection</Text> */}
              <Text style={styles.desc}>
               Experience hassle-free, on-time sample delivery while maintaining all healthcare quality protocols.
              </Text>
              <TouchableOpacity style={styles.btn} onPress={handleNext}>
                <Text style={styles.btnText}>Next</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.curvbg}>
              <Image source={require('../../assets/curvbg.png')} style={styles.curvImg} />
            </View>
          </View>

          {/* Slide 3 */}
          <View style={styles.slide}>
            <Image source={require('../../assets/screen3.jpg')} style={styles.image} />
            <View style={styles.textBlock}>
              <Text style={styles.maintitle}>
                Redefined by Trust & Accuracy
                {/* Smart Logistics for a <Text style={styles.highlight}>Moving World</Text> */}
              </Text>
              {/* <Text style={styles.subtitle}>Technician performs collection</Text> */}
              <Text style={styles.desc}>
                Step into a new era of healthcare logistics with uncompromising accuracy and reliable testing, with the fastest report delivery
              </Text>
              <TouchableOpacity style={styles.btn} onPress={handleNext}>
                <Text style={styles.btnText}>Get Started</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.curvbg}>
              <Image source={require('../../assets/curvbg.png')} style={styles.curvImg} />
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
    padding: 0,
    position:'relative',
  },
  image: {
    width: '100%',
    height:'100%',
    resizeMode: 'cover',
  },
  textBlock:{
    position:"absolute",
    zIndex:2,
    bottom:50,
    textAlign:'center',
    paddingHorizontal:30,
    paddingBottom:50,
  },
  weltitle:{
    fontFamily: 'Montserrat-Regular',
    fontSize:24,
    color:"#0D0D0D",
    letterSpacing:2,
    textAlign:'center',
    marginBottom:13,
  },
  nirnayanText:{
    margin:'auto',
    marginBottom:30,
  },
  desc:{
    fontFamily: 'Montserrat-Medium',
    fontSize:16,
    color:"#A4A4A4",
    textAlign:'center',
    marginBottom:30,
  },
  btnText:{
    fontFamily: 'Montserrat-Bold',
    fontSize:20,
    color:'#FFFFFF',
    textAlign:'center',
    backgroundColor:'#2F81F5',
    borderRadius:12,
    paddingVertical:16,
  },
  maintitle:{
    fontFamily: 'Montserrat-Bold',
    fontSize:30,
    color:'#2F81F5',
    textAlign:'center',
    marginBottom:20,
  },
  highlight:{
    fontFamily: 'Montserrat-Light',
  },
  subtitle:{
    fontFamily: 'Montserrat-Regular',
    fontSize:20,
    color:'#636E68',
    textAlign:'center',
    marginBottom:25,
  },
  curvbg:{
    position:'absolute',
    bottom:0,
    height:'78%',
  },
  roundlogo: {
    position: 'absolute',
    width: 90,
    height: 90,
    top:95,
    left: '50%',
    transform: [{ translateX: -100 }],
    zIndex: 1,
  },
  




  pagination: {
    position:'absolute',
    bottom:50,
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
    backgroundColor: '#34A89B',
  },
  activeDot: {
    backgroundColor: '#E2D117',
  },
});



