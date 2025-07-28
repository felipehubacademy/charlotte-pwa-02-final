import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Simular envio bem-sucedido sem usar web-push library
    console.log('📱 Simple iOS test for user:', user_id);
    
    // Sem timeout, sem web-push, apenas retornar sucesso
    return NextResponse.json({
      success: true,
      message: 'Simple iOS test completed',
      note: 'This endpoint works without timeout',
      user_id: user_id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Simple test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple iOS notification test endpoint',
    status: 'working',
    timestamp: new Date().toISOString()
  });
}
