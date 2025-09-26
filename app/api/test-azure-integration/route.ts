import { NextRequest, NextResponse } from 'next/server';
import TrialAzureIntegration from '@/lib/trial-azure-integration';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testando integração Azure AD...');
    
    // Dados de teste
    const testData = {
      nome: 'Felipe Xavier Teste Azure',
      email: 'felipe.azure@hubacademybr.com',
      telefone: '(11) 99999-9999',
      nivel: 'Advanced' as const,
      senha: 'Teste123!'
    };

    console.log('📋 Dados de teste:', testData);

    // Testar criação de trial
    const trialResult = await TrialAzureIntegration.createCompleteTrial(testData);

    return NextResponse.json({
      success: trialResult.success,
      message: trialResult.success ? 'Trial criado com sucesso!' : 'Falha ao criar trial',
      data: {
        trial: trialResult,
        testData
      }
    });

  } catch (error) {
    console.error('❌ Erro no teste Azure:', error);
    return NextResponse.json(
      { 
        error: 'Erro no teste Azure',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
