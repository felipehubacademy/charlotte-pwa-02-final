'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Play, Pause, Volume2, Languages } from 'lucide-react';
import { translationService, TranslationResult } from '@/lib/translation-service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  audioBlob?: Blob;
  audioDuration?: number;
  isTyping?: boolean;
  isRecording?: boolean;
  timestamp?: Date;
  messageType?: 'text' | 'audio' | 'image';
  technicalFeedback?: string;
}

interface ChatBoxProps {
  messages: Message[];
  transcript: string;
  finalTranscript: string;
  isProcessingMessage: boolean;
  userLevel: string;
}

// WhatsApp-style typing indicator
const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="flex items-center space-x-3 p-3 bg-charcoal rounded-2xl rounded-bl-md max-w-20 mb-4"
  >
    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
      <span className="text-primary text-xs font-bold">C</span>
    </div>
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce"
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  </motion.div>
);

// Audio recording indicator
const AudioRecordingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="flex items-center space-x-3 p-4 bg-charcoal rounded-2xl rounded-bl-md max-w-xs mb-4"
  >
    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
      <span className="text-primary text-xs font-bold">C</span>
    </div>
    <div className="flex items-center space-x-2">
      <Mic className="w-4 h-4 text-primary animate-pulse" />
      <div className="flex space-x-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-primary rounded-full animate-pulse"
            style={{
              height: `${Math.random() * 16 + 8}px`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
      <span className="text-white/70 text-sm">Recording...</span>
    </div>
  </motion.div>
);

// Message bubble component
const MessageBubble: React.FC<{ message: Message; userLevel: string }> = ({ message, userLevel }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(message.audioDuration || 0);
  const [showTranslation, setShowTranslation] = React.useState(false);
  const [showTranscription, setShowTranscription] = React.useState(false);
  const [showTechnicalFeedback, setShowTechnicalFeedback] = React.useState(false);
  const [transcription, setTranscription] = React.useState('');
  const [translation, setTranslation] = React.useState('');
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [translationError, setTranslationError] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string>('');

  const isUser = message.role === 'user';
  const isNovice = userLevel === 'Novice';
  const isAudioResponse = !isUser && message.technicalFeedback;

  // Função para traduzir mensagem
  const handleTranslation = React.useCallback(async () => {
    if (!showTranslation) {
      // Abrindo tradução - verificar se já temos tradução
      if (!translation && !isTranslating) {
        setIsTranslating(true);
        setTranslationError(false);
        
        try {
          console.log('🔄 Starting translation for:', message.content.substring(0, 50) + '...');
          
          const result: TranslationResult = await translationService.translateToPortuguese(
            message.content,
            'Charlotte English tutor conversation',
            userLevel
          );
          
          if (result.success) {
            setTranslation(result.translatedText);
            console.log('✅ Translation successful', result.cached ? '(cached)' : '(new)');
          } else {
            setTranslationError(true);
            setTranslation(result.translatedText); // Fallback translation
            console.warn('⚠️ Translation fallback used:', result.error);
          }
        } catch (error) {
          console.error('❌ Translation failed:', error);
          setTranslationError(true);
          setTranslation('Desculpe, não foi possível traduzir esta mensagem no momento. Sorry, I couldn\'t translate this message right now.');
        } finally {
          setIsTranslating(false);
        }
      }
    }
    
    setShowTranslation(!showTranslation);
  }, [showTranslation, translation, isTranslating, message.content, userLevel]);

  // Função para transcrever áudio
  const handleTranscription = React.useCallback(async () => {
    if (!audioUrl) return;
    
    setTranscription('Transcribing audio...');
    setShowTranscription(true);
    
    // Simular chamada para API de transcrição (Whisper)
    setTimeout(() => {
      setTranscription("That's a great question about English pronunciation! Let me help you improve your speaking skills.");
    }, 2000);
  }, [audioUrl]);

  // Create audio URL from blob
  React.useEffect(() => {
    if (message.audioBlob) {
      const url = URL.createObjectURL(message.audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (message.audioUrl) {
      setAudioUrl(message.audioUrl);
    }
  }, [message.audioBlob, message.audioUrl]);

  // Audio controls
  const togglePlayback = React.useCallback(() => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setDuration(Math.floor(audioRef.current.duration));
        }
      };

      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setCurrentTime(Math.floor(audioRef.current.currentTime));
        }
      };

      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audioRef.current.onplay = () => {
        setCurrentTime(0); // Zera contador ao iniciar
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl, isPlaying]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Use a duration mais precisa do audioRef se disponível
  const effectiveDuration = audioRef.current?.duration || duration || message.audioDuration || 0;
  const progressPercentage = effectiveDuration > 0 ? Math.min((currentTime / effectiveDuration) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-xs ${isUser ? 'ml-12' : 'mr-12'}`}>
        {/* Message bubble */}
        <div
          className={`px-4 py-3 rounded-2xl shadow-lg ${
            isUser
              ? 'bg-primary text-black rounded-br-md'
              : 'bg-charcoal text-white rounded-bl-md'
          }`}
        >
          {message.content && (
            <p className="text-sm leading-relaxed">{message.content}</p>
          )}
          
          {/* Image display for photo messages */}
          {message.messageType === 'image' && message.audioUrl && (
            <div className={`${message.content ? 'mt-3 pt-3 border-t border-white/10' : ''}`}>
              <img
                src={message.audioUrl}
                alt="Captured photo"
                className="w-full max-w-32 rounded-lg object-cover"
              />
            </div>
          )}
          
          {/* Audio player for voice messages */}
          {(message.audioUrl || message.audioBlob) && message.messageType !== 'image' && (
            <div className={`flex items-center space-x-3 ${message.content ? 'mt-3 pt-3 border-t border-white/10' : ''}`}>
              <button
                onClick={togglePlayback}
                className={`p-2 rounded-full transition-colors ${
                  isUser ? 'bg-black/20 hover:bg-black/30' : 'bg-primary/20 hover:bg-primary/30'
                }`}
              >
                {isPlaying ? (
                  <Pause size={14} className={isUser ? 'text-black' : 'text-primary'} />
                ) : (
                  <Play size={14} className={isUser ? 'text-black' : 'text-primary'} />
                )}
              </button>
              
              <div className="flex-1">
                {/* Progress bar */}
                <div className={`w-full h-1 rounded-full mb-1 ${
                  isUser ? 'bg-black/10' : 'bg-white/10'
                }`}>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isUser ? 'bg-black/80' : 'bg-white/80'
                    }`}
                    style={{ 
                      width: `${progressPercentage}%`,
                      minWidth: progressPercentage > 0 ? '2px' : '0px'
                    }}
                  />
                </div>
                
                {/* Time display - mostra tempo atual ou duração total */}
                <div className={`text-xs font-mono text-center ${
                  isUser ? 'text-black/60' : 'text-white/60'
                }`}>
                  <span>
                    {isPlaying || currentTime > 0 
                      ? formatTime(currentTime) 
                      : formatTime(effectiveDuration)
                    }
                  </span>
                </div>
              </div>
              
              <Volume2 size={12} className={isUser ? 'text-black/40' : 'text-white/40'} />
            </div>
          )}
        </div>

        {/* Translation and transcript buttons for different user levels */}
        {!isUser && (
          <div className="flex space-x-2 mt-2">
            {/* Traduzir button for Novice users */}
            {isNovice && (
              <button
                onClick={handleTranslation}
                disabled={isTranslating}
                className={`text-xs flex items-center space-x-1 transition-colors ${
                  isTranslating 
                    ? 'text-white/40 cursor-not-allowed' 
                    : 'text-primary hover:text-primary-dark'
                }`}
              >
                <Languages size={12} className={isTranslating ? 'animate-spin' : ''} />
                <span>{isTranslating ? 'Traduzindo...' : 'Traduzir'}</span>
              </button>
            )}
            
            {/* 🆕 Feedback button for audio responses */}
            {isAudioResponse && (
              <button
                onClick={() => setShowTechnicalFeedback(!showTechnicalFeedback)}
                className="text-xs text-primary hover:text-primary-dark flex items-center space-x-1"
              >
                <Volume2 size={12} />
                <span>Feedback</span>
              </button>
            )}
            
            {/* Transcription button for audio messages (Intermediate/Advanced) */}
            {(message.audioUrl || message.audioBlob) && (userLevel === 'Intermediate' || userLevel === 'Advanced') && (
              <button
                onClick={handleTranscription}
                className="text-xs text-primary hover:text-primary-dark flex items-center space-x-1"
              >
                <Mic size={12} />
                <span>Transcription</span>
              </button>
            )}
            
            {/* Ver texto button for audio messages (Novice) */}
            {(message.audioUrl || message.audioBlob) && isNovice && (
              <button 
                onClick={handleTranscription}
                className="text-xs text-white/50 hover:text-white/70"
              >
                Ver texto
              </button>
            )}
          </div>
        )}

        {/* Translation popup */}
        <AnimatePresence>
          {showTranslation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-2 p-3 bg-primary/10 backdrop-blur-sm rounded-xl border border-primary/20"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Languages size={12} className="text-primary" />
                <span className="text-xs text-primary font-medium">
                  Tradução em Português
                  {translationError && (
                    <span className="text-yellow-400 ml-1">(tradução básica)</span>
                  )}
                </span>
              </div>
              
              {isTranslating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  <p className="text-sm text-white/60">Traduzindo mensagem...</p>
                </div>
              ) : (
                <p className="text-sm text-white/90 leading-relaxed">
                  {translation || 'Tradução não disponível.'}
                </p>
              )}
              
              {translationError && !isTranslating && (
                <button
                  onClick={() => {
                    setTranslation('');
                    setTranslationError(false);
                    handleTranslation();
                  }}
                  className="mt-2 text-xs text-primary hover:text-primary-dark underline"
                >
                  Tentar novamente
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcription popup */}
        <AnimatePresence>
          {showTranscription && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-2 p-3 bg-charcoal/80 backdrop-blur-sm rounded-xl border border-white/20"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Mic size={12} className="text-primary" />
                <span className="text-xs text-primary font-medium">Transcription</span>
              </div>
              <p className="text-sm text-white/90">
                {transcription}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🆕 Technical Feedback popup */}
        <AnimatePresence>
          {showTechnicalFeedback && message.technicalFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-2 p-4 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm rounded-xl border border-primary/30"
            >
              <div className="flex items-center space-x-2 mb-3">
                <Volume2 size={14} className="text-primary" />
                <span className="text-sm text-primary font-semibold">Pronunciation Analysis</span>
              </div>
              <div className="prose prose-sm prose-invert max-w-none">
                <div 
                  className="text-sm text-white/90 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: message.technicalFeedback.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>') 
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timestamp */}
        <p className="text-xs text-white/40 mt-1 px-1">
          {message.timestamp?.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </motion.div>
  );
};

// Main ChatBox component
const ChatBox: React.FC<ChatBoxProps> = ({ 
  messages, 
  transcript, 
  finalTranscript, 
  isProcessingMessage, 
  userLevel 
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(scrollToBottom, [messages, isProcessingMessage]);

  // Detectar se é iOS PWA
  const isIOSPWA = typeof window !== 'undefined' && 
    ((window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches);

  return (
    <div 
      className="flex-1 px-3 sm:px-4 py-2 sm:py-4 chat-scroll" 
      style={{ 
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none',
        paddingTop: 'calc(3.5rem + env(safe-area-inset-top))', // Espaço para header
        paddingBottom: 'calc(100px + env(safe-area-inset-bottom))', // Espaço para footer
        overflowY: (messages.length > 3 || isProcessingMessage || transcript || finalTranscript) ? 'auto' : 'hidden' // Scroll apenas quando necessário
      }}
    >
      <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 min-h-full flex flex-col justify-end">
        {/* Messages */}
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              userLevel={userLevel}
            />
          ))}
        </AnimatePresence>

        {/* Loading indicators */}
        <AnimatePresence>
          {isProcessingMessage && (
            <>
              {/* Para mensagens de áudio, sempre mostrar typing indicator */}
              {messages[messages.length - 1]?.audioUrl || messages[messages.length - 1]?.audioBlob ? (
                <TypingIndicator />
              ) : (
                <TypingIndicator />
              )}
            </>
          )}
        </AnimatePresence>

        {/* Voice transcript display */}
        {(transcript || finalTranscript) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-primary/10 backdrop-blur-sm rounded-xl p-3 mb-4 border border-primary/20"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Mic size={14} className="text-primary" />
              <span className="text-xs text-primary font-medium">Listening...</span>
            </div>
            <p className="text-sm text-white">
              <span className="text-white/50">{transcript}</span>
              <span className="text-white font-medium">{finalTranscript}</span>
            </p>
          </motion.div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatBox;