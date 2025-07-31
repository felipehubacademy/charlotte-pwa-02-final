#!/bin/bash
# Teste manual para Rodolfo após correção

echo "🧪 TESTANDO RODOLFO APÓS CORREÇÃO..."

curl -X POST "https://charlotte-v2.vercel.app/api/notifications/test" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "102a317e-1613-4c93-a60b-2ae17bd1005d",
    "platform": "ios",
    "message": "🧪 Teste manual Rodolfo - duplicata corrigida!"
  }'

echo ""
echo "✅ Teste enviado para Rodolfo iPhone!"
echo "📱 Verifique se chegou no dispositivo dele."