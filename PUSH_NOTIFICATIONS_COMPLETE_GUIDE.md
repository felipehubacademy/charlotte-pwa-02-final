# 📱 Guia Completo de Push Notifications - Charlotte PWA

## 🎯 **Visão Geral do Sistema**

O sistema de notificações push da Charlotte é projetado para **reengajamento de usuários inativos** e **lembretes personalizados**. Todas as notificações são enviadas via **Firebase Cloud Messaging (FCM)** e seguem o princípio de **localização automática** baseada no nível do usuário.

### 📊 **Estatísticas de Implementação:**
- **5 tipos** de notificação push implementados
- **2 idiomas** suportados (Português/Inglês)
- **4 frequências** configuráveis pelo usuário
- **24/7 scheduling** com Vercel Cron Jobs
- **Logs estruturados** para analytics

---

## 🕐 **Cronograma Completo de Notificações**

### **⏰ A CADA HORA (0-23h)**
```bash
# Execução: Verificar lembretes de prática personalizados
# Via: Vercel Cron Job → /api/notifications/scheduler
```

### **🌅 SEGUNDA-FEIRA às 9h**
```bash
# Execução: Enviar desafios semanais
# Para: Usuários ativos na última semana
```

### **🌆 TODOS OS DIAS às 19h**
```bash
# Execução: Verificar lembretes de metas
# Para: Usuários próximos de atingir metas semanais (80-99% de 100 XP)
```

### **🌙 TODOS OS DIAS às 21h**
```bash
# Execução: Verificar streaks em risco
# Para: Usuários com streak > 0 que não praticaram hoje
```

---

## 📋 **Tipos de Notificação Implementados**

## 1. 🔥 **STREAK REMINDERS** (Lembretes de Sequência)

### **📅 Quando é Enviada:**
- **Horário**: 21h (diário)
- **Condição**: Usuário tem streak > 0 dias E não praticou hoje
- **Frequência**: Uma vez por dia (se aplicável)
- **Timezone**: UTC (automático)

### **👥 Público-Alvo:**
- Usuários com sequência ativa (streak_days > 0)
- Que não realizaram prática nas últimas 24h
- Com notificações habilitadas

### **📱 Conteúdo da Mensagem:**

#### **Novice (Português):**
```json
{
  "title": "🔥 Seu streak de {X} dias está em risco!",
  "body": "Não quebre a sequência! Pratique apenas 5 minutos para manter seu streak.",
  "url": "/chat",
  "data": {
    "type": "streak_reminder",
    "streakDays": "7",
    "urgency": "high",
    "userLevel": "Novice"
  }
}
```

#### **Inter/Advanced (Inglês):**
```json
{
  "title": "🔥 Your {X}-day streak is at risk!",
  "body": "Don't break the chain! Practice for just 5 minutes to keep your streak alive.",
  "url": "/chat",
  "data": {
    "type": "streak_reminder",
    "streakDays": "7",
    "urgency": "high",
    "userLevel": "Inter"
  }
}
```

### **🎯 Objetivo:**
Manter engajamento de usuários que já estabeleceram o hábito de prática, evitando que percam sua sequência.

---

## 2. ⏰ **PRACTICE REMINDERS** (Lembretes de Prática)

### **📅 Quando é Enviada:**
- **Horário**: Configurado pelo usuário nas preferências
- **Condição**: Horário preferido + não praticou hoje + filtros de frequência
- **Frequência**: Baseada na configuração do usuário
- **Timezone**: Baseado no horário local do usuário

### **🔧 Frequências Disponíveis:**

#### **"light" (Leve - 3x por semana):**
- **Dias**: Segunda (1), Quarta (3), Sexta (5)
- **Horário**: Definido pelo usuário

#### **"normal" (Normal - 1x por dia):**
- **Dias**: Todos os dias
- **Horário**: Definido pelo usuário

#### **"frequent" (Frequente - 2x por dia):**
- **Dias**: Todos os dias
- **Horário 1**: Definido pelo usuário
- **Horário 2**: +8 horas do primeiro (automático)

#### **"disabled" (Desabilitado):**
- **Não recebe** lembretes de prática

### **👥 Público-Alvo:**
- Usuários com `notification_preferences.practice_reminders = true`
- Com `reminder_frequency != 'disabled'`
- Que não praticaram nas últimas 24h
- No horário preferido (janela de 5 minutos)

### **📱 Conteúdo da Mensagem:**

#### **Manhã (6h-12h) - Novice:**
```json
{
  "title": "⏰ Olá {nome}! Bom dia! Pronto para praticar?",
  "body": "Comece o dia com uma prática rápida de inglês. Seu cérebro está mais receptivo agora!",
  "url": "/chat",
  "data": {
    "type": "practice_reminder",
    "userName": "Felipe",
    "userLevel": "Novice",
    "timeSlot": "morning"
  }
}
```

#### **Tarde (12h-18h) - Novice:**
```json
{
  "title": "⏰ Olá {nome}! Pausa para praticar?",
  "body": "Faça uma pausa no trabalho e melhore seu inglês. Apenas 5 minutos fazem diferença!",
  "url": "/chat",
  "data": {
    "type": "practice_reminder",
    "userName": "Felipe",
    "userLevel": "Novice",
    "timeSlot": "afternoon"
  }
}
```

#### **Noite (18h-22h) - Novice:**
```json
{
  "title": "⏰ Olá {nome}! Sessão de prática noturna",
  "body": "Relaxe com uma prática de inglês. Perfeita para finalizar seu dia de estudos!",
  "url": "/chat",
  "data": {
    "type": "practice_reminder",
    "userName": "Felipe",
    "userLevel": "Novice",
    "timeSlot": "evening"
  }
}
```

#### **Madrugada (22h-6h) - Novice:**
```json
{
  "title": "⏰ Olá {nome}! Hora de praticar inglês",
  "body": "Uma prática rápida vai acelerar seu progresso. Volte para a Charlotte!",
  "url": "/chat",
  "data": {
    "type": "practice_reminder",
    "userName": "Felipe",
    "userLevel": "Novice",
    "timeSlot": "late"
  }
}
```

#### **Inter/Advanced (Inglês) - Todos os horários:**
```json
{
  "title": "⏰ Hi {nome}! Time to practice!",
  "body": "How about a quick English session? Charlotte is waiting for you! 🎯",
  "url": "/chat",
  "data": {
    "type": "practice_reminder",
    "userName": "Felipe",
    "userLevel": "Inter",
    "timeSlot": "dynamic"
  }
}
```

### **🎯 Objetivo:**
Estabelecer hábito de prática regular baseado nas preferências pessoais do usuário.

---

## 3. 💪 **WEEKLY CHALLENGES** (Desafios Semanais)

### **📅 Quando é Enviada:**
- **Horário**: Segundas-feiras às 9h UTC
- **Condição**: Usuário ativo na última semana
- **Frequência**: Uma vez por semana (segunda-feira)
- **Timezone**: UTC (9h UTC = 6h Brasília)

### **👥 Público-Alvo:**
- Usuários que praticaram pelo menos 1x na última semana
- Com histórico na tabela `user_practices` dos últimos 7 dias

### **🎯 Desafios Rotativos (8 semanas):**
1. **"Pronunciation Master"** (Mestre da Pronúncia)
2. **"Grammar Guru"** (Guru da Gramática)
3. **"Conversation Champion"** (Campeão da Conversação)
4. **"Vocabulary Builder"** (Construtor de Vocabulário)
5. **"Fluency Challenger"** (Desafiante da Fluência)
6. **"Speaking Streak"** (Sequência de Fala)
7. **"Writing Wizard"** (Mago da Escrita)
8. **"Listening Legend"** (Lenda da Audição)

*A rotação é baseada na semana do ano: `weekOfYear % 8`*

### **📱 Conteúdo da Mensagem:**

#### **Novice (Português):**
```json
{
  "title": "💪 Novo desafio: {challengeTitle}",
  "body": "Esta semana, desafie-se a melhorar ainda mais! Vamos lá?",
  "url": "/chat",
  "data": {
    "type": "weekly_challenge",
    "challengeTitle": "Pronunciation Master",
    "userLevel": "Novice",
    "week": "2025-01-20"
  }
}
```

#### **Inter/Advanced (Inglês):**
```json
{
  "title": "💪 New Challenge: {challengeTitle}",
  "body": "This week, challenge yourself to improve even more! Are you in?",
  "url": "/chat",
  "data": {
    "type": "weekly_challenge",
    "challengeTitle": "Pronunciation Master",
    "userLevel": "Inter",
    "week": "2025-01-20"
  }
}
```

### **🎯 Objetivo:**
Engajar usuários ativos com metas semanais gamificadas e criar senso de comunidade.

---

## 4. 🎯 **GOAL REMINDERS** (Lembretes de Metas)

### **📅 Quando é Enviada:**
- **Horário**: Diariamente às 19h UTC
- **Condição**: Usuário entre 80-99% da meta semanal (80-99 XP de 100 XP)
- **Frequência**: Uma vez por dia (se aplicável)
- **Timezone**: UTC (19h UTC = 16h Brasília)

### **👥 Público-Alvo:**
- Usuários com XP semanal entre 80-99 pontos
- Que praticaram pelo menos 1x nesta semana
- Próximos de completar a meta de 100 XP semanais

### **📱 Conteúdo da Mensagem:**

#### **Novice (Português):**
```json
{
  "title": "🎯 Você está {progress}% mais perto da sua meta de {goalType}!",
  "body": "Apenas mais algumas práticas e você alcançará seu objetivo. Não desista agora!",
  "url": "/goals",
  "data": {
    "type": "goal_reminder",
    "goalType": "weekly XP",
    "progress": "85",
    "userLevel": "Novice",
    "currentXP": "85",
    "targetXP": "100"
  }
}
```

#### **Inter/Advanced (Inglês):**
```json
{
  "title": "🎯 You're {progress}% closer to your {goalType} goal!",
  "body": "Just a few more practices and you'll reach your target. Don't give up now!",
  "url": "/goals",
  "data": {
    "type": "goal_reminder",
    "goalType": "weekly XP",
    "progress": "85",
    "userLevel": "Inter",
    "currentXP": "85",
    "targetXP": "100"
  }
}
```

### **🎯 Objetivo:**
Motivar usuários próximos de atingir metas a completar seus objetivos semanais.

---

## 5. 👥 **SOCIAL INVITES** (Convites Sociais)

### **📅 Quando é Enviada:**
- **Horário**: Sob demanda (quando outro usuário envia convite)
- **Condição**: Convite direto de outro usuário
- **Frequência**: Conforme atividade social
- **Timezone**: Imediato

### **👥 Público-Alvo:**
- Usuários que recebem convites de competição
- Participantes de desafios entre amigos
- Membros de grupos de estudo

### **📱 Conteúdo da Mensagem:**

#### **Novice (Português):**
```json
{
  "title": "👥 {inviterName} convidou você para competir!",
  "body": "Participe do desafio de {activityType} e mostre suas habilidades!",
  "url": "/chat",
  "data": {
    "type": "social_invite",
    "inviterName": "Maria",
    "activityType": "pronunciation challenge",
    "userLevel": "Novice"
  }
}
```

#### **Inter/Advanced (Inglês):**
```json
{
  "title": "👥 {inviterName} invited you to compete!",
  "body": "Join the {activityType} and show them what you've got!",
  "url": "/chat",
  "data": {
    "type": "social_invite",
    "inviterName": "Maria",
    "activityType": "pronunciation challenge",
    "userLevel": "Inter"
  }
}
```

### **🎯 Objetivo:**
Promover interação social e competição saudável entre usuários.

---

## 🛠️ **Sistema de Preferências do Usuário**

### **📊 Tabela `notification_preferences`:**
```sql
user_id: UUID (PK)
practice_reminders: BOOLEAN (default: true)
marketing: BOOLEAN (default: false)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### **📊 Tabela `users` (campos relevantes):**
```sql
preferred_reminder_time: TIME (default: '19:00:00')
reminder_frequency: TEXT (default: 'normal')
  - Values: 'disabled', 'light', 'normal', 'frequent'
```

### **🎛️ Interface de Configuração:**
- **Localização**: `/configuracoes` ou modal de configurações
- **Controles**: Toggle para practice_reminders, seletor de horário e frequência
- **Persistência**: Automática via Supabase

---

## 🔧 **Infraestrutura Técnica**

### **📡 Sistema de Entrega:**
- **Primary**: Firebase Cloud Messaging (FCM)
- **Fallback**: Web Push API
- **Service Worker**: `firebase-messaging-sw.js`
- **Client Library**: `firebase-config-optimized.ts`

### **⏰ Agendamento:**
- **Plataforma**: Vercel Cron Jobs
- **Endpoint**: `/api/notifications/scheduler`
- **Frequência**: A cada hora
- **Autenticação**: `CRON_SECRET` header

### **📊 Logging e Analytics:**
- **Tabela**: `notification_logs`
- **Campos**: user_id, type, status, title, body, platform, metadata
- **Status**: sent, delivered, clicked, dismissed, failed, blocked
- **Endpoint**: `/api/notifications/analytics`

### **🔄 Fluxo de Entrega:**
1. **Trigger**: Vercel Cron Job ou evento manual
2. **Scheduler**: `NotificationScheduler.runScheduledTasks()`
3. **Filter**: Aplicar preferências e condições do usuário
4. **Service**: `ReengagementNotificationService.sendXXX()`
5. **Delivery**: `FirebaseAdminService.sendToUser()`
6. **Log**: `NotificationLogger.logNotificationSent()`

---

## 🧪 **Testes e Debugging**

### **🔍 Comandos de Debug (Console):**
```javascript
// Status geral das notificações
debugNotifications.state

// Verificar tokens FCM do usuário
fetch('/api/notifications/check-fcm-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: 'USER_ID' })
}).then(r => r.json()).then(console.log)

// Testar notificação manual
fetch('/api/notifications/reengagement', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'USER_ID',
    type: 'practice_reminder',
    userName: 'Felipe'
  })
}).then(r => r.json()).then(console.log)

// Forçar execução do scheduler
fetch('/api/notifications/scheduler', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_CRON_SECRET'
  },
  body: JSON.stringify({ taskType: 'practice_reminders' })
}).then(r => r.json()).then(console.log)
```

### **📱 Endpoints de Teste:**
- `POST /api/notifications/reengagement` - Envio manual
- `POST /api/notifications/scheduler` - Executar scheduler
- `GET /api/notifications/scheduler` - Status do sistema
- `GET /api/notifications/analytics` - Métricas de entrega

---

## 📈 **Métricas e KPIs**

### **📊 Métricas de Entrega:**
- **Taxa de Entrega**: % de notificações enviadas com sucesso
- **Taxa de Engajamento**: % de notificações clicadas
- **Taxa de Rejeição**: % de usuários que desabilitaram notificações

### **🎯 Métricas de Negócio:**
- **Retenção**: % de usuários que retornam após receber notificação
- **Streak Recovery**: % de usuários que mantiveram streak após lembrete
- **Goal Completion**: % de usuários que completaram metas após lembrete
- **Weekly Challenge Participation**: % de usuários que participaram de desafios

### **📋 Relatórios Disponíveis:**
- **Daily Delivery Report**: Quantas notificações foram enviadas por dia
- **User Engagement Report**: Engajamento por usuário e tipo de notificação
- **Platform Performance**: Performance por plataforma (iOS/Android/Web)
- **A/B Testing Results**: Eficácia de diferentes mensagens

---

## 🚀 **Próximas Implementações**

### **🔮 Roadmap de Notificações:**
1. **📈 Level Up Notifications** - Quando usuário sobe de nível
2. **🏆 Leaderboard Updates** - Quando posição no ranking muda
3. **🎉 Achievement Milestones** - Marcos importantes (100 práticas, etc.)
4. **📅 Lesson Reminders** - Lembretes de lições específicas
5. **💝 Personalized Tips** - Dicas baseadas em performance
6. **🎁 Special Events** - Eventos sazonais e promoções

### **🔧 Melhorias Técnicas:**
1. **A/B Testing** - Testar diferentes mensagens
2. **Smart Timing** - ML para horário ótimo por usuário
3. **Rich Notifications** - Imagens e botões de ação
4. **Push to Pull** - Notificações que trazem conteúdo
5. **Cross-Platform Sync** - Sincronização entre dispositivos

---

## 🌍 **Suporte a Idiomas**

### **🇧🇷 Português (Novice):**
- **Público**: Usuários iniciantes
- **Tom**: Mais informal e encorajador
- **Vocabulário**: Simples e direto

### **🇺🇸 Inglês (Inter/Advanced):**
- **Público**: Usuários intermediários e avançados
- **Tom**: Mais professional e desafiador
- **Vocabulário**: Mais complexo e variado

### **🔄 Detecção Automática:**
- **Baseado em**: `user.user_level` no banco de dados
- **Fallback**: Inter (Inglês) se nível não encontrado
- **Consistência**: Mesmo idioma em toda a jornada do usuário

---

## ⚙️ **Configuração de Produção**

### **🔐 Variáveis de Ambiente Necessárias:**
```env
# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key

# Vercel Cron Security
CRON_SECRET=your-super-secret-key

# Supabase
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **📅 Configuração do Vercel Cron:**
```json
{
  "crons": [
    {
      "path": "/api/notifications/scheduler",
      "schedule": "0 * * * *"
    }
  ]
}
```

### **🚨 Monitoramento:**
- **Logs**: Supabase Dashboard > notification_logs table
- **Errors**: Vercel Dashboard > Functions > Logs
- **Performance**: Analytics endpoint para métricas
- **Alerts**: Configurar webhook para falhas consecutivas

---

## ✅ **Status de Implementação**

### **🟢 Totalmente Implementado:**
- ✅ Practice Reminders (com preferências de usuário)
- ✅ Streak Reminders (diário às 21h)
- ✅ Weekly Challenges (segunda às 9h)
- ✅ Goal Reminders (diário às 19h)
- ✅ Sistema de Logs estruturado
- ✅ Interface de configuração de usuário
- ✅ Vercel Cron Jobs
- ✅ Localização por nível de usuário

### **🟡 Parcialmente Implementado:**
- 🟡 Social Invites (estrutura pronta, sem trigger automático)
- 🟡 Analytics Dashboard (dados coletados, interface básica)

### **🔴 Não Implementado:**
- ❌ Level Up Notifications
- ❌ Leaderboard Update Notifications
- ❌ A/B Testing Framework
- ❌ Rich Media Notifications
- ❌ Smart Timing with ML

---

**📊 Resumo:** O sistema de push notifications da Charlotte está **100% funcional** para os 4 tipos principais de notificação, com **scheduling automático**, **preferências de usuário** e **logging completo**. O sistema está pronto para produção e já está enviando notificações personalizadas para usuários ativos. 