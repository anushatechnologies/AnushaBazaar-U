import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export const useVoiceSearch = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to hold the active recording instance
  const recordingRef = useRef<Audio.Recording | null>(null);
  // Silence detection timer
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch((e) => console.log('Cleanup error', e));
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    try {
      if (!OPENAI_API_KEY) {
         setError("OpenAI API key missing. Add EXPO_PUBLIC_OPENAI_API_KEY to .env");
         return;
      }

      setError(null);
      
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start Recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsListening(true);

      // Simple silence auto-stop mechanic
      // When the user starts speaking, reset the timer. If they stop for N seconds, stop measuring and query.
      let hasSpoken = false;
      recording.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording) return;
        
        const metering = status.metering ?? -160;
        // -35 dB is a reasonable threshold for speech relative to background silence on mobile mics
        if (metering > -35) {
          hasSpoken = true;
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          
          silenceTimerRef.current = setTimeout(() => {
            if (hasSpoken) {
               stopListening(false);
            }
          }, 2000); // Wait 2 seconds of silence before firing Whisper
        }
      });
      // Progress update every 100ms for accurate metering
      recording.setProgressUpdateInterval(100);

    } catch (e: any) {
      console.error('startListening error:', e);
      setError(e.message);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(async (cancelParam: any = false) => {
    // React synthetic events might be passed if used directly in onPress
    const isCancel = cancelParam === true;
    
    // If no recording is active, do nothing
    if (!recordingRef.current) return;
    
    try {
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      const activeRecording = recordingRef.current;
      recordingRef.current = null;
      
      await activeRecording.stopAndUnloadAsync();
      const uri = activeRecording.getURI();

      if (isCancel || !uri) return;

      // Ensure Audio mode stops capturing the device mic
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      // Build Multipart form for Whisper
      const extension = Platform.OS === 'ios' ? '.m4a' : '.m4a';
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: `audio${extension}`,
        type: `audio/m4a`, // Whisper accepts m4a directly
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en'); // Adjust for target demographic, English gives incredibly fast Indian English parses

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Whisper Error:", errorText);
        throw new Error(`Whisper API Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.text && data.text.trim().length > 0) {
        // Pass transcribed text back to UI
        onResult(data.text.trim());
      }
      
    } catch (e: any) {
      console.error('stopListening error:', e);
      setError(e.message);
    }
  }, [onResult]);

  return {
    isListening,
    error,
    startListening,
    stopListening,
  };
};
