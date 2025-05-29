// app/api/realtime-token/route.ts - Versão corrigida completa

import { NextRequest, NextResponse } from 'next/server';

interface RealtimeTokenRequest {
  userLevel: 'Novice' | 'Intermediate' | 'Advanced';
  userName?: string;
  debug?: boolean;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  console.log('🔑 [Realtime Token API] Request received:', {
    url: request.url,
    timestamp: new Date().toISOString()
  });

  try {
    const body = await request.json() as RealtimeTokenRequest;
    const { userLevel, userName, debug = false } = body;

    console.log('📥 [Realtime Token API] Request body:', { userLevel, userName, debug });

    // Validar parâmetros
    if (!userLevel || !['Novice', 'Intermediate', 'Advanced'].includes(userLevel)) {
      console.log('❌ [Realtime Token API] Invalid userLevel:', userLevel);
      return NextResponse.json({
        success: false,
        error: 'Invalid userLevel. Must be Novice, Intermediate, or Advanced.'
      }, { status: 400 });
    }

    // 🔍 STEP 1: Verificar API key
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log('🔑 [Realtime Token API] Environment check:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 7) + '...' || 'N/A',
      nodeEnv: process.env.NODE_ENV
    });

    if (!apiKey) {
      console.log('❌ [Realtime Token API] No API key configured');
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured in environment variables'
      }, { status: 500 });
    }

    // 🔍 STEP 2: Testar acesso básico à OpenAI API (somente se debug estiver ativo)
    if (debug) {
      console.log('🧪 [Realtime Token API] Testing basic OpenAI API access...');
      
      try {
        const testResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 [Realtime Token API] OpenAI API test response:', {
          status: testResponse.status,
          statusText: testResponse.statusText
        });

        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.log('❌ [Realtime Token API] OpenAI API test failed:', errorText);
          
          return NextResponse.json({
            success: false,
            error: `OpenAI API access denied: ${testResponse.status} - ${errorText}`,
            debug: {
              apiTestStatus: testResponse.status,
              apiTestResponse: errorText,
              keyValid: false
            }
          }, { status: 401 });
        }

        const modelsData = await testResponse.json();
        const realtimeModels = modelsData.data?.filter((model: any) => 
          model.id.includes('realtime') || model.id.includes('gpt-4o-realtime')
        ) || [];

        console.log('✅ [Realtime Token API] OpenAI API access OK:', {
          totalModels: modelsData.data?.length || 0,
          realtimeModels: realtimeModels.length,
          realtimeModelIds: realtimeModels.map((m: any) => m.id)
        });

        if (realtimeModels.length === 0) {
          console.log('⚠️ [Realtime Token API] No Realtime models found - account may not have access');
        }

      } catch (apiError: any) {
        console.log('❌ [Realtime Token API] Exception testing OpenAI API:', apiError.message);
        
        return NextResponse.json({
          success: false,
          error: `Failed to verify OpenAI API access: ${apiError.message}`,
          debug: {
            apiTestException: apiError.message,
            keyProvided: !!apiKey
          }
        }, { status: 500 });
      }
    }

    // ✅ SUCESSO - Retornar API key
    const processingTime = Date.now() - startTime;
    
    console.log('✅ [Realtime Token API] Providing API key:', {
      userLevel,
      userName,
      processingTime: `${processingTime}ms`,
      debug: debug
    });

    const response = {
      success: true,
      apiKey: apiKey,
      config: {
        model: 'gpt-4o-realtime-preview-2024-10-01', // Modelo testado pela comunidade
        voice: 'alloy',
        userLevel,
        userName
      },
      debug: debug ? {
        hasApiKey: true,
        apiKeyPrefix: `${apiKey.substring(0, 7)}...`,
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        testsCompleted: debug ? ['basic_api_access'] : ['minimal_check']
      } : undefined
    };

    return NextResponse.json(response);

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    console.error('💥 [Realtime Token API] Unexpected error:', {
      error: error.message,
      processingTime: `${processingTime}ms`
    });
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      debug: {
        exception: error.message,
        processingTime: `${processingTime}ms`
      }
    }, { status: 500 });
  }
}