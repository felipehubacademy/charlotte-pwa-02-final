#!/bin/bash

echo "🔍 Testando Supabase local..."

# Credenciais
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

echo ""
echo "📋 Verificando estrutura da tabela user_achievements..."

# Testar conexão básica
curl -s \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  "$SUPABASE_URL/rest/v1/user_achievements?limit=1" | jq '.' 2>/dev/null || echo "Erro ao conectar ou jq não instalado"

echo ""
echo "🧪 Testando inserção..."

# Testar inserção
curl -s \
  -X POST \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "test-user-123",
    "achievement_type": "test",
    "type": "test", 
    "xp_bonus": 10,
    "rarity": "common",
    "earned_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }' \
  "$SUPABASE_URL/rest/v1/user_achievements" | jq '.' 2>/dev/null || echo "Erro na inserção"

echo ""
echo "🧹 Limpando teste..."

# Limpar teste
curl -s \
  -X DELETE \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  "$SUPABASE_URL/rest/v1/user_achievements?user_id=eq.test-user-123"

echo "✅ Teste concluído!" 