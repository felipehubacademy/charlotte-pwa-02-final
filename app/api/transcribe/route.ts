// app/api/transcribe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ GET - API status and configuration check
export async function GET() {
  try {
    // Verificar se a API key está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        status: 'error',
        message: 'OpenAI API key not configured',
        endpoint: '/api/transcribe',
        method: 'GET',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Transcribe endpoint is working',
      endpoint: '/api/transcribe',
      method: 'GET',
      supportedMethods: ['POST'],
      description: 'Send POST request with audio file in FormData',
      timestamp: new Date().toISOString(),
      openaiConfigured: true
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Endpoint test failed',
      error: error.message,
      endpoint: '/api/transcribe',
      method: 'GET',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

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