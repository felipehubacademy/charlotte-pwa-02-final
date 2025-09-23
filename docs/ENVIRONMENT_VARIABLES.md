# Variáveis de Ambiente - Sistema de Leads

Este documento lista todas as variáveis de ambiente necessárias para o funcionamento completo do sistema de leads da Charlotte.

## Configuração Obrigatória

### Supabase
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Microsoft Entra ID
```bash
NEXT_PUBLIC_AZURE_CLIENT_ID=your_azure_client_id
NEXT_PUBLIC_AZURE_AUTHORITY=https://login.microsoftonline.com/your_tenant_id
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000
```

### Microsoft Graph
```bash
MICROSOFT_GRAPH_CLIENT_ID=your_graph_client_id
MICROSOFT_GRAPH_CLIENT_SECRET=your_graph_client_secret
MICROSOFT_GRAPH_TENANT_ID=your_tenant_id
```

## Configuração Opcional

### HubSpot (para CRM)
```bash
HUBSPOT_API_KEY=your_hubspot_api_key
```
- **Função**: Enviar leads automaticamente para o HubSpot
- **Opcional**: Sim, o sistema funciona sem esta configuração

### Email (para notificações)
```bash
# Escolha um dos serviços abaixo:
RESEND_API_KEY=your_resend_api_key
# OU
SENDGRID_API_KEY=your_sendgrid_api_key
```
- **Função**: Enviar emails de boas-vindas, lembretes e expiração
- **Opcional**: Sim, mas recomendado para melhor experiência

### Aplicação
```bash
NEXT_PUBLIC_APP_URL=https://charlotte.hubacademy.com.br
CRON_SECRET_TOKEN=your_cron_secret_token
```
- **NEXT_PUBLIC_APP_URL**: URL base da aplicação (usado nos emails)
- **CRON_SECRET_TOKEN**: Token para autenticar chamadas de cron jobs

### Firebase (para notificações push)
```bash
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```
- **Função**: Notificações push para usuários
- **Opcional**: Sim, mas recomendado para engajamento

## Configuração do Cron Job

Para que o sistema expire trials automaticamente, configure um cron job que chame:

```bash
# A cada hora
curl -X POST https://your-app-url/supabase/functions/v1/expire-trials \
  -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
```

Ou use o Vercel Cron (se hospedado no Vercel):

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-trials",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Verificação da Configuração

Para verificar se todas as configurações estão corretas, acesse:

- `/api/health` - Status geral da aplicação
- `/api/trial/status?user_id=USER_ID` - Status do trial de um usuário
- `/api/email/process` - Processar fila de emails

## Troubleshooting

### Erro "HubSpot não configurado"
- Verifique se `HUBSPOT_API_KEY` está definida
- O sistema continuará funcionando, apenas não enviará dados para o HubSpot

### Erro "Email não enviado"
- Verifique se `RESEND_API_KEY` ou `SENDGRID_API_KEY` está definida
- Verifique os logs da API `/api/email/process`

### Erro "Trial não expira"
- Verifique se o cron job está configurado
- Verifique se `CRON_SECRET_TOKEN` está correto
- Execute manualmente: `curl -X POST /api/cron/expire-trials`
