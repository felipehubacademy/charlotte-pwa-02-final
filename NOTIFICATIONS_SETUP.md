# 🔔 Push Notifications Setup Guide

## Configuração Completa de Notificações PWA para iOS e Android

### 📋 **Pré-requisitos**

```bash
# 1. Instalar dependência web-push
npm install web-push @types/web-push

# 2. Gerar VAPID keys
npx web-push generate-vapid-keys
```

### 🔐 **Variáveis de Ambiente Necessárias**

Adicione ao seu `.env.local`:

```env
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=seu_vapid_public_key_aqui
VAPID_PRIVATE_KEY=seu_vapid_private_key_aqui
VAPID_SUBJECT=mailto:admin@charlotte-app.com
```

### 🗄️ **Configuração do Banco de Dados**

Execute a migração para criar a tabela:

```sql
-- Aplicar no Supabase Dashboard ou via CLI
-- Arquivo: supabase/migrations/009_create_push_subscriptions.sql
```

### 📱 **Compatibilidade por Plataforma**

| Recurso | iOS Safari | Android Chrome | Status |
|---------|------------|----------------|--------|
| **Push Notifications** | ✅ iOS 16.4+ (após A2HS) | ✅ Suporte completo | Implementado |
| **Service Worker** | ✅ Limitado | ✅ Completo | Implementado |
| **Background Sync** | ❌ Muito limitado | ✅ Completo | Fallback implementado |
| **Declarative Web Push** | ✅ iOS 18.4+ | ➖ Fallback padrão | Implementado |

### 🚀 **Como Usar**

#### 1. **No Frontend - Gerenciar Subscriptions**

```tsx
import NotificationManager from '@/components/notifications/NotificationManager';

// Em qualquer página/componente
<NotificationManager className="my-4" />
```

#### 2. **No Backend - Enviar Notificações**

```typescript
import { pushNotificationServer } from '@/lib/push-notification-server';

// Enviar conquista para usuário específico
await pushNotificationServer.sendAchievementNotification(
  userId, 
  { title: 'Perfect Pronunciation!', description: 'You achieved 95% accuracy!' }
);

// Enviar lembrete
await pushNotificationServer.sendReminderNotification(
  userId,
  'Time to practice English with Charlotte!'
);

// Enviar para todos usuários de um nível
await pushNotificationServer.sendToUserLevel('Novice', {
  title: 'New Feature Available!',
  body: 'Try the new voice conversation mode',
  url: '/chat'
});
```

### 📐 **Estratégias por Plataforma**

#### **iOS (Safari 16.4+)**
- ✅ **Requisito crítico**: PWA deve estar instalado (Add to Home Screen)
- ✅ Suporte a Declarative Web Push (iOS 18.4+)
- ⚠️ Limitações: Background sync limitado, bugs conhecidos
- 🎯 **Estratégia**: Formato declarativo + fallbacks robustos

```typescript
// Formato iOS (Declarative Web Push)
{
  "web_push": 8030,
  "notification": {
    "title": "🏆 Nova conquista!",
    "body": "Você completou 5 conversas!",
    "navigate": "/chat",
    "app_badge": "1"
  }
}
```

#### **Android (Chrome/Firefox)**
- ✅ Suporte completo desde Chrome 42+
- ✅ Background sync funcional
- ✅ Prompt automático de instalação
- 🎯 **Estratégia**: Usar formato padrão Web Push API

```typescript
// Formato Android/Desktop (Padrão)
{
  "title": "🏆 Nova conquista!",
  "body": "Você completou 5 conversas!",
  "icon": "/icons/icon-192x192.png",
  "url": "/chat"
}
```

### 🔧 **Funcionalidades Implementadas**

1. **✅ Detecção Automática de Plataforma**
   - Identifica iOS, Android, Desktop
   - Aplica estratégias específicas por plataforma

2. **✅ Gerenciamento Inteligente de Subscriptions**
   - Subscription única por usuário/endpoint
   - Cleanup automático de subscriptions inválidas
   - Retry logic para falhas temporárias

3. **✅ Formatos Adaptativos**
   - Declarative Web Push para iOS 18.4+
   - Formato padrão para outras plataformas
   - Fallback para notificações locais

4. **✅ Interface de Usuário Intuitiva**
   - Instruções específicas para iOS (Add to Home Screen)
   - Estados visuais claros (Enabled/Disabled)
   - Testes de notificação integrados

5. **✅ Error Handling Robusto**
   - Tratamento de permissões negadas
   - Fallbacks para dispositivos não suportados
   - Logs detalhados para debugging

### 📊 **Métricas e Monitoramento**

```typescript
// Logs implementados para monitoramento
console.log('📨 Push notifications sent: X successful, Y failed');
console.log('✅ Notification sent to platform device');
console.log('🗑️ Deactivated invalid subscription');
```

### 🐛 **Troubleshooting Common Issues**

#### **iOS Issues**
- **"Notifications not working"** → Verificar se PWA está instalado
- **"Permission denied"** → Reinstalar PWA e tentar novamente
- **"White screen on notification"** → Bug conhecido do WebKit

#### **Android Issues**
- **"Subscription failed"** → Verificar VAPID keys
- **"No prompt shown"** → Verificar service worker registration

#### **General Issues**
- **"VAPID keys not configured"** → Verificar variáveis de ambiente
- **"Database not available"** → Verificar conexão Supabase

### 🔄 **Roadmap Futuro**

1. **🎯 Scheduled Notifications**
   - Lembretes baseados em timezone do usuário
   - Notificações de streak quebrado

2. **📈 Advanced Analytics**
   - Taxa de engagement com notificações
   - A/B testing de mensagens

3. **🤖 Smart Notifications**
   - ML para timing optimal
   - Personalização baseada em comportamento

4. **🌐 Multilingual Support**
   - Notificações no idioma preferido
   - Localização de conteúdo

### 📚 **Recursos Adicionais**

- [Web Push Protocol (RFC 8030)](https://tools.ietf.org/html/rfc8030)
- [Apple's Declarative Web Push](https://webkit.org/blog/16535/meet-declarative-web-push/)
- [Chrome Push Notifications](https://developer.chrome.com/docs/push-notifications/)
- [PWA iOS Limitations](https://firt.dev/ios-16-4-pwa)

---

**💡 Dica**: Para máxima compatibilidade, sempre teste em dispositivos físicos iOS e Android, não apenas em emuladores.

**⚠️ Importante**: iOS requer que o usuário adicione o PWA à tela inicial ANTES de poder receber notificações push. 