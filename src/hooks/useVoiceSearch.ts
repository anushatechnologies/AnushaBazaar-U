import { useState, useEffect, useCallback } from 'react';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

export const useVoiceSearch = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.error('onSpeechError:', e);
      setError(e.error?.message || 'Speech recognition error');
      setIsListening(false);
    };
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        onResult(e.value[0]);
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [onResult]);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      await Voice.start('en-US'); // You can change to 'en-IN' or others
    } catch (e: any) {
      console.error('startListening error:', e);
      setError(e.message);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e: any) {
      console.error('stopListening error:', e);
    }
  }, []);

  return {
    isListening,
    error,
    startListening,
    stopListening,
  };
};
