# Database Scripts

Esta pasta contém scripts SQL para manutenção e verificação do banco de dados.

## Scripts Disponíveis

### **verify-table-structure.sql**
- **Propósito**: Verificar estrutura da tabela `push_subscriptions`
- **Uso**: Execute no Supabase SQL Editor para verificar colunas e dados
- **Quando usar**: Para debug de problemas com push notifications

### **verify-renewal.sql**
- **Propósito**: Verificar renovações de subscriptions
- **Uso**: Execute após renovar subscriptions para confirmar
- **Quando usar**: Após testes de renovação automática

### **clean-expired-tokens.sql**
- **Propósito**: Limpar tokens expirados e duplicados
- **Uso**: Manutenção periódica do banco
- **Quando usar**: Mensalmente ou quando houver muitos tokens inativos

### **supabase-insert-policy.sql**
- **Propósito**: Criar políticas RLS para achievements
- **Uso**: Configuração de segurança do Supabase
- **Quando usar**: Durante setup inicial ou quando adicionar novas tabelas

## Como Executar

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Cole o script desejado
4. Execute e verifique os resultados

## ⚠️ Importante

- **Sempre faça backup** antes de executar scripts de limpeza
- **Teste em ambiente de desenvolvimento** primeiro
- **Verifique os resultados** após cada execução 