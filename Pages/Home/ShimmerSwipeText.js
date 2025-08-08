// ShimmerSwipeText.js
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  Text,
  Dimensions,
  Easing
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

export default function ShimmerSwipeText({ text, textStyle = {} }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.shimmerContainer}>
      <Text style={[styles.swipeText, textStyle]}>{text}</Text>
      <Animated.View
        style={[
          styles.shimmerOverlay,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.35)', 'transparent']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  shimmerContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
  },
  swipeText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: 10,
    fontWeight: 'bold',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  gradient: {
    width: 150, // slightly wider shimmer
    height: '100%',
  },
});
