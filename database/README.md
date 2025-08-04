# 📊 Scripts de Banco de Dados - Charlotte PWA

Este diretório contém scripts SQL para manutenção, debug e migração do banco de dados.

---

## 🔧 **Scripts de Migração**

### **migrate-frequent-to-normal.sql**
- **Propósito:** Migrar usuários com frequência "frequent" (2x/dia) para "normal" (1x/dia)
- **Data:** Janeiro 2025
- **Mudança:** Simplificação do sistema de notificações
- **Como usar:** Executar no Supabase SQL Editor

---

## 🐛 **Scripts de Debug**

### **debug-notification-logs.sql**
- **Propósito:** Verificar logs de notificações enviadas
- **Útil para:** Debug de notificações duplicadas ou falhadas

### **debug-subscriptions.sql**
- **Propósito:** Verificar subscriptions ativas
- **Útil para:** Debug de problemas de push notifications

---

## 🧹 **Scripts de Limpeza**

### **clean-expired-tokens.sql**
- **Propósito:** Remover tokens FCM expirados
- **Frequência:** Mensal (recomendado)

---

## 📋 **Como Executar**

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Cole o script desejado
4. Clique em **Run**

---

## ⚠️ **Avisos Importantes**

- **Sempre faça backup** antes de executar scripts de migração
- **Teste em staging** antes de executar em produção
- **Verifique os resultados** após cada execução

---

*Última atualização: Janeiro 2025* 