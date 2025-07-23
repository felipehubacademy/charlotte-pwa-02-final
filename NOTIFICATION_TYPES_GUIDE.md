# 🔔 Guia de Tipos de Notificação - Charlotte

## 🎯 **Estratégia de Notificações**

### **🎨 Achievements → In-App Cards (NÃO push notifications)**
- **Feedback imediato** durante uso ativo da app
- **Cards animados** com confetes e celebrações  
- **Melhor UX** - usuário está ativo e receptivo
- **Componente:** `components/achievements/AchievementNotification.tsx`

### **📱 Push Notifications → Reengajamento & Lembretes**
- **Usuários inativos** - trazê-los de volta
- **Lembretes importantes** - streaks, metas, desafios
- **Interações sociais** - convites, competições
- **Horários estratégicos** - quando usuário não está na app

---

## 📋 **Tipos de Push Notification Atuais**

### 1. **🔥 Streak Reminders**
Enviadas quando streak está em risco.

**Quando são enviadas:**
- 20-22h se usuário não praticou hoje
- Baseado no último horário de prática do usuário
- Apenas se streak > 0 dias

**Exemplo:**
```typescript
{
  title: "🔥 Your 7-day streak is at risk!",
  body: "Don't break the chain! Practice for just 5 minutes to keep your streak alive.",
  data: {
    type: "streak_reminder",
    streakDays: "7",
    urgency: "high"
  }
}
```

### 2. **💪 Weekly Challenges**
Enviadas para anunciar novos desafios semanais.

**Quando são enviadas:**
- Segundas-feiras, 9h (horário local)
- Apenas para usuários ativos na última semana
- Baseado no nível do usuário

**Exemplo:**
```typescript
{
  title: "💪 New Weekly Challenge: Pronunciation Master",
  body: "Join hundreds of learners in this week's challenge. Are you up for it?",
  data: {
    type: "weekly_challenge",
    challenge: "Pronunciation Master",
    duration: "week"
  }
}
```

### 3. **⏰ Practice Reminders**
Lembretes personalizados baseados no horário preferido do usuário.

**Quando são enviadas:**
- Horário definido pelo usuário nas configurações
- Apenas se não praticou nas últimas 24h
- Mensagem varia conforme o horário do dia

**Exemplo:**
```typescript
{
  title: "⏰ Good morning! Ready to practice?",
  body: "Start your day with a quick English practice session. Your brain is most receptive now!",
  data: {
    type: "practice_reminder",
    preferredTime: "09:00",
    timeSlot: "morning"
  }
}
```

### 4. **👥 Social Invites**
Convites para competições e atividades sociais.

**Quando são enviadas:**
- Quando outro usuário envia convite
- Para participar em competições
- Desafios entre amigos

**Exemplo:**
```typescript
{
  title: "👥 Maria invited you to compete!",
  body: "Join Maria in a pronunciation challenge. Show them what you've got!",
  data: {
    type: "social_invite",
    inviter: "Maria",
    activity: "pronunciation challenge"
  }
}
```

### 5. **🎯 Goal Reminders**
Lembretes sobre metas pessoais e progresso.

**Quando são enviadas:**
- Quando próximo de atingir uma meta
- Lembretes semanais de progresso
- Motivação para metas em atraso

**Exemplo:**
```typescript
{
  title: "🎯 You're 85% closer to your weekly XP goal!",
  body: "Just a few more practices and you'll reach your target. Don't give up now!",
  data: {
    type: "goal_reminder",
    goalType: "weekly_xp",
    progress: "85"
  }
}
```

### 3. **🔔 System Notifications**
Notificações básicas do sistema.

**Exemplos:**
```typescript
{
  title: "🔔 Notifications Enabled!",
  body: "You'll now receive updates from Charlotte",
  data: {
    type: "system",
    timestamp: "2025-07-23T16:18:55.749Z"
  }
}
```

---

## 🚀 **Como Adicionar Novos Tipos de Notificação**

### **Passo 1: Definir o Tipo**

Adicione ao enum/interface em `lib/firebase-admin-service.ts`:

```typescript
export interface FCMServerPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
  data?: Record<string, any>;
}

// Adicionar novos tipos de data
interface NotificationData {
  type: 'achievement' | 'streak' | 'reminder' | 'level_up' | 'social' | 'challenge';
  // ... outros campos específicos
}
```

### **Passo 2: Criar API Route**

Exemplo para notificações de streak:

```typescript
// app/api/notifications/send-streak/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminService } from '@/lib/firebase-admin-service';

export async function POST(request: NextRequest) {
  try {
    const { userId, streakDays } = await request.json();
    
    const adminService = getFirebaseAdminService();
    const success = await adminService.sendToUser(userId, {
      title: `🔥 ${streakDays}-Day Streak!`,
      body: `You're on fire! Keep the momentum going!`,
      data: {
        type: 'streak',
        streakDays: streakDays.toString(),
        url: '/chat'
      }
    });

    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
```

### **Passo 3: Implementar Trigger Logic**

Onde/quando a notificação deve ser enviada:

```typescript
// Exemplo: Em supabase-service.ts após salvar prática
async saveAudioPractice(data: AudioPracticeData) {
  // ... código existente ...

  // Verificar streak
  const userStats = await this.getUserStats(data.user_id);
  if (userStats.streak_days > 0 && userStats.streak_days % 5 === 0) {
    // Enviar notificação de streak
    await this.sendStreakNotification(data.user_id, userStats.streak_days);
  }
}

private async sendStreakNotification(userId: string, streakDays: number) {
  try {
    await fetch('/api/notifications/send-streak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, streakDays }),
    });
  } catch (error) {
    console.error('Failed to send streak notification:', error);
  }
}
```

### **Passo 4: Handle no Service Worker**

Adicionar em `public/firebase-messaging-sw-optimized.js`:

```javascript
// Handle background messages
self.addEventListener('message', (event) => {
  if (event.data?.type === 'streak') {
    // Lógica específica para streak notifications
    console.log('🔥 Streak notification received:', event.data);
  }
});
```

---

## 📝 **Templates para Novos Tipos**

### **🎯 Level Up Notifications**
```typescript
{
  title: "🎉 Level Up!",
  body: `Congratulations! You reached Level ${newLevel}`,
  data: {
    type: "level_up",
    oldLevel: "4",
    newLevel: "5",
    url: "/chat"
  }
}
```

### **⏰ Daily Reminder Notifications**
```typescript
{
  title: "📚 Time to Practice!",
  body: "Your daily English practice is waiting for you",
  data: {
    type: "reminder",
    reminderType: "daily",
    url: "/chat"
  }
}
```

### **👥 Social Notifications**
```typescript
{
  title: "🏆 Leaderboard Update!",
  body: "You're now #3 on the leaderboard!",
  data: {
    type: "social",
    event: "leaderboard_update",
    position: "3",
    url: "/chat"
  }
}
```

### **🎯 Challenge Notifications**
```typescript
{
  title: "🎯 New Challenge!",
  body: "Weekly pronunciation challenge is now available",
  data: {
    type: "challenge",
    challengeType: "pronunciation",
    difficulty: "intermediate",
    url: "/challenges"
  }
}
```

---

## 🔧 **Configuração Avançada**

### **Scheduling Notifications**
Para notificações agendadas, use um serviço como:
- **Vercel Cron Jobs**
- **Supabase Edge Functions**
- **External scheduler (Node-cron)**

### **Personalization**
```typescript
// Baseado no user_level
const getPersonalizedMessage = (userLevel: string, type: string) => {
  const messages = {
    'Novice': {
      'encouragement': "You're doing great! Keep practicing!",
      'tip': "Try speaking slowly and clearly for better pronunciation"
    },
    'Inter': {
      'encouragement': "Excellent progress! You're improving fast!",
      'tip': "Focus on complex sentence structures"
    },
    'Advanced': {
      'encouragement': "Outstanding! You're almost fluent!",
      'tip': "Practice idioms and advanced vocabulary"
    }
  };
  
  return messages[userLevel]?.[type] || "Keep up the great work!";
};
```

### **A/B Testing**
```typescript
// Testar diferentes mensagens
const getABTestMessage = (userId: string) => {
  const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const variant = hash % 2 === 0 ? 'A' : 'B';
  
  return variant === 'A' 
    ? "🎯 Ready for your next challenge?"
    : "🚀 Let's continue your English journey!";
};
```

---

## 📊 **Monitoring & Analytics**

### **Tracking Delivery**
```typescript
// Em firebase-admin-service.ts
async sendToUser(userId: string, payload: FCMServerPayload): Promise<boolean> {
  try {
    const result = await this.messaging.send(message);
    
    // Log para analytics
    console.log('📊 Notification sent:', {
      userId,
      type: payload.data?.type,
      success: true,
      messageId: result
    });
    
    return true;
  } catch (error) {
    console.error('📊 Notification failed:', {
      userId,
      type: payload.data?.type,
      error: error.message
    });
    
    return false;
  }
}
```

### **User Preferences**
Adicionar tabela `notification_preferences`:
```sql
CREATE TABLE notification_preferences (
  user_id TEXT PRIMARY KEY,
  achievements BOOLEAN DEFAULT true,
  reminders BOOLEAN DEFAULT true,
  social BOOLEAN DEFAULT true,
  marketing BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'America/Sao_Paulo'
);
```

---

## 🚀 **Exemplos de Implementação Rápida**

### **Implementar Notificação de Streak (5 minutos)**

1. **Criar API:**
```bash
# app/api/notifications/send-streak/route.ts
# (copiar template acima)
```

2. **Adicionar trigger:**
```typescript
// Em supabase-service.ts após updateUserProgress
if (streakDays > 0 && streakDays % 5 === 0) {
  fetch('/api/notifications/send-streak', {
    method: 'POST',
    body: JSON.stringify({ userId, streakDays })
  });
}
```

3. **Pronto!** Testável imediatamente.

---

## 🎯 **Próximas Implementações Sugeridas**

1. **🔥 Streak Notifications** (5 dias, 10 dias, etc.)
2. **📈 Level Up Notifications** (quando sobe de nível)
3. **⏰ Daily Reminders** (horário personalizável)
4. **🏆 Leaderboard Updates** (posição mudou)
5. **🎯 Weekly Challenges** (novos desafios)
6. **📊 Progress Reports** (relatório semanal)

Todas seguem o mesmo padrão: **API Route → Trigger Logic → FCM Delivery** 🚀 