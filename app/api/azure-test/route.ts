// app/api/azure-test/route.ts - Teste de conectividade Azure

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Azure Speech Service connectivity...');
    
    // Verificar variáveis de ambiente
    const region = process.env.AZURE_SPEECH_REGION;
    const key = process.env.AZURE_SPEECH_KEY;
    
    console.log('📋 Environment check:', {
      hasRegion: !!region,
      hasKey: !!key,
      regionValue: region ? `${region.substring(0, 3)}...` : 'missing',
      keyValue: key ? `${key.substring(0, 8)}...` : 'missing'
    });
    
    if (!region || !key) {
      return NextResponse.json({
        success: false,
        error: 'Azure credentials missing',
        details: {
          hasRegion: !!region,
          hasKey: !!key,
          environment: process.env.NODE_ENV
        }
      }, { status: 500 });
    }
    
    // Testar conectividade com Azure
    const testUrl = `https://${region}.api.cognitive.microsoft.com/speechtotext/v3.0/endpoints`;
    
    console.log('🌐 Testing connectivity to:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Azure response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        message: 'Azure Speech Service connectivity OK',
        details: {
          region,
          status: response.status,
          endpointsCount: Array.isArray(data) ? data.length : 'unknown'
        }
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Azure connectivity failed:', errorText);
      
      return NextResponse.json({
        success: false,
        error: 'Azure connectivity failed',
        details: {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          region,
          testUrl
        }
      }, { status: response.status });
    }
    
  } catch (error: any) {
    console.error('❌ Azure test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Azure test failed',
      details: {
        message: error.message,
        stack: error.stack,
        environment: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
} 