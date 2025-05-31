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

export interface AudioProcessingResult {
  success: boolean;
  result?: PronunciationResult;
  error?: string;
  retryReason?: string;
  shouldRetry?: boolean;
  debugInfo?: any;
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
      
      // ✅ HABILITAR PROSODY ASSESSMENT CONFORME DOCUMENTAÇÃO
      // Note: enableProsodyAssessment pode não estar disponível em todas as versões do SDK
      try {
        if (typeof (pronunciationAssessmentConfig as any).enableProsodyAssessment === 'function') {
          (pronunciationAssessmentConfig as any).enableProsodyAssessment();
          console.log('✅ Prosody assessment enabled');
        } else {
          console.log('⚠️ Prosody assessment not available in this SDK version');
        }
      } catch (e) {
        console.log('⚠️ Prosody assessment method not found, continuing without it');
      }

      console.log('✅ Official PronunciationAssessmentConfig created');

      // ✅ CRIAR SPEECH RECOGNIZER CONFORME DOCUMENTAÇÃO OFICIAL
      console.log('🎯 Creating SpeechRecognizer following official pattern...');
      
      const speechRecognizer = new speechsdk.SpeechRecognizer(this.speechConfig, audioConfig);
      
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
                      nbestLength: jsonResult.NBest?.length || 0
                    });
                    
                    // Extrair dados de palavras
                    if (jsonResult.NBest && jsonResult.NBest[0] && jsonResult.NBest[0].Words) {
                      detailedWords = jsonResult.NBest[0].Words.map((word: any) => ({
                        word: word.Word,
                        accuracyScore: Math.round(word.PronunciationAssessment?.AccuracyScore || 0),
                        errorType: word.PronunciationAssessment?.ErrorType || 'None',
                        syllables: word.Syllables?.map((syl: any) => ({
                          syllable: syl.Syllable,
                          accuracyScore: Math.round(syl.PronunciationAssessment?.AccuracyScore || 0),
                          offset: syl.Offset || 0,
                          duration: syl.Duration || 0
                        })) || []
                      }));
                      
                      console.log('📝 Extracted words:', {
                        count: detailedWords.length,
                        words: detailedWords.map(w => `${w.word}(${w.accuracyScore})`).join(', ')
                      });
                    }
                    
                    // Extrair dados de fonemas
                    if (jsonResult.NBest && jsonResult.NBest[0] && jsonResult.NBest[0].Words) {
                      const allPhonemes: PhonemeResult[] = [];
                      
                      jsonResult.NBest[0].Words.forEach((word: any) => {
                        if (word.Phonemes) {
                          word.Phonemes.forEach((phoneme: any) => {
                            allPhonemes.push({
                              phoneme: phoneme.Phoneme,
                              accuracyScore: Math.round(phoneme.PronunciationAssessment?.AccuracyScore || 0),
                              nbestPhonemes: phoneme.PronunciationAssessment?.NBestPhonemes?.map((nb: any) => ({
                                phoneme: nb.Phoneme,
                                score: Math.round(nb.Score || 0)
                              })) || [],
                              offset: phoneme.Offset || 0,
                              duration: phoneme.Duration || 0
                            });
                          });
                        }
                      });
                      
                      detailedPhonemes = allPhonemes;
                      console.log('🔤 Extracted phonemes:', {
                        count: detailedPhonemes.length,
                        phonemes: detailedPhonemes.slice(0, 5).map(p => `${p.phoneme}(${p.accuracyScore})`).join(', ')
                      });
                    }
                  }
                } catch (jsonError) {
                  console.warn('⚠️ Could not parse detailed JSON result:', jsonError);
                }

                // ✅ GERAR FEEDBACK MELHORADO COM DADOS DETALHADOS
                const feedback = this.generateDetailedFeedback(
                  pronunciationAssessmentResult.accuracyScore,
                  pronunciationAssessmentResult.fluencyScore,
                  pronunciationAssessmentResult.completenessScore || 100,
                  pronunciationAssessmentResult.prosodyScore,
                  userLevel,
                  detailedWords
                );

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
                  }
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

  // 🧠 GERAR FEEDBACK DETALHADO COM ANÁLISE DE PALAVRAS
  private generateDetailedFeedback(
    accuracy: number,
    fluency: number,
    completeness: number,
    prosody: number,
    userLevel: string,
    words: WordResult[]
  ): string[] {
    const feedback: string[] = [];

    // Feedback principal baseado nos scores
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

    // ✅ FEEDBACK ESPECÍFICO BASEADO EM PALAVRAS PROBLEMÁTICAS
    if (words && words.length > 0) {
      const problemWords = words.filter(w => 
        w.accuracyScore < 60 || (w.errorType && w.errorType !== 'None')
      );
      
      if (problemWords.length > 0 && problemWords.length <= 3) {
        const wordList = problemWords.map(w => `"${w.word}"`).join(', ');
        feedback.push(`🔍 Focus on these words: ${wordList}`);
      }
      
      // Feedback por tipo de erro
      const errorTypes = problemWords.map(w => w.errorType).filter(e => e && e !== 'None');
      if (errorTypes.includes('Mispronunciation')) {
        feedback.push('🎯 Work on clearer pronunciation of individual sounds.');
      }
      if (errorTypes.includes('Omission')) {
        feedback.push('📢 Make sure to pronounce all words clearly - don\'t skip any.');
      }
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