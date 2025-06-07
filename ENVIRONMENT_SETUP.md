# Environment Variables Setup

## 🔧 Required Environment Variables

Para resolver o problema de RLS (Row Level Security) nos achievements, você precisa adicionar a chave de service role do Supabase.

### 📝 Adicione ao seu `.env.local`:

```env
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 🆕 NEW: Service Role Key (para operações do backend)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Other existing variables...
OPENAI_API_KEY=your_openai_api_key
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_region
NEXT_PUBLIC_AZURE_CLIENT_ID=your_azure_client_id
NEXT_PUBLIC_AZURE_TENANT_ID=your_azure_tenant_id
```

## 🔑 Como Obter a Service Role Key

1. **Acesse o Supabase Dashboard**
2. **Vá para Settings > API**
3. **Copie a "service_role" key** (não a anon key)
4. **Adicione como `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`**

## ⚠️ Importante

- A **service_role key** tem permissões administrativas
- **NUNCA** exponha ela no frontend
- Use apenas no backend/servidor
- Mantenha ela segura no `.env.local`

## 🔧 Alternativa: Corrigir RLS Policies

Se não quiser usar service role, você pode executar os scripts SQL fornecidos:

1. `check-rls-policies.sql` - Para verificar políticas atuais
2. `fix-rls-policies.sql` - Para corrigir as políticas RLS

Execute estes scripts no SQL Editor do Supabase Dashboard.

## ✅ Verificação

Após adicionar a service role key, você deve ver nos logs:

```
🔑 Using Supabase service role for backend operations
```

Em vez de:

```
⚠️ SUPABASE_SERVICE_ROLE_KEY not found, using anon key (may cause RLS issues)
``` 