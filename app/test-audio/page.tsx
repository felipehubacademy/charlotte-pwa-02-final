'use client';

import { useState, useRef } from 'react';

export default function TestAudioPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const testAzureSpeech = async () => {
    if (!audioBlob) return;

    setIsLoading(true);
    setTestResult(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'test-audio.webm');
      formData.append('referenceText', 'Hi there, how\'s it going?');

      const response = await fetch('/api/test-azure-speech', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setTestResult({ azureSpeechTest: result });
    } catch (error) {
      console.error('Azure Speech test failed:', error);
      setTestResult({ azureSpeechTest: { error: 'Test failed', details: error } });
    } finally {
      setIsLoading(false);
    }
  };

  const testAudio = async () => {
    if (!audioBlob) return;

    setIsLoading(true);
    setTestResult(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'test-audio.webm');

      const response = await fetch('/api/audio-pipeline-test', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({ error: 'Test failed', details: error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">Audio Pipeline Test</h1>
        
        <div className="space-y-6">
          {/* Recording Controls */}
          <div className="bg-charcoal p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-4">1. Record Audio</h2>
            <div className="flex space-x-4">
              <button
                onClick={startRecording}
                disabled={isRecording}
                className="px-4 py-2 bg-primary text-black rounded disabled:opacity-50"
              >
                {isRecording ? 'Recording...' : 'Start Recording'}
              </button>
              
              <button
                onClick={stopRecording}
                disabled={!isRecording}
                className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
              >
                Stop Recording
              </button>
            </div>
            
            {audioBlob && (
              <div className="mt-4">
                <p className="text-green-400">✅ Audio recorded ({Math.round(audioBlob.size / 1024)}KB)</p>
                <audio controls src={URL.createObjectURL(audioBlob)} className="mt-2" />
              </div>
            )}
          </div>

          {/* Test Controls */}
          <div className="bg-charcoal p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-4">2. Test Pipeline</h2>
            <div className="space-x-4">
              <button
                onClick={testAudio}
                disabled={!audioBlob || isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                {isLoading ? 'Testing...' : 'Test Audio Pipeline'}
              </button>
              
              <button
                onClick={testAzureSpeech}
                disabled={!audioBlob || isLoading}
                className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
              >
                {isLoading ? 'Testing...' : 'Test Azure Speech SDK'}
              </button>
            </div>
          </div>

          {/* Results */}
          {testResult && (
            <div className="bg-charcoal p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4">3. Results</h2>
              <pre className="text-sm text-white bg-black p-4 rounded overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 