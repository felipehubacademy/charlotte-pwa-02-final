// lib/hubspot-service.ts
// Serviço para integração com HubSpot

interface HubSpotContact {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  english_level: string;
  lead_source: string;
  trial_status: string;
  charlotte_lead_id: string;
  hs_lead_status: string;
  lifecyclestage: string;
  hubspot_owner_id?: string;
}

interface HubSpotResponse {
  id: string;
  properties: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export class HubSpotService {
  private static apiKey: string | null = null;
  private static baseUrl = 'https://api.hubapi.com/crm/v3/objects/contacts';
  private static defaultOwnerId: string | null = null;

  // Inicializar com API key
  static initialize(apiKey: string, defaultOwnerId?: string) {
    this.apiKey = apiKey;
    this.defaultOwnerId = defaultOwnerId || process.env.HUBSPOT_DEFAULT_OWNER_ID || null;
  }

  // Verificar se está configurado
  static isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Criar ou atualizar contato no HubSpot (evita duplicidade)
  static async createContact(contactData: {
    nome: string;
    email: string;
    telefone: string;
    nivel_ingles: string;
    lead_id: string;
  }): Promise<HubSpotResponse | null> {
    if (!this.isConfigured()) {
      console.log('HubSpot não configurado, pulando criação de contato');
      return null;
    }

    try {
      // 1. Verificar se contato já existe
      const existingContact = await this.findContactByEmail(contactData.email);
      
      if (existingContact) {
        console.log('📧 Contato já existe no HubSpot, atualizando:', existingContact.id);
        
        // Atualizar contato existente com novas informações
        const [firstname, ...lastnameParts] = contactData.nome.split(' ');
        const lastname = lastnameParts.join(' ') || '';

        const updates: any = {
          firstname,
          lastname,
          phone: contactData.telefone,
          hs_lead_status: 'NEW',
          origem: 'Charlotte 7 dias'
        };

        // Adicionar proprietário se configurado
        if (this.defaultOwnerId) {
          updates.hubspot_owner_id = this.defaultOwnerId;
        }

        const updateSuccess = await this.updateContact(existingContact.id, updates);
        
        if (updateSuccess) {
          console.log('✅ Contato atualizado no HubSpot:', existingContact.id);
          return existingContact;
        } else {
          console.error('❌ Falha ao atualizar contato existente');
          return null;
        }
      }

      // 2. Criar novo contato
      const [firstname, ...lastnameParts] = contactData.nome.split(' ');
      const lastname = lastnameParts.join(' ') || '';

      const hubspotContact: any = {
        firstname,
        lastname,
        email: contactData.email,
        phone: contactData.telefone,
        hs_lead_status: 'NEW',
        origem: 'Charlotte 7 dias'
      };

      // Adicionar proprietário se configurado
      if (this.defaultOwnerId) {
        hubspotContact.hubspot_owner_id = this.defaultOwnerId;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: hubspotContact
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        
        // Se for erro de conflito (contato já existe), tentar buscar e retornar
        if (response.status === 409) {
          console.log('⚠️ Conflito: contato já existe, buscando...');
          const existingContact = await this.findContactByEmail(contactData.email);
          if (existingContact) {
            console.log('✅ Contato encontrado após conflito:', existingContact.id);
            return existingContact;
          }
        }
        
        console.error('Erro ao criar contato no HubSpot:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        return null;
      }

      const result = await response.json();
      console.log('✅ Contato criado no HubSpot:', result.id);
      
      return result;

    } catch (error) {
      console.error('Erro na integração HubSpot:', error);
      return null;
    }
  }

  // Atualizar contato no HubSpot
  static async updateContact(contactId: string, updates: Partial<HubSpotContact>): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('HubSpot não configurado, pulando atualização de contato');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: updates
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro ao atualizar contato no HubSpot:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        return false;
      }

      console.log('✅ Contato atualizado no HubSpot:', contactId);
      return true;

    } catch (error) {
      console.error('Erro ao atualizar contato no HubSpot:', error);
      return false;
    }
  }

  // Buscar contato por email
  static async findContactByEmail(email: string): Promise<HubSpotResponse | null> {
    if (!this.isConfigured()) {
      console.log('HubSpot não configurado, pulando busca de contato');
      return null;
    }

    try {
      const searchUrl = `${this.baseUrl}/search`;
      
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email
                }
              ]
            }
          ],
          properties: [
            'firstname',
            'lastname',
            'email',
            'phone',
            'english_level',
            'trial_status',
            'charlotte_lead_id',
            'hs_lead_status',
            'lifecyclestage'
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro ao buscar contato no HubSpot:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        return null;
      }

      const result = await response.json();
      
      if (result.results && result.results.length > 0) {
        return result.results[0];
      }

      return null;

    } catch (error) {
      console.error('Erro ao buscar contato no HubSpot:', error);
      return null;
    }
  }

  // Atualizar status do trial
  static async updateTrialStatus(contactId: string, status: 'Active' | 'Expired' | 'Converted'): Promise<boolean> {
    return this.updateContact(contactId, {
      trial_status: status,
      hs_lead_status: status === 'Converted' ? 'CONNECTED' : 'NEW'
    });
  }

  // Marcar como convertido
  static async markAsConverted(contactId: string): Promise<boolean> {
    return this.updateContact(contactId, {
      trial_status: 'Converted',
      hs_lead_status: 'CONNECTED',
      lifecyclestage: 'customer'
    });
  }

  // Marcar como expirado
  static async markAsExpired(contactId: string): Promise<boolean> {
    return this.updateContact(contactId, {
      trial_status: 'Expired',
      hs_lead_status: 'UNQUALIFIED'
    });
  }

  // Criar nota no contato
  static async createNote(contactId: string, note: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('HubSpot não configurado, pulando criação de nota');
      return false;
    }

    try {
      const response = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            hs_note_body: note,
            hs_timestamp: new Date().toISOString()
          },
          associations: [
            {
              to: {
                id: contactId
              },
              types: [
                {
                  associationCategory: 'HUBSPOT_DEFINED',
                  associationTypeId: 214
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro ao criar nota no HubSpot:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        return false;
      }

      console.log('✅ Nota criada no HubSpot para contato:', contactId);
      return true;

    } catch (error) {
      console.error('Erro ao criar nota no HubSpot:', error);
      return false;
    }
  }

  // Obter estatísticas de leads
  static async getLeadStats(): Promise<{
    totalLeads: number;
    activeTrials: number;
    convertedTrials: number;
    expiredTrials: number;
  } | null> {
    if (!this.isConfigured()) {
      console.log('HubSpot não configurado, pulando estatísticas');
      return null;
    }

    try {
      const searchUrl = `${this.baseUrl}/search`;
      
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'lead_source',
                  operator: 'EQ',
                  value: 'Charlotte Landing Page'
                }
              ]
            }
          ],
          properties: [
            'trial_status',
            'hs_lead_status'
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro ao buscar estatísticas no HubSpot:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        return null;
      }

      const result = await response.json();
      const contacts = result.results || [];

      const stats = {
        totalLeads: contacts.length,
        activeTrials: contacts.filter((c: any) => c.properties.trial_status === 'Active').length,
        convertedTrials: contacts.filter((c: any) => c.properties.trial_status === 'Converted').length,
        expiredTrials: contacts.filter((c: any) => c.properties.trial_status === 'Expired').length
      };

      return stats;

    } catch (error) {
      console.error('Erro ao obter estatísticas do HubSpot:', error);
      return null;
    }
  }
}
