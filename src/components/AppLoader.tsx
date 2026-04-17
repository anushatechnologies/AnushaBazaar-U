import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence,
  withDelay,
  Easing 
} from 'react-native-reanimated';

const AppLoader = () => {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.8);
  
  const ripple1Scale = useSharedValue(1);
  const ripple1Opacity = useSharedValue(0.6);

  const ripple2Scale = useSharedValue(1);
  const ripple2Opacity = useSharedValue(0.6);

  useEffect(() => {
    // Core logo heartbeat pulse
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.85, { duration: 800 })
      ),
      -1,
      true
    );

    // Continuous outward Ripple 1
    ripple1Scale.value = withRepeat(
      withTiming(2.8, { duration: 2500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    ripple1Opacity.value = withRepeat(
      withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    // Continuous outward Ripple 2 (Delayed phase shift)
    ripple2Scale.value = withDelay(
      1250,
      withRepeat(
        withTiming(2.8, { duration: 2500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
    ripple2Opacity.value = withDelay(
      1250,
      withRepeat(
        withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const ripple1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ripple1Scale.value }],
    opacity: ripple1Opacity.value,
  }));

  const ripple2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ripple2Scale.value }],
    opacity: ripple2Opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ripple, ripple1Style]} />
      <Animated.View style={[styles.ripple, ripple2Style]} />
      
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image 
          source={require('../../assets/splash.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Clean glass-like frosted background
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Render on top of everything
  },
  logoContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 70,
    elevation: 15,
    shadowColor: '#10B981', // Premium emerald green matching your app's brand
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 22,
  },
  ripple: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#10B981', // Emerald green brand color
  }
});

export default AppLoader;
