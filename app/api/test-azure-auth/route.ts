import { NextRequest, NextResponse } from 'next/server';
import { ClientCredentialAuthProvider } from '@/lib/client-credential-auth-provider';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testando autenticação do Azure AD...');
    
    const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID!;
    const clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET!;
    const tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID!;
    
    console.log('📋 Configuração:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasTenantId: !!tenantId,
      clientIdLength: clientId?.length || 0,
      clientSecretLength: clientSecret?.length || 0,
      tenantIdLength: tenantId?.length || 0
    });
    
    // Testar autenticação
    const authProvider = new ClientCredentialAuthProvider(clientId, clientSecret, tenantId);
    
    try {
      const token = await authProvider.getAccessToken();
      console.log('✅ Token obtido com sucesso:', token.substring(0, 20) + '...');
      
      return NextResponse.json({
        success: true,
        message: 'Autenticação funcionando',
        tokenLength: token.length,
        tokenStart: token.substring(0, 20) + '...'
      });
      
    } catch (authError) {
      console.error('❌ Erro na autenticação:', authError);
      return NextResponse.json({
        success: false,
        error: 'Erro na autenticação',
        details: authError instanceof Error ? authError.message : 'Erro desconhecido'
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro geral',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
