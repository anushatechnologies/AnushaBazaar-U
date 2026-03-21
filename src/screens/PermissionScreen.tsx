import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocation } from '../context/LocationContext';
import { useAppPermissions } from '../hooks/useAppPermissions';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const PermissionScreen = () => {
  const { checkPermission, setLocation } = useLocation();
  const { requestLocationPermission } = useAppPermissions();
  const navigation = useNavigation<any>();

  const handleAllowLocation = async () => {
    try {
      const status = await requestLocationPermission();
      
      if (status === 'granted') {
        const isPermitted = await checkPermission();
        if (isPermitted) {
          // Immediately try to get current location to satisfy the 'location' requirement in RootStack
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          
          if (currentLocation) {
            // Reverse geocode to get a readable address (optional but better)
            const [addressResult] = await Location.reverseGeocodeAsync({
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            });

            const formattedAddress = addressResult 
              ? `${addressResult.name || ''}, ${addressResult.district || ''}, ${addressResult.city || ''}`
              : "Current Location";

            setLocation({
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              address: formattedAddress,
            });
          }
        }
      } else if (status === 'denied' || status === 'undetermined') {
        navigation.navigate('SelectLocation');
      }
    } catch (error) {
      console.error("Error in handleAllowLocation:", error);
      navigation.navigate('SelectLocation');
    }
  };

  const handleManualLocation = () => {
    navigation.navigate('SelectLocation');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        {/* Animated Background Blob */}
        <View style={styles.blobContainer}>
          <LinearGradient
            colors={['#FFF5F5', '#FFF0F0']}
            style={styles.blob}
          />
          <View style={styles.iconCircle}>
            <LinearGradient
              colors={['#FF4B4B', '#FF7676']}
              style={styles.iconGradient}
            >
              <Ionicons name="location" size={60} color="#FFF" />
            </LinearGradient>
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.subtitle}>
            To provide you with the fastest delivery and show available stores near you, we need your location access.
          </Text>
        </View>

        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="flash-outline" size={24} color="#FF4B4B" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>15-Minute Delivery</Text>
              <Text style={styles.infoSub}>Get your groceries delivered in a flash</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="storefront-outline" size={24} color="#FF4B4B" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Nearby Stores</Text>
              <Text style={styles.infoSub}>Shop from the best local stores around you</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleAllowLocation}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF4B4B', '#FF3131']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.primaryButtonText}>Allow Location Access</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={handleManualLocation}
          activeOpacity={0.6}
        >
          <Text style={styles.secondaryButtonText}>Enter Location Manually</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: height * 0.08,
  },
  blobContainer: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  blob: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.8,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFF',
    elevation: 15,
    shadowColor: '#FF4B4B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  infoCards: {
    width: '100%',
    gap: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF1F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  infoSub: {
    fontSize: 13,
    color: '#888',
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF4B4B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FF4B4B',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PermissionScreen;
