import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export const useAppPermissions = () => {
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return 'error';
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return 'error';
    }
  };

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status;
    } catch (error) {
      console.error("Error checking location permission:", error);
      return 'error';
    }
  };

  return {
    requestLocationPermission,
    requestNotificationPermission,
    checkLocationPermission,
  };
};
