import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';

export const useAppPermissions = () => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    let mounted = true;

    const requestAllPermissions = async () => {
      try {
        // 1. Location
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        
        // 2. Microphone / Audio
        const { status: audioStatus } = await Audio.requestPermissionsAsync();

        // 3. Contacts
        const { status: contactsStatus } = await Contacts.requestPermissionsAsync();

        // 4. Push Notifications
        const { status: notifStatus } = await Notifications.requestPermissionsAsync();

        if (mounted) {
          // You could optionally verify if *all* are granted, 
          // or just mark that the flow has finished.
          setPermissionsGranted(true);
          
          console.log("Permissions flow complete. Status:");
          console.log({
            location: locStatus,
            audio: audioStatus,
            contacts: contactsStatus,
            notifications: notifStatus
          });
        }
      } catch (error) {
        console.error("Error requesting permissions on startup:", error);
      }
    };

    requestAllPermissions();

    return () => {
      mounted = false;
    };
  }, []);

  return permissionsGranted;
};
