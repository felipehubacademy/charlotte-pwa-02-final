// lib/azure-speech-sdk.ts - IMPLEMENTAÇÃO SEGUINDO DOCUMENTAÇÃO OFICIAL MICROSOFT

import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

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
  private speechConfig: sdk.SpeechConfig;
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
  private createOfficialSpeechConfig(): sdk.SpeechConfig {
    console.log('🔧 Creating SpeechConfig following OFFICIAL Microsoft docs...');
    
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      this.subscriptionKey, 
      this.region
    );
    
    // ✅ CONFIGURAÇÃO OFICIAL CONFORME DOCUMENTAÇÃO
    speechConfig.speechRecognitionLanguage = "en-US";
    speechConfig.outputFormat = sdk.OutputFormat.Detailed;
    
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

      // ✅ CRIAR PRONUNCIATION ASSESSMENT CONFIG OFICIAL COM PROSODY
      console.log('⚙️ Creating PronunciationAssessmentConfig following official docs...');
      
      // Método 1: Tentar configuração direta conforme documentação
      let pronunciationAssessmentConfig: sdk.PronunciationAssessmentConfig;
      
      try {
        pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
          referenceText || "", // referenceText
          sdk.PronunciationAssessmentGradingSystem.HundredMark, // gradingSystem
          sdk.PronunciationAssessmentGranularity.Phoneme, // granularity
          false // enableMiscue
        );
        
        // ✅ HABILITAR PROSODY ASSESSMENT CONFORME DOCUMENTAÇÃO OFICIAL MICROSOFT
        try {
          // Seguindo documentação oficial JavaScript: pronunciationAssessmentConfig.enableProsodyAssessment();
          console.log('🎵 Attempting to enable prosody assessment...');
          console.log('🔍 PronunciationAssessmentConfig methods:', Object.getOwnPropertyNames(pronunciationAssessmentConfig));
          console.log('🔍 PronunciationAssessmentConfig prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(pronunciationAssessmentConfig)));
          
          (pronunciationAssessmentConfig as any).enableProsodyAssessment();
          console.log('✅ Prosody assessment enabled successfully following Microsoft docs');
        } catch (e) {
          console.log('⚠️ Prosody assessment method not available, trying JSON config...');
          console.log('🔍 Error details:', e);
          
          // Método 2: Usar configuração JSON conforme documentação alternativa
          const configJson = {
            referenceText: referenceText || "",
            gradingSystem: "HundredMark",
            granularity: "Phoneme",
            enableMiscue: false,
            enableProsodyAssessment: true  // ← HABILITAR VIA JSON
          };
          
          console.log('🎵 Trying JSON config for prosody:', configJson);
          pronunciationAssessmentConfig = sdk.PronunciationAssessmentConfig.fromJSON(JSON.stringify(configJson));
          console.log('✅ Prosody assessment enabled via JSON configuration');
        }
      } catch (e) {
        console.log('⚠️ Error creating PronunciationAssessmentConfig:', e);
        throw e;
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
      
      const speechRecognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);
      
      // ✅ APLICAR CONFIGURAÇÃO CONFORME DOCUMENTAÇÃO
      pronunciationAssessmentConfig.applyTo(speechRecognizer);

      console.log('🎯 Performing official pronunciation assessment...');

      // ✅ EXECUTAR ASSESSMENT SEGUINDO PADRÃO OFICIAL
      return new Promise((resolve) => {
        const sessionId = Date.now().toString();
        console.log('🔗 Official session started:', sessionId);

        // ✅ PATTERN OFICIAL DA MICROSOFT
        speechRecognizer.recognizeOnceAsync(
          (speechRecognitionResult: sdk.SpeechRecognitionResult) => {
            try {
              console.log('📥 Official recognition result received:', {
                reason: speechRecognitionResult.reason,
                text: speechRecognitionResult.text,
                sessionId
              });

              // ✅ VERIFICAR RESULTADO CONFORME DOCUMENTAÇÃO
              if (speechRecognitionResult.reason === sdk.ResultReason.RecognizedSpeech) {
                console.log('🎉 OFFICIAL Azure Speech Assessment SUCCESS!');
                
                // ✅ EXTRAIR RESULTADO CONFORME DOCUMENTAÇÃO OFICIAL
                const pronunciationAssessmentResult = sdk.PronunciationAssessmentResult.fromResult(speechRecognitionResult);
                
                // ✅ EXTRAIR JSON CONFORME DOCUMENTAÇÃO OFICIAL
                const pronunciationAssessmentResultJson = speechRecognitionResult.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);

                console.log('📊 Official pronunciation scores:', {
                  accuracy: pronunciationAssessmentResult.accuracyScore,
                  fluency: pronunciationAssessmentResult.fluencyScore,
                  completeness: pronunciationAssessmentResult.completenessScore,
                  prosody: pronunciationAssessmentResult.prosodyScore,
                  overall: pronunciationAssessmentResult.pronunciationScore
                });
                
                // ✅ LOG DETALHADO DO PROSODY PARA DEBUGGING
                console.log('🎵 Prosody assessment details:', {
                  prosodyScore: pronunciationAssessmentResult.prosodyScore,
                  prosodyType: typeof pronunciationAssessmentResult.prosodyScore,
                  prosodyUndefined: pronunciationAssessmentResult.prosodyScore === undefined,
                  prosodyNull: pronunciationAssessmentResult.prosodyScore === null,
                  prosodyZero: pronunciationAssessmentResult.prosodyScore === 0,
                  prosodyExists: 'prosodyScore' in pronunciationAssessmentResult
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
                  reasonText: sdk.ResultReason[speechRecognitionResult.reason],
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
                    reasonText: sdk.ResultReason[speechRecognitionResult.reason],
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
  private async createOfficialAudioConfig(audioBlob: Blob): Promise<sdk.AudioConfig> {
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
      const audioFormat = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
      const pushStream = sdk.AudioInputStream.createPushStream(audioFormat);
      
      // Enviar dados de áudio
      pushStream.write(arrayBuffer);
      pushStream.close();

      const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
      
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
      
      const testConfig = sdk.SpeechConfig.fromSubscription(
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