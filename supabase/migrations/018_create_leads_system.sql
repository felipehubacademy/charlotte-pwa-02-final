-- 018_create_leads_system.sql
-- Sistema de captura de leads e acesso temporário

-- =====================================================
-- 1. TABELA LEADS - Captura de leads da landing page
-- =====================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  nivel_ingles TEXT NOT NULL CHECK (nivel_ingles IN ('Novice', 'Inter', 'Advanced')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired', 'cancelled')),
  data_cadastro TIMESTAMPTZ DEFAULT NOW(),
  data_expiracao TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  hubspot_contact_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. TABELA TRIAL_ACCESS - Controle de acesso temporário
-- =====================================================

CREATE TABLE IF NOT EXISTS trial_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_fim TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted', 'cancelled')),
  nivel_ingles TEXT NOT NULL CHECK (nivel_ingles IN ('Novice', 'Inter', 'Advanced')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. TABELA EMAIL_NOTIFICATIONS - Log de notificações
-- =====================================================

CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('welcome', 'reminder', 'expiration', 'conversion')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  data_envio TIMESTAMPTZ,
  data_agendamento TIMESTAMPTZ,
  tentativas INTEGER DEFAULT 0,
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para leads
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_data_cadastro ON leads(data_cadastro);
CREATE INDEX IF NOT EXISTS idx_leads_data_expiracao ON leads(data_expiracao);

-- Índices para trial_access
CREATE INDEX IF NOT EXISTS idx_trial_access_user_id ON trial_access(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_access_status ON trial_access(status);
CREATE INDEX IF NOT EXISTS idx_trial_access_data_fim ON trial_access(data_fim);
CREATE INDEX IF NOT EXISTS idx_trial_access_lead_id ON trial_access(lead_id);

-- Índices para email_notifications
CREATE INDEX IF NOT EXISTS idx_email_notifications_lead_id ON email_notifications(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_tipo ON email_notifications(tipo);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_data_envio ON email_notifications(data_envio);

-- =====================================================
-- 5. RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para leads (apenas admins podem ver todos, usuários veem apenas os próprios)
CREATE POLICY "Leads can be viewed by admins" ON leads FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Leads can be viewed by owner" ON leads FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Leads can be inserted by anyone" ON leads FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Leads can be updated by admins" ON leads FOR UPDATE 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para trial_access (usuários veem apenas os próprios)
CREATE POLICY "Trial access can be viewed by owner" ON trial_access FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Trial access can be inserted by admins" ON trial_access FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Trial access can be updated by admins" ON trial_access FOR UPDATE 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para email_notifications (apenas admins)
CREATE POLICY "Email notifications can be viewed by admins" ON email_notifications FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Email notifications can be inserted by admins" ON email_notifications FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Email notifications can be updated by admins" ON email_notifications FOR UPDATE 
  USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- 6. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para criar trial access automaticamente
CREATE OR REPLACE FUNCTION create_trial_access(
  p_user_id UUID,
  p_lead_id UUID,
  p_nivel_ingles TEXT
) RETURNS UUID AS $$
DECLARE
  v_trial_id UUID;
  v_data_fim TIMESTAMPTZ;
BEGIN
  -- Calcular data de fim (7 dias a partir de agora)
  v_data_fim := NOW() + INTERVAL '7 days';
  
  -- Criar trial access
  INSERT INTO trial_access (user_id, lead_id, data_fim, nivel_ingles)
  VALUES (p_user_id, p_lead_id, v_data_fim, p_nivel_ingles)
  RETURNING id INTO v_trial_id;
  
  -- Atualizar lead com user_id e data de expiração
  UPDATE leads 
  SET user_id = p_user_id, 
      data_expiracao = v_data_fim,
      status = 'converted',
      updated_at = NOW()
  WHERE id = p_lead_id;
  
  RETURN v_trial_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário tem trial ativo
CREATE OR REPLACE FUNCTION has_active_trial(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trial_access 
    WHERE user_id = p_user_id 
    AND status = 'active' 
    AND data_fim > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para expirar trials automaticamente
CREATE OR REPLACE FUNCTION expire_trials()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Marcar trials expirados
  UPDATE trial_access 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' 
  AND data_fim <= NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Atualizar status dos leads correspondentes
  UPDATE leads 
  SET status = 'expired', updated_at = NOW()
  WHERE id IN (
    SELECT lead_id FROM trial_access 
    WHERE status = 'expired' 
    AND lead_id IS NOT NULL
  );
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para leads
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- Trigger para trial_access
CREATE OR REPLACE FUNCTION update_trial_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trial_access_updated_at
  BEFORE UPDATE ON trial_access
  FOR EACH ROW
  EXECUTE FUNCTION update_trial_access_updated_at();

-- Trigger para email_notifications
CREATE OR REPLACE FUNCTION update_email_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_email_notifications_updated_at
  BEFORE UPDATE ON email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_email_notifications_updated_at();

-- =====================================================
-- 8. COMENTÁRIOS DAS TABELAS
-- =====================================================

COMMENT ON TABLE leads IS 'Tabela de leads capturados na landing page';
COMMENT ON TABLE trial_access IS 'Controle de acesso temporário de 7 dias';
COMMENT ON TABLE email_notifications IS 'Log de notificações por email enviadas';

-- Log da migração
DO $$
BEGIN
  RAISE NOTICE 'Leads system created successfully';
  RAISE NOTICE 'Tables: leads, trial_access, email_notifications';
  RAISE NOTICE 'Functions: create_trial_access, has_active_trial, expire_trials';
  RAISE NOTICE 'RLS enabled with appropriate policies';
END $$;
