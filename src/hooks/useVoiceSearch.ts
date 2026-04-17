import { useState, useCallback, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

export const useVoiceSearch = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      try {
        Voice.destroy().then(Voice.removeAllListeners);
      } catch (e) {
        console.warn('Voice destroy error:', e);
      }
    };
  }, []);

  const onSpeechStart = (e: any) => {
    setIsListening(true);
    setError(null);
  };

  const onSpeechEnd = (e: any) => {
    setIsListening(false);
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      onResult(e.value[0]);
    }
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    // Only show error if we are actively listening and it's not a generic cancel error
    if (e.error?.message && e.error.message !== "7/No match") {
       console.log('FCM Voice Error:', e.error);
       setError(e.error?.message || "Speech recognition error");
    }
    setIsListening(false);
  };

  const startListening = useCallback(async () => {
    try {
      // 1. Android Runtime Permission Check
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "Anusha Bazaar needs access to your microphone to search for products by voice.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setError("Microphone permission denied");
          return;
        }
      }

      // 2. Check if Voice module exists (Native Bridge check)
      if (!Voice || typeof Voice.start !== 'function') {
        throw new Error('VOICE_MODULE_NOT_FOUND');
      }
      
      setError(null);
      setIsListening(true);
      await Voice.start('en-IN'); 
    } catch (e: any) {
      console.error('startListening error:', e);
      
      if (e.message === 'VOICE_MODULE_NOT_FOUND' || e.message?.includes('null')) {
        setError("Voice search not available on this device. Please rebuild the app.");
      } else {
        setError(e.message || "Could not start voice search");
      }
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(async (cancelParam: any = false) => {
    try {
      if (cancelParam === true) {
        await Voice.cancel();
      } else {
        await Voice.stop();
      }
      setIsListening(false);
    } catch (e: any) {
      console.error('stopListening error:', e);
      setError(e.message);
    }
  }, []);

  return {
    isListening,
    error,
    startListening,
    stopListening,
  };
};
