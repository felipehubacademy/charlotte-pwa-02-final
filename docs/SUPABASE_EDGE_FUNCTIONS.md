# Deploy das Supabase Edge Functions

## 🚀 Deploy da Função expire-trials

### 1. Via Supabase CLI (Recomendado)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Linkar ao projeto
supabase link --project-ref SEU_PROJECT_REF

# Deploy da função
supabase functions deploy expire-trials
```

### 2. Via Dashboard do Supabase

1. **Acesse**: [Supabase Dashboard](https://supabase.com/dashboard)
2. **Vá para**: Edge Functions
3. **Clique** em "Create a new function"
4. **Nome**: `expire-trials`
5. **Cole** o código do arquivo `supabase/functions/expire-trials/index.ts`
6. **Clique** em "Deploy"

### 3. Configurar Cron Job no Supabase

Após o deploy:

1. **Vá para**: Database → Cron Jobs
2. **Clique** em "Create a new cron job"
3. **Configure**:
   - **Name**: `expire-trials`
   - **Schedule**: `0 * * * *` (a cada hora)
   - **Command**: `SELECT cron.schedule('expire-trials', '0 * * * *', 'SELECT net.http_post(url:=''https://seu-projeto.supabase.co/functions/v1/expire-trials'', headers:=''{"Authorization": "Bearer SEU_SUPABASE_ANON_KEY"}''::jsonb)');`

### 4. Teste Manual

```bash
# Testar a função
curl -X POST https://seu-projeto.supabase.co/functions/v1/expire-trials \
  -H "Authorization: Bearer SEU_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

**Resposta esperada:**
```json
{
  "success": true,
  "expiredCount": 0,
  "message": "0 trials expirados"
}
```

### 5. Monitoramento

#### Logs da Edge Function
- **Acesse**: Supabase Dashboard → Edge Functions → expire-trials
- **Vá para**: Logs
- **Monitore** execuções e erros

#### Logs do Cron Job
- **Acesse**: Supabase Dashboard → Database → Cron Jobs
- **Verifique** se está executando corretamente

### 6. Troubleshooting

#### Erro "Function not found"
- Verifique se a função foi deployada corretamente
- Confirme a URL da função

#### Erro "Authorization failed"
- Verifique se o `SUPABASE_ANON_KEY` está correto
- Confirme se a função está acessível publicamente

#### Cron job não executa
- Verifique se o cron job foi criado corretamente
- Confirme o schedule (`0 * * * *`)
- Verifique os logs do cron job

### 7. Alternativas ao Cron Job do Supabase

Se o cron job do Supabase não funcionar, use alternativas:

#### GitHub Actions
```yaml
# .github/workflows/expire-trials.yml
name: Expire Trials
on:
  schedule:
    - cron: '0 * * * *'  # A cada hora
jobs:
  expire-trials:
    runs-on: ubuntu-latest
    steps:
      - name: Call expire-trials function
        run: |
          curl -X POST https://seu-projeto.supabase.co/functions/v1/expire-trials \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

#### Uptime Robot (Gratuito)
1. **Acesse**: [UptimeRobot.com](https://uptimerobot.com/)
2. **Crie** um monitor HTTP(s)
3. **URL**: `https://seu-projeto.supabase.co/functions/v1/expire-trials`
4. **Method**: POST
5. **Headers**: `Authorization: Bearer SEU_SUPABASE_ANON_KEY`
6. **Interval**: 60 minutos

## ✅ Verificação Final

Após configurar tudo:

1. **Teste** a função manualmente
2. **Verifique** se o cron job está executando
3. **Monitore** os logs por alguns dias
4. **Confirme** que os trials estão expirando automaticamente
