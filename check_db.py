#!/usr/bin/env python3
import psycopg2
import json

# Conectar ao PostgreSQL local
try:
    conn = psycopg2.connect(
        host="127.0.0.1",
        port="54322",
        database="postgres",
        user="postgres",
        password="postgres"
    )
    
    cur = conn.cursor()
    
    print("🔍 Conectado ao PostgreSQL local!")
    
    # Verificar estrutura da tabela user_achievements
    print("\n📋 Estrutura da tabela user_achievements:")
    cur.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'user_achievements'
        ORDER BY ordinal_position;
    """)
    
    columns = cur.fetchall()
    if columns:
        for col in columns:
            print(f"  - {col[0]} ({col[1]}) {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
    else:
        print("  ❌ Tabela user_achievements não encontrada!")
    
    # Verificar dados existentes
    print("\n📊 Dados existentes:")
    cur.execute("SELECT * FROM user_achievements LIMIT 3;")
    rows = cur.fetchall()
    
    if rows:
        print(f"  ✅ Encontrados {len(rows)} registros:")
        for i, row in enumerate(rows):
            print(f"    {i+1}. {row}")
    else:
        print("  📭 Nenhum dado encontrado")
    
    # Testar inserção
    print("\n🧪 Testando inserção...")
    test_data = {
        'user_id': 'test-user-123',
        'achievement_type': 'test',
        'type': 'test',
        'xp_bonus': 10,
        'rarity': 'common',
        'earned_at': 'now()'
    }
    
    try:
        cur.execute("""
            INSERT INTO user_achievements (user_id, achievement_type, type, xp_bonus, rarity, earned_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *;
        """, (test_data['user_id'], test_data['achievement_type'], test_data['type'], 
              test_data['xp_bonus'], test_data['rarity'], test_data['earned_at']))
        
        result = cur.fetchone()
        print(f"  ✅ Inserção bem-sucedida: {result}")
        
        # Limpar teste
        cur.execute("DELETE FROM user_achievements WHERE user_id = %s", (test_data['user_id'],))
        conn.commit()
        print("  🧹 Teste limpo")
        
    except Exception as e:
        print(f"  ❌ Erro na inserção: {e}")
        conn.rollback()
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Erro de conexão: {e}") 