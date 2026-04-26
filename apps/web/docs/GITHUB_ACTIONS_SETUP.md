# Configuração do GitHub Actions para Cron Jobs

## 🔧 **Configuração Necessária**

### 1. **Configurar Secret no GitHub**

1. **Acesse**: Seu repositório no GitHub
2. **Vá para**: Settings → Secrets and variables → Actions
3. **Clique**: "New repository secret"
4. **Configure**:
   - **Name**: `CRON_SECRET_TOKEN`
   - **Value**: `charlotte-cron-2024-secret-token`

### 2. **Verificar Workflow**

O arquivo `.github/workflows/expire-trials.yml` já está configurado com:
- **Schedule**: `0 0 * * *` (diário às 00:00 UTC = 21:00 BRT)
- **Execução manual**: Disponível via GitHub Actions
- **Logs detalhados**: Para monitoramento

## ⏰ **Horários de Execução**

- **UTC**: 00:00 (meia-noite)
- **BRT**: 21:00 (9 da noite)
- **Frequência**: Diária

## 📊 **Economia de Minutos**

### **Antes (1x por hora)**:
- 24 execuções/dia × 30 dias = 720 execuções/mês
- ~720 minutos/mês

### **Agora (1x por dia)**:
- 1 execução/dia × 30 dias = 30 execuções/mês
- ~30 minutos/mês
- **Economia**: 96% menos execuções! 💰

## 🧪 **Teste Manual**

Para testar o workflow:

1. **Acesse**: GitHub → Actions
2. **Selecione**: "Expire Trials - Daily Cron"
3. **Clique**: "Run workflow"
4. **Verifique**: Logs de execução

## 📈 **Monitoramento**

### **Logs Disponíveis**:
- Status de execução
- Número de trials expirados
- Estatísticas gerais
- Erros (se houver)

### **Notificações**:
- ✅ Sucesso: Logs detalhados
- ❌ Falha: Mensagem de erro clara

## 🔄 **Próximos Passos**

1. **Commit** o arquivo `.github/workflows/expire-trials.yml`
2. **Push** para o repositório
3. **Configure** a secret `CRON_SECRET_TOKEN`
4. **Teste** a execução manual
5. **Aguarde** a próxima execução automática (21:00 BRT)

## 🎯 **Vantagens desta Configuração**

- ✅ **Gratuito**: Usa minutos gratuitos do GitHub
- ✅ **Confiável**: Infraestrutura do GitHub
- ✅ **Eficiente**: 1x por dia é suficiente
- ✅ **Monitorável**: Logs detalhados
- ✅ **Flexível**: Execução manual disponível
- ✅ **Econômico**: 96% menos execuções
