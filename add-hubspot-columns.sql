-- Adicionar colunas HubSpot à tabela leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS hubspot_contact_id VARCHAR(255);

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS hubspot_deal_id VARCHAR(255);

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('hubspot_contact_id', 'hubspot_deal_id');
