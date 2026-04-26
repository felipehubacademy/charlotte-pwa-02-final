// public/audio-processor.js - AudioWorklet para processamento de áudio em tempo real

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (input && input.length > 0) {
      const inputChannel = input[0];
      
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex] = inputChannel[i];
        this.bufferIndex++;
        
        // Quando o buffer estiver cheio, enviar para o main thread
        if (this.bufferIndex >= this.bufferSize) {
          // Converter Float32 para Int16 (formato esperado pelo OpenAI)
          const int16Buffer = new Int16Array(this.bufferSize);
          for (let j = 0; j < this.bufferSize; j++) {
            // Clampar valores entre -1 e 1, depois converter para Int16
            const sample = Math.max(-1, Math.min(1, this.buffer[j]));
            int16Buffer[j] = sample * 32767;
          }
          
          // Enviar dados de áudio para o main thread
          this.port.postMessage({
            type: 'audio',
            audio: int16Buffer
          });
          
          // Reset buffer
          this.bufferIndex = 0;
        }
      }
    }
    
    // Continuar processamento
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor); 