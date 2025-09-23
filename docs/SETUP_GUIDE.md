# Guia de Configuração - Sistema de Leads Charlotte

## 🚀 Configuração Passo a Passo

### 1. Variáveis de Ambiente no Vercel

Acesse o [Dashboard do Vercel](https://vercel.com/dashboard) e configure as seguintes variáveis:

#### ✅ Obrigatórias (Sistema não funciona sem elas)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Microsoft Entra ID (já configurado)
NEXT_PUBLIC_AZURE_CLIENT_ID=seu_client_id
NEXT_PUBLIC_AZURE_AUTHORITY=https://login.microsoftonline.com/seu_tenant_id
NEXT_PUBLIC_REDIRECT_URI=https://charlotte-v2.vercel.app
```

#### 🔧 Recomendadas (Sistema funciona, mas com funcionalidades limitadas)
```bash
# HubSpot (para CRM)
HUBSPOT_API_KEY=pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Email (escolha um)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# OU
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cron Jobs
CRON_SECRET_TOKEN=seu_token_secreto_aqui

# App URL
NEXT_PUBLIC_APP_URL=https://charlotte-v2.vercel.app
```

### 2. Configuração do HubSpot

1. **Acesse**: [HubSpot Developer Portal](https://developers.hubspot.com/)
2. **Crie** uma conta ou faça login
3. **Vá para**: Settings → Integrations → Private Apps
4. **Clique** em "Create a private app"
5. **Configure**:
   - Nome: "Charlotte Leads Integration"
   - Escopo: `crm.objects.contacts.write`
6. **Copie** o Access Token (começa com `pat-na1-`)
7. **Cole** no Vercel como `HUBSPOT_API_KEY`

### 3. Configuração de Email (Resend - Recomendado)

1. **Acesse**: [Resend.com](https://resend.com/)
2. **Crie** uma conta gratuita
3. **Vá para**: API Keys
4. **Clique** em "Create API Key"
5. **Copie** a chave (começa com `re_`)
6. **Cole** no Vercel como `RESEND_API_KEY`

### 4. Configuração de Email (SendGrid - Alternativa)

1. **Acesse**: [SendGrid.com](https://sendgrid.com/)
2. **Crie** uma conta gratuita
3. **Vá para**: Settings → API Keys
4. **Clique** em "Create API Key"
5. **Escolha** "Restricted Access" com permissões de "Mail Send"
6. **Copie** a chave (começa com `SG.`)
7. **Cole** no Vercel como `SENDGRID_API_KEY`

### 5. Configuração do Cron Job

O cron job já está configurado no `vercel.json` e será executado automaticamente a cada hora.

Para testar manualmente:
```bash
curl -X POST https://charlotte-v2.vercel.app/api/cron/expire-trials \
  -H "Authorization: Bearer SEU_CRON_SECRET_TOKEN"
```

### 6. Verificação da Configuração

Após configurar as variáveis, teste os endpoints:

#### Health Check
```bash
curl https://charlotte-v2.vercel.app/api/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "services": {
    "supabase": true,
    "hubspot": true,
    "email": true,
    "cron": true,
    "firebase": false
  }
}
```

#### Teste da Landing Page
1. Acesse: `https://charlotte-v2.vercel.app/landing`
2. Preencha o formulário
3. Verifique se foi redirecionado para `/install`

### 7. Monitoramento

#### Logs do Vercel
- Acesse o dashboard do Vercel
- Vá para Functions → Logs
- Monitore erros e performance

#### Supabase Dashboard
- Acesse o dashboard do Supabase
- Vá para Table Editor
- Verifique as tabelas `leads` e `trial_access`

#### HubSpot (se configurado)
- Acesse o HubSpot
- Vá para Contacts
- Verifique se os leads estão sendo criados

### 8. Troubleshooting

#### Erro "Supabase não configurado"
- Verifique se as variáveis do Supabase estão corretas
- Teste a conexão no Supabase Dashboard

#### Erro "HubSpot não configurado"
- Verifique se `HUBSPOT_API_KEY` está definida
- Teste a API do HubSpot

#### Emails não enviados
- Verifique se `RESEND_API_KEY` ou `SENDGRID_API_KEY` está definida
- Verifique os logs do Vercel
- Teste o endpoint `/api/email/process`

#### Trials não expiram
- Verifique se `CRON_SECRET_TOKEN` está definido
- Verifique se o cron job está rodando no Vercel
- Execute manualmente o endpoint de expiração

### 9. Próximos Passos

Após a configuração:
1. ✅ Teste a landing page
2. ✅ Verifique se os leads são criados no Supabase
3. ✅ Teste o redirecionamento para `/install`
4. ✅ Verifique se os emails são enviados
5. ✅ Monitore o sistema por alguns dias

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Vercel
2. Teste os endpoints de health check
3. Verifique as configurações no Supabase
4. Consulte este guia novamente
