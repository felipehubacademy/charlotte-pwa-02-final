import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hubspot: !!process.env.HUBSPOT_API_KEY,
        email: !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY),
        cron: !!process.env.CRON_SECRET_TOKEN,
        firebase: !!process.env.FIREBASE_PROJECT_ID
      },
      environment: process.env.NODE_ENV || 'development'
    };

    const allServicesConfigured = Object.values(health.services).every(Boolean);
    
    return NextResponse.json({
      ...health,
      status: allServicesConfigured ? 'healthy' : 'degraded',
      message: allServicesConfigured 
        ? 'Todos os serviços configurados' 
        : 'Alguns serviços opcionais não configurados'
    });

  } catch (error) {
    console.error('Erro no health check:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
