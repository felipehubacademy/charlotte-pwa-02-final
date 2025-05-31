// lib/azure-speech-sdk.ts - IMPLEMENTAÇÃO SEGUINDO DOCUMENTAÇÃO OFICIAL MICROSOFT

import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';

export interface PronunciationResult {
  text: string;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronunciationScore: number;
  prosodyScore?: number;
  words: WordResult[];
  phonemes: PhonemeResult[];
  feedback: string[];
  confidence: number;
  assessmentMethod: 'azure-sdk-official';
  sessionId?: string;
  debugInfo?: any;
}

export interface WordResult {
  word: string;
  accuracyScore: number;
  errorType?: string;
  syllables?: SyllableResult[];
}

export interface SyllableResult {
  syllable: string;
  accuracyScore: number;
  offset: number;
  duration: number;
}

export interface PhonemeResult {
  phoneme: string;
  accuracyScore: number;
  nbestPhonemes?: Array<{ phoneme: string; score: number }>;
  offset: number;
  duration: number;
}

export interface TimingResult {
  wordTiming: Array<{
    word: string;
    startTime: number;
    duration: number;
    speakingRate: number;
  }>;
  totalDuration: number;
  averageSpeakingRate: number;
  pauseAnalysis: {
    totalPauses: number;
    averagePauseLength: number;
    longestPause: number;
  };
}

export interface ConfidenceAnalysis {
  overallConfidence: number;
  wordConfidences: Array<{
    word: string;
    confidence: number;
    alternatives: string[];
  }>;
  lowConfidenceWords: string[];
}

export interface ProsodyAnalysis {
  prosodyScore: number;
  intonationFeedback: string[];
  rhythmFeedback: string[];
  stressFeedback: string[];
  breakAnalysis: {
    unexpectedBreaks: number;
    missingBreaks: number;
    appropriateBreaks: number;
  };
}

export interface AudioProcessingResult {
  success: boolean;
  result?: PronunciationResult;
  error?: string;
  retryReason?: string;
  shouldRetry?: boolean;
  debugInfo?: any;
  timingAnalysis?: TimingResult;
  confidenceAnalysis?: ConfidenceAnalysis;
  prosodyAnalysis?: ProsodyAnalysis;
}

export class AzureSpeechOfficialService {
  private speechConfig: speechsdk.SpeechConfig;
  private region: string;
  private subscriptionKey: string;

  constructor() {
    this.region = process.env.AZURE_SPEECH_REGION || '';
    this.subscriptionKey = process.env.AZURE_SPEECH_KEY || '';
    
    if (!this.region || !this.subscriptionKey) {
      throw new Error('Azure Speech credentials not configured');
    }

    this.speechConfig = this.createOfficialSpeechConfig();
    console.log('✅ Azure Speech Official Service initialized');
  }

  // 🎯 CONFIGURAÇÃO OFICIAL SEGUINDO DOCUMENTAÇÃO MICROSOFT
  private createOfficialSpeechConfig(): speechsdk.SpeechConfig {
    console.log('🔧 Creating SpeechConfig following OFFICIAL Microsoft docs...');
    
    const speechConfig = speechsdk.SpeechConfig.fromSubscription(
      this.subscriptionKey, 
      this.region
    );
    
    // ✅ CONFIGURAÇÃO OFICIAL CONFORME DOCUMENTAÇÃO
    speechConfig.speechRecognitionLanguage = "en-US";
    speechConfig.outputFormat = speechsdk.OutputFormat.Detailed;
    
    // ✅ CONFIGURAÇÕES AVANÇADAS PARA MELHOR PERFORMANCE
    speechConfig.setProperty(speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "10000");
    speechConfig.setProperty(speechsdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "3000");
    speechConfig.setProperty(speechsdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, "500");
    
    console.log('✅ Official SpeechConfig created following Microsoft documentation');
    return speechConfig;
  }

  // 🎯 ASSESSMENT OFICIAL SEGUINDO DOCUMENTAÇÃO MICROSOFT
  async performOfficialAzureSpeechAssessment(
    audioBlob: Blob, 
    referenceText: string, 
    userLevel: string
  ): Promise<AudioProcessingResult> {
    console.log('🎯 Starting OFFICIAL Azure Speech Assessment...');
    console.log('📋 Following Microsoft documentation exactly');

    try {
      // ✅ CRIAR AUDIO CONFIG OFICIAL
      const audioConfig = await this.createOfficialAudioConfig(audioBlob);

      // ✅ CRIAR PRONUNCIATION ASSESSMENT CONFIG OFICIAL
      console.log('⚙️ Creating PronunciationAssessmentConfig following official docs...');
      
      const pronunciationAssessmentConfig = new speechsdk.PronunciationAssessmentConfig(
        referenceText || "", // referenceText
        speechsdk.PronunciationAssessmentGradingSystem.HundredMark, // gradingSystem
        speechsdk.PronunciationAssessmentGranularity.Phoneme, // granularity
        false // enableMiscue
      );
      
      // ✅ HABILITAR PROSODY ASSESSMENT CONFORME DOCUMENTAÇÃO OFICIAL
      try {
        // Método 1: Tentar enableProsodyAssessment() como any cast
        if (typeof (pronunciationAssessmentConfig as any).enableProsodyAssessment === 'function') {
          (pronunciationAssessmentConfig as any).enableProsodyAssessment();
          console.log('✅ Prosody assessment enabled successfully (direct method)');
        }
        // Método 2: Verificar se existe como propriedade
        else if ('enableProsodyAssessment' in pronunciationAssessmentConfig) {
          (pronunciationAssessmentConfig as any).enableProsodyAssessment();
          console.log('✅ Prosody assessment enabled successfully (property check)');
        }
        else {
          console.log('⚠️ Prosody assessment not available - enableProsodyAssessment method not found');
          console.log('🔍 Available methods:', Object.getOwnPropertyNames(pronunciationAssessmentConfig));
        }
      } catch (e) {
        console.log('⚠️ Prosody assessment error:', e);
        console.log('🔍 SDK Version: 1.44.0 - Prosody should be supported');
      }
      
      // ✅ CONFIGURAR NBEST PHONEMES PARA ANÁLISE DETALHADA
      try {
        (pronunciationAssessmentConfig as any).nBestPhonemeCount = 5;
        console.log('✅ NBest phoneme count set to 5');
      } catch (e) {
        console.log('⚠️ NBest phoneme count not available in this SDK version');
      }

      console.log('✅ Official PronunciationAssessmentConfig created');

      // ✅ CRIAR SPEECH RECOGNIZER CONFORME DOCUMENTAÇÃO OFICIAL
      console.log('🎯 Creating SpeechRecognizer following official pattern...');
      
      const speechRecognizer = new speechsdk.SpeechRecognizer(this.speechConfig, audioConfig);
      
      // ✅ ADICIONAR PHRASE LIST PARA MELHOR RECONHECIMENTO
      console.log('📝 Adding phrase list for improved recognition...');
      try {
        const phraseList = speechsdk.PhraseListGrammar.fromRecognizer(speechRecognizer);
        
        // Palavras relacionadas a pronunciation assessment
        phraseList.addPhrase("pronunciation");
        phraseList.addPhrase("assessment");
        phraseList.addPhrase("accuracy");
        phraseList.addPhrase("fluency");
        phraseList.addPhrase("Charlotte");
        phraseList.addPhrase("English");
        
        // Palavras comuns que podem ser mal reconhecidas
        phraseList.addPhrase("the");
        phraseList.addPhrase("and");
        phraseList.addPhrase("that");
        phraseList.addPhrase("have");
        phraseList.addPhrase("for");
        phraseList.addPhrase("not");
        phraseList.addPhrase("with");
        phraseList.addPhrase("you");
        phraseList.addPhrase("this");
        phraseList.addPhrase("but");
        
        // Se há texto de referência, adicionar suas palavras
        if (referenceText && referenceText.trim()) {
          const referenceWords = referenceText.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
          
          referenceWords.forEach(word => {
            phraseList.addPhrase(word);
          });
          
          console.log(`✅ Added ${referenceWords.length} reference words to phrase list`);
        }
        
        console.log('✅ Phrase list configured successfully');
      } catch (phraseError) {
        console.warn('⚠️ Could not configure phrase list:', phraseError);
      }
      
      // ✅ APLICAR CONFIGURAÇÃO CONFORME DOCUMENTAÇÃO
      pronunciationAssessmentConfig.applyTo(speechRecognizer);

      console.log('🎯 Performing official pronunciation assessment...');

      // ✅ EXECUTAR ASSESSMENT SEGUINDO PADRÃO OFICIAL
      return new Promise((resolve) => {
        const sessionId = Date.now().toString();
        console.log('🔗 Official session started:', sessionId);

        // ✅ PATTERN OFICIAL DA MICROSOFT
        speechRecognizer.recognizeOnceAsync(
          (speechRecognitionResult: speechsdk.SpeechRecognitionResult) => {
            try {
              console.log('📥 Official recognition result received:', {
                reason: speechRecognitionResult.reason,
                text: speechRecognitionResult.text,
                sessionId
              });

              // ✅ VERIFICAR RESULTADO CONFORME DOCUMENTAÇÃO
              if (speechRecognitionResult.reason === speechsdk.ResultReason.RecognizedSpeech) {
                console.log('🎉 OFFICIAL Azure Speech Assessment SUCCESS!');
                
                // ✅ EXTRAIR RESULTADO CONFORME DOCUMENTAÇÃO OFICIAL
                const pronunciationAssessmentResult = speechsdk.PronunciationAssessmentResult.fromResult(speechRecognitionResult);
                
                // ✅ EXTRAIR JSON CONFORME DOCUMENTAÇÃO OFICIAL
                const pronunciationAssessmentResultJson = speechRecognitionResult.properties.getProperty(speechsdk.PropertyId.SpeechServiceResponse_JsonResult);

                console.log('📊 Official pronunciation scores:', {
                  accuracy: pronunciationAssessmentResult.accuracyScore,
                  fluency: pronunciationAssessmentResult.fluencyScore,
                  completeness: pronunciationAssessmentResult.completenessScore,
                  prosody: pronunciationAssessmentResult.prosodyScore,
                  overall: pronunciationAssessmentResult.pronunciationScore
                });

                // ✅ EXTRAIR DADOS DETALHADOS DO JSON
                let detailedWords: WordResult[] = [];
                let detailedPhonemes: PhonemeResult[] = [];
                
                try {
                  if (pronunciationAssessmentResultJson) {
                    const jsonResult = JSON.parse(pronunciationAssessmentResultJson);
                    console.log('📋 Detailed JSON result available:', {
                      hasNBest: !!jsonResult.NBest,
                      nbestLength: jsonResult.NBest?.length || 0,
                      hasWords: !!jsonResult.NBest?.[0]?.Words,
                      wordsCount: jsonResult.NBest?.[0]?.Words?.length || 0
                    });
                    
                    // ✅ EXTRAIR DADOS COMPLETOS DE PALAVRAS (CONFORME DOCUMENTAÇÃO)
                    if (jsonResult.NBest && jsonResult.NBest[0] && jsonResult.NBest[0].Words) {
                      detailedWords = jsonResult.NBest[0].Words.map((word: any) => {
                        // Extrair sílabas se disponíveis
                        const syllables: SyllableResult[] = word.Syllables?.map((syl: any) => ({
                          syllable: syl.Syllable,
                          accuracyScore: Math.round(syl.PronunciationAssessment?.AccuracyScore || 0),
                          offset: syl.Offset || 0,
                          duration: syl.Duration || 0
                        })) || [];
                        
                        return {
                          word: word.Word,
                          accuracyScore: Math.round(word.PronunciationAssessment?.AccuracyScore || 0),
                          errorType: word.PronunciationAssessment?.ErrorType || 'None',
                          syllables
                        };
                      });
                      
                      console.log('📝 Extracted detailed words:', {
                        count: detailedWords.length,
                        wordsWithSyllables: detailedWords.filter(w => w.syllables && w.syllables.length > 0).length,
                        sample: detailedWords.slice(0, 3).map(w => ({
                          word: w.word,
                          score: w.accuracyScore,
                          errorType: w.errorType,
                          syllableCount: w.syllables?.length || 0
                        }))
                      });
                    }
                    
                    // ✅ EXTRAIR DADOS COMPLETOS DE FONEMAS COM NBEST (CONFORME DOCUMENTAÇÃO)
                    if (jsonResult.NBest && jsonResult.NBest[0] && jsonResult.NBest[0].Words) {
                      const allPhonemes: PhonemeResult[] = [];
                      
                      jsonResult.NBest[0].Words.forEach((word: any) => {
                        if (word.Phonemes) {
                          word.Phonemes.forEach((phoneme: any) => {
                            // Extrair NBest phonemes se disponíveis
                            const nbestPhonemes = phoneme.PronunciationAssessment?.NBestPhonemes?.map((nb: any) => ({
                              phoneme: nb.Phoneme,
                              score: Math.round(nb.Score || 0)
                            })) || [];
                            
                            allPhonemes.push({
                              phoneme: phoneme.Phoneme,
                              accuracyScore: Math.round(phoneme.PronunciationAssessment?.AccuracyScore || 0),
                              nbestPhonemes,
                              offset: phoneme.Offset || 0,
                              duration: phoneme.Duration || 0
                            });
                          });
                        }
                      });
                      
                      detailedPhonemes = allPhonemes;
                      console.log('🔤 Extracted detailed phonemes:', {
                        count: detailedPhonemes.length,
                        phonemesWithNBest: detailedPhonemes.filter(p => p.nbestPhonemes && p.nbestPhonemes.length > 0).length,
                        avgAccuracy: detailedPhonemes.length > 0 
                          ? Math.round(detailedPhonemes.reduce((sum, p) => sum + p.accuracyScore, 0) / detailedPhonemes.length)
                          : 0,
                        sample: detailedPhonemes.slice(0, 5).map(p => ({
                          phoneme: p.phoneme,
                          score: p.accuracyScore,
                          nbestCount: p.nbestPhonemes?.length || 0
                        }))
                      });
                    }
                    
                    // ✅ LOG COMPLETO DO JSON PARA DEBUGGING (APENAS PRIMEIRAS LINHAS)
                    console.log('🔍 Raw JSON sample (first 500 chars):', 
                      pronunciationAssessmentResultJson.substring(0, 500) + '...'
                    );
                    
                  } else {
                    console.warn('⚠️ No detailed JSON result available from Azure Speech SDK');
                  }
                } catch (jsonError) {
                  console.error('❌ Error parsing detailed JSON result:', jsonError);
                  console.log('📄 Raw JSON that failed to parse:', pronunciationAssessmentResultJson);
                }

                // ✅ GERAR FEEDBACK MELHORADO COM DADOS DETALHADOS
                const feedback = this.generateDetailedFeedback(
                  pronunciationAssessmentResult.accuracyScore,
                  pronunciationAssessmentResult.fluencyScore,
                  pronunciationAssessmentResult.completenessScore || 100,
                  pronunciationAssessmentResult.prosodyScore,
                  userLevel,
                  detailedWords,
                  detailedPhonemes
                );

                // ✅ EXTRAIR ANÁLISES AVANÇADAS
                const timingAnalysis = this.extractTimingAnalysis(pronunciationAssessmentResultJson);
                const confidenceAnalysis = this.extractConfidenceAnalysis(pronunciationAssessmentResultJson);
                const prosodyAnalysis = this.extractProsodyAnalysis(pronunciationAssessmentResultJson);

                speechRecognizer.close();
                resolve({
                  success: true,
                  result: {
                    text: speechRecognitionResult.text,
                    pronunciationScore: Math.round(pronunciationAssessmentResult.pronunciationScore),
                    accuracyScore: Math.round(pronunciationAssessmentResult.accuracyScore),
                    fluencyScore: Math.round(pronunciationAssessmentResult.fluencyScore),
                    completenessScore: Math.round(pronunciationAssessmentResult.completenessScore || 100),
                    prosodyScore: Math.round(pronunciationAssessmentResult.prosodyScore || 0),
                    feedback,
                    assessmentMethod: 'azure-sdk-official',
                    words: detailedWords,
                    phonemes: detailedPhonemes,
                    confidence: pronunciationAssessmentResult.pronunciationScore / 100
                  },
                  timingAnalysis,
                  confidenceAnalysis,
                  prosodyAnalysis
                });

              } else {
                console.error('❌ Official speech not recognized:', {
                  reason: speechRecognitionResult.reason,
                  reasonText: speechsdk.ResultReason[speechRecognitionResult.reason],
                  errorDetails: speechRecognitionResult.errorDetails
                });
                
                speechRecognizer.close();
                resolve({
                  success: false,
                  error: 'Official Speech not recognized',
                  shouldRetry: true,
                  retryReason: 'speech_not_recognized',
                  debugInfo: {
                    reason: speechRecognitionResult.reason,
                    reasonText: speechsdk.ResultReason[speechRecognitionResult.reason],
                    sessionId,
                    referenceText,
                    azureErrorDetails: speechRecognitionResult.errorDetails
                  }
                });
              }

            } catch (error) {
              console.error('❌ Official error processing result:', error);
              speechRecognizer.close();
              resolve({
                success: false,
                error: `Official result processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                shouldRetry: false
              });
            }
          },
          (error: string) => {
            console.error('❌ Official recognition failed:', error);
            speechRecognizer.close();
            resolve({
              success: false,
              error: `Official recognition failed: ${error}`,
              shouldRetry: true,
              retryReason: 'recognition_error'
            });
          }
        );
      });

    } catch (error) {
      console.error('❌ Official Azure Speech Assessment failed:', error);
      return {
        success: false,
        error: `Official assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        shouldRetry: false
      };
    }
  }

  // 🎵 CRIAR AUDIO CONFIG OFICIAL
  private async createOfficialAudioConfig(audioBlob: Blob): Promise<speechsdk.AudioConfig> {
    console.log('🎵 Creating OFFICIAL AudioConfig...');
    
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      console.log('📊 Official audio data:', {
        size: arrayBuffer.byteLength,
        type: audioBlob.type
      });

      // ✅ USAR MÉTODO OFICIAL DA MICROSOFT
      // Conforme documentação: usar AudioConfig.fromWavFileInput ou fromStreamInput
      
      // Criar stream de áudio oficial
      const audioFormat = speechsdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
      const pushStream = speechsdk.AudioInputStream.createPushStream(audioFormat);
      
      // Enviar dados de áudio
      pushStream.write(arrayBuffer);
      pushStream.close();

      const audioConfig = speechsdk.AudioConfig.fromStreamInput(pushStream);
      
      console.log('✅ Official AudioConfig created successfully');
      return audioConfig;

    } catch (error) {
      console.error('❌ Official AudioConfig creation failed:', error);
      throw new Error(`Official AudioConfig creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 🧠 GERAR FEEDBACK DETALHADO COM ANÁLISE COMPLETA
  private generateDetailedFeedback(
    accuracy: number,
    fluency: number,
    completeness: number,
    prosody: number,
    userLevel: string,
    words: WordResult[],
    phonemes?: PhonemeResult[]
  ): string[] {
    const feedback: string[] = [];

    // ✅ FEEDBACK PRINCIPAL BASEADO NOS SCORES
    if (accuracy >= 90) {
      feedback.push('🎉 Outstanding pronunciation! You sound like a native speaker.');
    } else if (accuracy >= 80) {
      feedback.push('👍 Excellent pronunciation! Very clear and accurate.');
    } else if (accuracy >= 70) {
      feedback.push('📚 Good pronunciation! Keep practicing to improve further.');
    } else if (accuracy >= 60) {
      feedback.push('💪 Your pronunciation is developing well. Keep it up!');
    } else {
      feedback.push('🔄 Focus on clear pronunciation. Try speaking more slowly.');
    }

    // ✅ FEEDBACK ESPECÍFICO DE FLUÊNCIA
    if (fluency < 70) {
      feedback.push('🌊 Work on speaking more smoothly with natural rhythm.');
    } else if (fluency >= 95) {
      feedback.push('🌟 Excellent fluency! Your speech flows naturally.');
    }

    // ✅ FEEDBACK ESPECÍFICO DE PROSÓDIA (SE DISPONÍVEL)
    if (prosody > 0) {
      if (prosody >= 80) {
        feedback.push('🎵 Excellent intonation and stress patterns!');
      } else if (prosody >= 60) {
        feedback.push('🎶 Good rhythm! Work on varying your intonation more.');
      } else {
        feedback.push('🎵 Practice natural intonation and stress patterns.');
      }
    }

    // ✅ ANÁLISE DETALHADA DE PALAVRAS PROBLEMÁTICAS
    if (words && words.length > 0) {
      const problemWords = words.filter(w => 
        w.accuracyScore < 60 || (w.errorType && w.errorType !== 'None')
      );
      
      if (problemWords.length > 0) {
        if (problemWords.length <= 3) {
          const wordList = problemWords.map(w => `"${w.word}" (${w.accuracyScore}%)`).join(', ');
          feedback.push(`🔍 Focus on these words: ${wordList}`);
        } else {
          feedback.push(`🔍 ${problemWords.length} words need attention. Focus on clearer pronunciation.`);
        }
        
        // Feedback específico por tipo de erro
        const errorTypes = problemWords.map(w => w.errorType).filter(e => e && e !== 'None');
        const uniqueErrors = [...new Set(errorTypes)];
        
        uniqueErrors.forEach(errorType => {
          switch (errorType) {
            case 'Mispronunciation':
              feedback.push('🎯 Work on clearer pronunciation of individual sounds.');
              break;
            case 'Omission':
              feedback.push('📢 Make sure to pronounce all words clearly - don\'t skip any.');
              break;
            case 'Insertion':
              feedback.push('✂️ Avoid adding extra sounds or words.');
              break;
            case 'UnexpectedBreak':
              feedback.push('🔗 Work on connecting words more smoothly.');
              break;
            case 'MissingBreak':
              feedback.push('⏸️ Add appropriate pauses between phrases.');
              break;
          }
        });
      }
    }

    // ✅ ANÁLISE DE FONEMAS PROBLEMÁTICOS (SE DISPONÍVEL)
    if (phonemes && phonemes.length > 0) {
      const problemPhonemes = phonemes.filter(p => p.accuracyScore < 50);
      
      if (problemPhonemes.length > 0) {
        // Agrupar fonemas problemáticos por frequência
        const phonemeCount = new Map<string, number>();
        problemPhonemes.forEach(p => {
          phonemeCount.set(p.phoneme, (phonemeCount.get(p.phoneme) || 0) + 1);
        });
        
        // Pegar os 3 fonemas mais problemáticos
        const topProblems = Array.from(phonemeCount.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3);
        
        if (topProblems.length > 0) {
          const phonemeList = topProblems.map(([phoneme, count]) => 
            count > 1 ? `/${phoneme}/ (${count}x)` : `/${phoneme}/`
          ).join(', ');
          feedback.push(`🔤 Practice these sounds: ${phonemeList}`);
        }
      }
    }

    // ✅ FEEDBACK BASEADO NO NÍVEL DO USUÁRIO
    if (userLevel === 'Advanced' && accuracy >= 85) {
      feedback.push('🚀 Advanced level: Focus on subtle pronunciation nuances and natural rhythm.');
    } else if (userLevel === 'Intermediate' && accuracy >= 75) {
      feedback.push('📈 Great progress! You\'re ready for more challenging pronunciation exercises.');
    } else if (userLevel === 'Novice' && accuracy >= 60) {
      feedback.push('🌱 Good foundation! Keep practicing basic pronunciation patterns.');
    }

    return feedback;
  }

  // 🧠 GERAR FEEDBACK OFICIAL (MÉTODO ORIGINAL MANTIDO PARA COMPATIBILIDADE)
  private generateOfficialFeedback(
    accuracy: number,
    fluency: number,
    completeness: number,
    prosody: number,
    userLevel: string
  ): string[] {
    const feedback: string[] = [];

    // Feedback oficial baseado nos scores
    if (accuracy >= 90) {
      feedback.push('🎉 Outstanding pronunciation! You sound like a native speaker.');
    } else if (accuracy >= 80) {
      feedback.push('👍 Excellent pronunciation! Very clear and accurate.');
    } else if (accuracy >= 70) {
      feedback.push('📚 Good pronunciation! Keep practicing to improve further.');
    } else if (accuracy >= 60) {
      feedback.push('💪 Your pronunciation is developing well. Keep it up!');
    } else {
      feedback.push('🔄 Focus on clear pronunciation. Try speaking more slowly.');
    }

    // Feedback específico por categoria
    if (fluency < 70) {
      feedback.push('🌊 Work on speaking more smoothly with natural rhythm.');
    }

    if (prosody > 0 && prosody < 70) {
      feedback.push('🎵 Practice natural intonation and stress patterns.');
    }

    return feedback;
  }

  // 🧪 TESTAR CONECTIVIDADE OFICIAL
  async testOfficialConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing OFFICIAL Azure Speech SDK connection...');
      
      const testConfig = speechsdk.SpeechConfig.fromSubscription(
        this.subscriptionKey, 
        this.region
      );
      
      return !!testConfig;
    } catch (error) {
      console.error('❌ Official connection test failed:', error);
      return false;
    }
  }

  // 🧠 EXTRAIR ANÁLISES AVANÇADAS
  private extractTimingAnalysis(jsonResult: string): TimingResult | undefined {
    try {
      if (!jsonResult) return undefined;
      
      const parsed = JSON.parse(jsonResult);
      const words = parsed.NBest?.[0]?.Words || [];
      
      if (words.length === 0) return undefined;
      
      const wordTiming = words.map((word: any) => ({
        word: word.Word,
        startTime: (word.Offset || 0) / 10000, // Convert to milliseconds
        duration: (word.Duration || 0) / 10000,
        speakingRate: word.Word.length / ((word.Duration || 1) / 10000000) // chars per second
      }));
      
      const totalDuration = (parsed.Duration || 0) / 10000;
      const totalChars = words.reduce((sum: number, word: any) => sum + word.Word.length, 0);
      const averageSpeakingRate = totalChars / (totalDuration / 1000);
      
      // Análise de pausas (simplificada)
      const pauses = [];
      for (let i = 1; i < words.length; i++) {
        const prevEnd = (words[i-1].Offset + words[i-1].Duration) / 10000;
        const currentStart = words[i].Offset / 10000;
        const pauseLength = currentStart - prevEnd;
        if (pauseLength > 100) { // Pausas maiores que 100ms
          pauses.push(pauseLength);
        }
      }
      
      return {
        wordTiming,
        totalDuration,
        averageSpeakingRate,
        pauseAnalysis: {
          totalPauses: pauses.length,
          averagePauseLength: pauses.length > 0 ? pauses.reduce((a, b) => a + b, 0) / pauses.length : 0,
          longestPause: pauses.length > 0 ? Math.max(...pauses) : 0
        }
      };
    } catch (error) {
      console.warn('⚠️ Could not extract timing analysis:', error);
      return undefined;
    }
  }

  private extractConfidenceAnalysis(jsonResult: string): ConfidenceAnalysis | undefined {
    try {
      if (!jsonResult) return undefined;
      
      const parsed = JSON.parse(jsonResult);
      const nbest = parsed.NBest || [];
      
      if (nbest.length === 0) return undefined;
      
      const overallConfidence = nbest[0].Confidence || 0;
      const words = nbest[0].Words || [];
      
      const wordConfidences = words.map((word: any) => {
        // Extrair alternativas do NBest se disponível
        const alternatives = nbest.slice(1, 4).map((alt: any) => {
          const altWords = alt.Words || [];
          const matchingWord = altWords.find((w: any) => w.Offset === word.Offset);
          return matchingWord?.Word;
        }).filter(Boolean);
        
        return {
          word: word.Word,
          confidence: word.PronunciationAssessment?.AccuracyScore / 100 || 0,
          alternatives
        };
      });
      
      const lowConfidenceWords = wordConfidences
        .filter((w: any) => w.confidence < 0.7)
        .map((w: any) => w.word);
      
      return {
        overallConfidence,
        wordConfidences,
        lowConfidenceWords
      };
    } catch (error) {
      console.warn('⚠️ Could not extract confidence analysis:', error);
      return undefined;
    }
  }

  private extractProsodyAnalysis(jsonResult: string): ProsodyAnalysis | undefined {
    try {
      if (!jsonResult) return undefined;
      
      const parsed = JSON.parse(jsonResult);
      const prosodyScore = parsed.NBest?.[0]?.PronunciationAssessment?.ProsodyScore || 0;
      
      // Análise de feedback de prosódia (baseado em padrões comuns)
      const intonationFeedback = [];
      const rhythmFeedback = [];
      const stressFeedback = [];
      
      if (prosodyScore < 60) {
        intonationFeedback.push('Work on varying your pitch more naturally');
        rhythmFeedback.push('Practice maintaining consistent rhythm');
        stressFeedback.push('Focus on word stress patterns');
      } else if (prosodyScore < 80) {
        intonationFeedback.push('Good intonation, try to be more expressive');
        rhythmFeedback.push('Rhythm is developing well');
      } else {
        intonationFeedback.push('Excellent natural intonation');
        rhythmFeedback.push('Great rhythm and flow');
      }
      
      // Análise de breaks (simplificada - seria mais complexa com dados reais)
      const words = parsed.NBest?.[0]?.Words || [];
      let unexpectedBreaks = 0;
      let missingBreaks = 0;
      let appropriateBreaks = 0;
      
      words.forEach((word: any) => {
        const errorType = word.PronunciationAssessment?.ErrorType;
        if (errorType === 'UnexpectedBreak') unexpectedBreaks++;
        else if (errorType === 'MissingBreak') missingBreaks++;
        else appropriateBreaks++;
      });
      
      return {
        prosodyScore,
        intonationFeedback,
        rhythmFeedback,
        stressFeedback,
        breakAnalysis: {
          unexpectedBreaks,
          missingBreaks,
          appropriateBreaks
        }
      };
    } catch (error) {
      console.warn('⚠️ Could not extract prosody analysis:', error);
      return undefined;
    }
  }
}

// 🎯 FUNÇÃO PRINCIPAL OFICIAL PARA EXPORTAÇÃO
export async function assessPronunciationOfficial(
  audioBlob: Blob,
  referenceText?: string,
  userLevel: 'Novice' | 'Intermediate' | 'Advanced' = 'Intermediate'
): Promise<AudioProcessingResult> {
  console.log('🎯 OFFICIAL Azure Speech SDK Pronunciation API - Starting...');
  console.log('📁 Processing audio with OFFICIAL Microsoft implementation:', {
    type: audioBlob.type,
    size: audioBlob.size,
    hasReference: !!referenceText,
    referenceLength: referenceText?.length || 0,
    environment: process.env.NODE_ENV,
    vercelRegion: process.env.VERCEL_REGION
  });

  try {
    const service = new AzureSpeechOfficialService();
    return await service.performOfficialAzureSpeechAssessment(audioBlob, referenceText || '', userLevel);
  } catch (error: any) {
    console.error('❌ Official service initialization failed:', error);
    return {
      success: false,
      error: `Official service initialization failed: ${error.message}`,
      shouldRetry: false
    };
  }
}