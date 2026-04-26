import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json();
    
    if (!sql) {
      return NextResponse.json(
        { error: 'SQL é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔧 Executando SQL:', sql);
    
    // Configurar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Executar SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      return NextResponse.json({
        success: false,
        error: 'Erro ao executar SQL',
        details: error
      }, { status: 500 });
    }

    console.log('✅ SQL executado com sucesso');

    return NextResponse.json({
      success: true,
      message: 'SQL executado com sucesso',
      data: data
    });

  } catch (error: any) {
    console.error('❌ Erro ao executar SQL:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message
      },
      { status: 500 }
    );
  }
}
