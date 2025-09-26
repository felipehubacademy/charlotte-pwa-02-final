import { NextRequest, NextResponse } from 'next/server';
import { AzureADUserService } from '@/lib/azure-ad-user-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testando adição de usuário ao grupo Azure AD...');
    
    // Usar o usuário que foi criado anteriormente
    const testData = {
      userId: '79979401-4726-4efb-89a6-465e9dde2127', // ID do usuário criado anteriormente
      nivel: 'Advanced' as const
    };

    console.log('📋 Dados de teste:', testData);

    const azureService = new AzureADUserService();
    
    // Testar adição ao grupo
    const groupAdded = await azureService.addUserToTrialGroup(testData.userId, testData.nivel);
    
    return NextResponse.json({
      success: groupAdded,
      message: groupAdded ? 'Usuário adicionado ao grupo com sucesso!' : 'Falha ao adicionar usuário ao grupo',
      data: {
        userId: testData.userId,
        nivel: testData.nivel,
        groupName: `Charlotte-Trial-${testData.nivel}`,
        groupAdded: groupAdded
      }
    });

  } catch (error: any) {
    console.error('❌ Erro no teste de adição ao grupo:', error);
    return NextResponse.json(
      { 
        error: 'Erro no teste de adição ao grupo',
        details: error.message
      },
      { status: 500 }
    );
  }
}
