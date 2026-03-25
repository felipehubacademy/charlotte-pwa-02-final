// hooks/useChat.ts - Lógica de mensagens do chat

import React, { useState, useCallback, useRef } from 'react';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { Message } from '@/components/chat/ChatBox';
import { ConversationContextManager } from '@/lib/conversation-context';
import { transcribeAudio } from '@/hooks/useAudioRecorder';
import { checkXPMilestone, sendXPMilestoneNotification } from '@/hooks/usePushNotifications';
import { supabase } from '@/lib/supabase';
import { ChatMode } from '@/lib/levelConfig';

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'http://localhost:3000';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function splitIntoMultipleMessages(response: string, userLevel: string): string[] {
  if (userLevel === 'Novice') return [response.trim()];

  const grammarPatterns = [
    /^(.*?)\s+(Ah and.*?)$/i,
    /^(.*?)\s+(Oh,?\s*and.*?)$/i,
    /^(.*?)\s+(Just a tip.*?)$/i,
    /^(.*?)\s+(By the way.*?)$/i,
    /^(.*?)\s+(Great English!.*?)$/i,
    /^(.*?)\s+(Perfect grammar!.*?)$/i,
    /^(.*?)\s+(Well said!.*?)$/i,
    /^(.*?)\s+(Remember to.*?)$/i,
    /^(.*?)\s+(Try saying.*?)$/i,
    /^(.*?)\s+(You could say.*?)$/i,
    /^(.*?)\s+(Better to say.*?)$/i,
    /^(.*?)\s+(Instead of.*?)$/i,
  ];

  const normalized = response.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  for (const pattern of grammarPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      return [match[1].trim(), match[2].trim()].filter(m => m.length > 0);
    }
  }

  return [response.trim()];
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

/** Call TTS endpoint and save the mp3 to a local temp file. Returns local URI or null. */
async function fetchTTS(text: string): Promise<string | null> {
  try {
    console.log('🔊 Fetching TTS for:', text.slice(0, 60));
    const response = await fetch(`${API_BASE_URL}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      const err = await response.text();
      console.warn('❌ TTS HTTP error:', response.status, err);
      return null;
    }
    const data = await response.json();
    if (!data.audio) {
      console.warn('❌ TTS response missing audio field:', JSON.stringify(data).slice(0, 200));
      return null;
    }
    // Write base64 mp3 to a temp file so expo-audio can play it
    const uri = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(uri, data.audio, {
      encoding: 'base64' as any,
    });
    console.log('✅ TTS saved to:', uri);
    return uri;
  } catch (e) {
    console.warn('❌ TTS fetch failed:', e);
    return null;
  }
}

interface UseChatOptions {
  userLevel: 'Novice' | 'Inter' | 'Advanced';
  userName: string;
  userId: string;
  mode?: ChatMode;
}

export function useChat({ userLevel, userName, userId, mode = 'chat' }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);
  const [totalXP, setTotalXP] = useState(0);

  // Load real totalXP from user_progress on mount
  React.useEffect(() => {
    if (!userId) return;
    supabase
      .from('user_progress')
      .select('total_xp')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setTotalXP(data.total_xp ?? 0);
      })
      .catch(() => {});
  }, [userId]);

  // Welcome message on mount
  React.useEffect(() => {
    const welcomeMessages: Record<string, Record<string, string>> = {
      grammar: {
        Advanced: `Hi ${userName}! Let's sharpen your grammar. Type a sentence and I'll give you a detailed analysis.`,
        Inter: `Hi ${userName}! Send me a sentence in English and I'll help you improve your grammar.`,
        Novice: `Olá ${userName}! Escreva uma frase em inglês e eu vou analisar sua gramática. Pode ser simples! 😊`,
      },
      pronunciation: {
        Advanced: `Hi ${userName}! Let's work on your pronunciation. Hold the mic and say something — I'll analyze stress, intonation, and fluency.`,
        Inter: `Hi ${userName}! Hold the mic button and say something in English. I'll check your pronunciation and give you tips!`,
        Novice: `Olá ${userName}! Segure o botão do microfone e fale em inglês. Vou analisar sua pronúncia! 🎤`,
      },
      chat: {
        Advanced: `Hey ${userName}! Ready to practice? What's on your mind today? 😊`,
        Inter: `Hi ${userName}! Great to see you. Let's practice some English today! 😊`,
        Novice: `Olá ${userName}! Vamos praticar inglês juntos hoje? Pode escrever em português se preferir! 😊`,
      },
    };
    const welcome: Message = {
      id: 'welcome-0',
      role: 'assistant',
      content: (welcomeMessages[mode] ?? welcomeMessages.chat)[userLevel] ?? (welcomeMessages.chat)[userLevel],
      messageType: 'text',
      timestamp: new Date(),
    };
    setMessages([welcome]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const contextManagerRef = useRef(
    new ConversationContextManager(userLevel, userName)
  );

  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const getAssistantResponse = useCallback(
    async (
      userMessage: string,
      messageType: 'text' | 'audio',
      pronunciationData?: any
    ) => {
      const contextString = contextManagerRef.current.generateContextForAssistant();

      const response = await fetch(`${API_BASE_URL}/api/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: userMessage,
          pronunciationData: pronunciationData ?? null,
          userLevel,
          userName,
          messageType,
          mode,
          conversationContext: contextString,
        }),
      });

      if (!response.ok) throw new Error(`Assistant API error: ${response.status}`);

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Assistant API failed');

      return {
        feedback: data.result.feedback as string,
        technicalFeedback: data.result.technicalFeedback as string | undefined,
        xpAwarded: (data.result.xpAwarded as number) ?? 10,
      };
    },
    [userLevel, userName, mode]
  );

  /**
   * Adds assistant messages one-by-one with 1500ms delay.
   * When respondWithAudio=true, also fetches TTS for each part.
   */
  const deliverSequentially = useCallback(
    async (
      parts: string[],
      technicalFeedback: string | undefined,
      respondWithAudio = false
    ) => {
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) await delay(1500);

        // Fetch TTS in parallel while building the message
        const audioUri = respondWithAudio ? await fetchTTS(parts[i]) : null;

        const msg: Message = {
          id: `${generateId()}-${i}`,
          role: 'assistant',
          content: parts[i],
          messageType: respondWithAudio && audioUri ? 'audio' : 'text',
          audioUrl: audioUri ?? undefined,
          audioDuration: undefined,
          timestamp: new Date(),
          technicalFeedback: i === 0 ? technicalFeedback : undefined,
        };

        setMessages(prev => [...prev, msg]);
      }
    },
    []
  );

  const sendTextMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isProcessing) return;

      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content: text.trim(),
        messageType: 'text',
        timestamp: new Date(),
      };

      addMessage(userMsg);
      setIsProcessing(true);

      contextManagerRef.current.addMessage('user', text.trim(), 'text');

      try {
        const { feedback, technicalFeedback, xpAwarded } =
          await getAssistantResponse(text.trim(), 'text');

        contextManagerRef.current.addMessage('assistant', feedback, 'text');

        // Stamp grammar feedback onto the user's own message so it shows below their bubble
        // Note: backend may return '' when analysis fails — treat that as "no feedback"
        if (technicalFeedback?.trim()) {
          setMessages(prev =>
            prev.map(m => m.id === userMsg.id ? { ...m, technicalFeedback } : m)
          );
        }

        const parts = splitIntoMultipleMessages(feedback, userLevel);
        await deliverSequentially(parts, technicalFeedback, false);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSessionXP(prev => prev + xpAwarded);
        setTotalXP(prev => {
          const milestone = checkXPMilestone(prev, prev + xpAwarded);
          if (milestone) sendXPMilestoneNotification(milestone);
          return prev + xpAwarded;
        });
      } catch (error) {
        console.error('❌ sendTextMessage error:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const fallback: Message = {
          id: generateId(),
          role: 'assistant',
          content: `Great practice, ${userName}! Keep it up! 😊`,
          messageType: 'text',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, fallback]);
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, addMessage, getAssistantResponse, deliverSequentially, userLevel, userName]
  );

  /**
   * Send a recorded audio message.
   * Charlotte responds with audio (TTS) when user sends audio.
   */
  const sendAudioMessage = useCallback(
    async (audioUri: string, audioDuration: number) => {
      if (isProcessing) return;

      setIsProcessing(true);
      setIsProcessingAudio(true);

      const tempId = generateId();
      const recordingMsg: Message = {
        id: tempId,
        role: 'user',
        content: '',
        audioUri,
        audioDuration,
        messageType: 'audio',
        timestamp: new Date(),
        isRecording: true,
      };
      addMessage(recordingMsg);

      try {
        // 1. Transcribe
        console.log('🎤 Transcribing audio:', audioUri);
        const transcription = await transcribeAudio(audioUri);
        console.log('📝 Transcription result:', transcription);

        // Keep content empty — we don't show the transcription on the user's bubble,
        // only use it internally to call the assistant API
        setMessages(prev =>
          prev.map(m =>
            m.id === tempId ? { ...m, content: '', isRecording: false } : m
          )
        );

        if (!transcription) {
          console.warn('⚠️ Transcription returned null — aborting');
          setIsProcessing(false);
          setIsProcessingAudio(false);
          return;
        }

        contextManagerRef.current.addMessage('user', transcription, 'audio');

        // 2. Get assistant response
        const { feedback, technicalFeedback, xpAwarded } =
          await getAssistantResponse(transcription, 'audio');

        contextManagerRef.current.addMessage('assistant', feedback, 'text');

        // Stamp pronunciation/grammar feedback onto the user's audio bubble
        if (technicalFeedback?.trim()) {
          setMessages(prev =>
            prev.map(m => m.id === tempId ? { ...m, technicalFeedback } : m)
          );
        }

        const parts = splitIntoMultipleMessages(feedback, userLevel);
        // Charlotte responds with audio when user sends audio
        await deliverSequentially(parts, technicalFeedback, true);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSessionXP(prev => prev + xpAwarded);
        setTotalXP(prev => {
          const milestone = checkXPMilestone(prev, prev + xpAwarded);
          if (milestone) sendXPMilestoneNotification(milestone);
          return prev + xpAwarded;
        });
      } catch (error) {
        console.error('❌ sendAudioMessage error:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setMessages(prev =>
          prev.map(m => (m.id === tempId ? { ...m, isRecording: false } : m))
        );
      } finally {
        setIsProcessing(false);
        setIsProcessingAudio(false);
      }
    },
    [isProcessing, addMessage, getAssistantResponse, deliverSequentially, userLevel]
  );

  return {
    messages,
    isProcessing,
    isProcessingAudio,
    sessionXP,
    totalXP,
    sendTextMessage,
    sendAudioMessage,
  };
}
