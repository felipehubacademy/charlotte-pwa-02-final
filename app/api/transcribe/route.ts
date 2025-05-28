// app/api/transcribe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Verificar se a API key está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Obter o FormData do request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Verificar tipo de arquivo
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please provide an audio file.' },
        { status: 400 }
      );
    }

    console.log('Processing audio file:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // Transcrever com Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Forçar inglês para prática
      response_format: 'json',
      temperature: 0.2, // Mais preciso
    });

    console.log('Transcription result:', transcription.text);

    return NextResponse.json({
      transcription: transcription.text,
      success: true
    });

  } catch (error: any) {
    console.error('Transcription error:', error);
    
    // Diferentes tipos de erro
    if (error?.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI quota exceeded. Please check your billing.' },
        { status: 402 }
      );
    }
    
    if (error?.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to transcribe audio', 
        details: error?.message || 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Configurar o tamanho máximo do arquivo (10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}