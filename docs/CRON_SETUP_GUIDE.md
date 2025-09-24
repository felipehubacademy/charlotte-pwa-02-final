# Guia de Configuração de Cron Jobs - Supabase Edge Functions

## ✅ Status Atual
- **Edge Function**: `expire-trials` deployada com sucesso
- **URL**: `https://fnvjibzreepubageztoi.supabase.co/functions/v1/expire-trials`
- **Token**: `charlotte-cron-2024-secret-token`

## 🔧 Configuração do Cron Job

### Opção 1: Supabase Dashboard (Recomendado)

1. **Acesse**: [Supabase Dashboard](https://supabase.com/dashboard/project/fnvjibzreepubageztoi/functions)
2. **Vá para**: Edge Functions → expire-trials
3. **Configure**: Cron Job
   - **Schedule**: `0 * * * *` (a cada hora)
   - **Headers**: 
     ```json
     {
       "Authorization": "Bearer charlotte-cron-2024-secret-token",
       "Content-Type": "application/json"
     }
     ```

### Opção 2: Cron Job Externo

#### GitHub Actions
```yaml
name: Expire Trials
on:
  schedule:
    - cron: '0 * * * *'  # A cada hora
  workflow_dispatch:

jobs:
  expire-trials:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST "https://fnvjibzreepubageztoi.supabase.co/functions/v1/expire-trials" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}" \
            -H "Content-Type: application/json"
```

#### Cron Job no Servidor
```bash
# Adicionar ao crontab
0 * * * * curl -X POST "https://fnvjibzreepubageztoi.supabase.co/functions/v1/expire-trials" -H "Authorization: Bearer charlotte-cron-2024-secret-token" -H "Content-Type: application/json"
```

#### Uptime Robot (Gratuito)
1. **Acesse**: [Uptime Robot](https://uptimerobot.com)
2. **Crie**: Monitor HTTP(s)
3. **URL**: `https://fnvjibzreepubageztoi.supabase.co/functions/v1/expire-trials`
4. **Method**: POST
5. **Headers**: 
   ```
   Authorization: Bearer charlotte-cron-2024-secret-token
   Content-Type: application/json
   ```
6. **Interval**: 60 minutos

## 🧪 Teste Manual

```bash
# Testar a função
curl -X POST "https://fnvjibzreepubageztoi.supabase.co/functions/v1/expire-trials" \
  -H "Authorization: Bearer charlotte-cron-2024-secret-token" \
  -H "Content-Type: application/json"
```

## 📊 Monitoramento

### Logs da Edge Function
- **Dashboard**: [Supabase Functions](https://supabase.com/dashboard/project/fnvjibzreepubageztoi/functions)
- **Logs**: Edge Functions → expire-trials → Logs

### Resposta Esperada
```json
{
  "success": true,
  "message": "Processo de expiração concluído",
  "expiredTrials": 0,
  "expiringTrials": 0,
  "stats": {
    "totalTrials": 10,
    "activeTrials": 10,
    "expiredTrials": 0,
    "convertedTrials": 0
  },
  "timestamp": "2025-09-24T18:06:54.715Z"
}
```

## 🔐 Segurança

### Variáveis de Ambiente
- **CRON_SECRET_TOKEN**: `charlotte-cron-2024-secret-token`
- **SUPABASE_URL**: `https://fnvjibzreepubageztoi.supabase.co`
- **SUPABASE_SERVICE_ROLE_KEY**: Configurado no Supabase

### Configuração no Supabase
1. **Acesse**: Project Settings → Edge Functions
2. **Adicione**: `CRON_SECRET_TOKEN=charlotte-cron-2024-secret-token`

## 🚀 Próximos Passos

1. **Configurar cron job** no Supabase Dashboard
2. **Testar execução** automática
3. **Monitorar logs** por alguns dias
4. **Ajustar frequência** se necessário

## 📝 Troubleshooting

### Erro 401 - Unauthorized
- Verificar se `CRON_SECRET_TOKEN` está configurado
- Verificar se o token está correto no header

### Erro 500 - Internal Server Error
- Verificar logs da Edge Function
- Verificar se as variáveis de ambiente estão configuradas

### Função não executa
- Verificar se o cron job está configurado corretamente
- Verificar se a URL está correta
- Verificar se o método POST está sendo usado
