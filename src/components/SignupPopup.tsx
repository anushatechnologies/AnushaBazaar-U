import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface SignupPopupProps {
  visible: boolean;
  onClose: () => void;
  onSignup: () => void;
  phone: string;
}

const SignupPopup: React.FC<SignupPopupProps> = ({ visible, onClose, onSignup, phone }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(0.8, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <Animated.View style={[styles.container, animatedStyle]}>
          <View style={styles.card}>
            {/* Design Header */}
            <View style={styles.headerDecoration}>
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
            </View>

            <View style={styles.content}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require("../../assets/company-logo.png")} 
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>

              <Text style={styles.title}>New to Anusha Bazaar?</Text>
              <Text style={styles.subtitle}>
                We couldn't find an account for <Text style={styles.phoneHighlight}>+91 {phone}</Text>. 
                Join us today for the freshest groceries and lightning-fast delivery!
              </Text>

              <Pressable 
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={onSignup}
              >
                <Text style={styles.buttonText}>Sign Up Now</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </Pressable>

              <Pressable 
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed
                ]}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>I'll do it later</Text>
              </Pressable>
            </View>

            <Pressable style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default SignupPopup;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  container: {
    width: width * 0.88,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
  },
  card: {
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
  headerDecoration: {
    height: 120,
    backgroundColor: '#F0FDF4',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 100,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#0A8754',
    opacity: 0.05,
    top: -100,
    left: -50,
  },
  circle2: {
    width: 120,
    height: 120,
    backgroundColor: '#FEF9C3',
    opacity: 0.3,
    bottom: -60,
    right: -20,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
    marginTop: -40, // Pull up the content for the logo overlap
  },
  logoContainer: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#0A8754',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontWeight: '500',
  },
  phoneHighlight: {
    color: '#0A8754',
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: '#0A8754',
    width: '100%',
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: '#0A8754',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    marginBottom: 16,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  secondaryButtonPressed: {
    backgroundColor: '#F1F5F9',
  },
  secondaryButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
