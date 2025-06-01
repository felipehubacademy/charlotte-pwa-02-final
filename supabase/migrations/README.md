# Supabase Migrations

## Status: ✅ APLICADAS EM PRODUÇÃO

Todas as migrações nesta pasta já foram aplicadas no banco de dados de produção.

### Migrações Aplicadas:

1. **001_xp_system_improvements.sql** ✅
   - Criação de tabelas: `user_achievements`, `user_leaderboard_cache`
   - Adição de colunas ao `user_practices`: `achievement_ids`, `surprise_bonus`, `base_xp`, `bonus_xp`
   - Criação de índices e triggers

2. **002_fix_leaderboard_tables.sql** ✅
   - Correção e otimização da tabela `user_leaderboard_cache`
   - Funções para popular leaderboard automaticamente
   - Triggers melhorados

### Como verificar se estão aplicadas:

```sql
-- Verificar tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('user_achievements', 'user_leaderboard_cache');

-- Verificar colunas
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_practices' 
AND column_name IN ('achievement_ids', 'surprise_bonus', 'base_xp', 'bonus_xp');
```

### Nota:
- ⚠️ **NÃO execute** essas migrações novamente se já estão aplicadas
- ✅ **Mantenha** estes arquivos para documentação e replicação em outros ambientes 