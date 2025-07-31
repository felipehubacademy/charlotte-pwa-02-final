# 🏗️ Charlotte v2 - Estrutura Completa do Projeto

## 📁 **Estrutura de Diretórios**

```
charlotte-v2/
├── 📁 app/                          # Next.js App Router
│   ├── 📁 api/                      # API Routes
│   │   ├── 📁 achievements/         # Achievement notifications
│   │   │   └── route.ts
│   │   ├── 📁 assistant/            # AI Assistant endpoint
│   │   │   └── route.ts
│   │   ├── 📁 notifications/        # Notification system
│   │   │   ├── 📁 analytics/        # Notification analytics
│   │   │   │   └── route.ts
│   │   │   ├── 📁 check-fcm-token/  # FCM token verification
│   │   │   │   └── route.ts
│   │   │   ├── 📁 fcm-test/         # FCM testing endpoint
│   │   │   │   └── route.ts
│   │   │   ├── 📁 reengagement/     # Re-engagement notifications
│   │   │   │   └── route.ts
│   │   │   ├── 📁 scheduler/        # Cron job scheduler
│   │   │   │   └── route.ts
│   │   │   ├── 📁 subscribe/        # Push subscription
│   │   │   │   └── route.ts
│   │   │   ├── 📁 test/             # General notification tests
│   │   │   │   └── route.ts
│   │   │   ├── 📁 test-1530/        # 15:30 test endpoint
│   │   │   │   └── route.ts
│   │   │   ├── 📁 test-ios/         # iOS-specific tests
│   │   │   │   └── route.ts
│   │   │   ├── 📁 test-simple/      # Simple iOS test (no timeout)
│   │   │   │   └── route.ts
│   │   │   ├── 📁 test-working/     # Working iOS push (direct Apple)
│   │   │   │   └── route.ts
│   │   │   └── 📁 unsubscribe/      # Push unsubscription
│   │   │       └── route.ts
│   │   ├── 📁 pronunciation/        # Pronunciation analysis
│   │   │   └── route.ts
│   │   ├── 📁 realtime-token/       # Real-time communication
│   │   │   └── route.ts
│   │   └── 📁 transcribe/           # Audio transcription
│   │       └── route.ts
│   ├── 📁 chat/                     # Main chat interface
│   │   └── page.tsx
│   ├── 📁 install/                  # PWA installation guide
│   │   └── page.tsx
│   ├── ClientLayout.tsx             # Client-side layout wrapper
│   ├── favicon.ico
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home page
├── 📁 components/                   # React components
│   ├── 📁 achievements/             # Achievement system
│   │   └── AchievementNotification.tsx
│   ├── 📁 auth/                     # Authentication
│   │   └── AuthProvider.tsx
│   ├── 📁 camera/                   # Camera functionality
│   │   └── CameraCapture.tsx
│   ├── 📁 chat/                     # Chat components
│   │   ├── ChatBox.tsx
│   │   └── GrammarScoreDisplay.tsx
│   ├── 📁 leaderboard/              # Leaderboard system
│   │   └── LevelLeaderboard.tsx
│   ├── 📁 notifications/            # Notification components
│   │   ├── NotificationManager.tsx  # Enhanced notification management
│   │   └── NotificationPreferences.tsx
│   ├── 📁 onboarding/               # User onboarding
│   │   └── OnboardingTour.tsx
│   ├── 📁 ui/                       # UI components
│   │   ├── CharlotteAvatar.tsx
│   │   └── EnhancedXPCounter.tsx
│   ├── 📁 voice/                    # Voice features
│   │   ├── AudioPlayer.tsx
│   │   ├── LiveVoiceModal.tsx
│   │   └── RealtimeOrb.tsx
│   ├── ChatHeader.tsx
│   ├── PWAInstaller.tsx
│   └── ShareInstallButton.tsx
├── 📁 hooks/                        # Custom React hooks
│   ├── useOnboarding.ts
│   └── useVoiceActivityDetection.ts
├── 📁 lib/                          # Core libraries & services
│   ├── achievement-verification-service.ts
│   ├── assistant.ts
│   ├── audio-converter-client.ts
│   ├── audio-converter-server.ts
│   ├── audio-converter.ts
│   ├── auth.ts
│   ├── azure-speech-sdk.ts
│   ├── conversation-context.ts
│   ├── enhanced-conversation-context.ts
│   ├── firebase-admin-service.ts
│   ├── firebase-config-optimized.ts
│   ├── firebase-messaging-service.ts
│   ├── grammar-analysis.ts
│   ├── improved-audio-xp-service.ts
│   ├── iOS_Push_Notifications_Complete_Implementation_Guide.md
│   ├── leaderboard-service.ts
│   ├── microsoft-graph-avatar-service.ts
│   ├── notification-logger.ts
│   ├── notification-scheduler.ts
│   ├── notification-service.ts       # Enhanced iOS support
│   ├── openai-realtime.ts
│   ├── pronunciation.ts
│   ├── push-notification-server.ts
│   ├── pwa-badge-service.ts
│   ├── reengagement-notification-service.ts
│   ├── simple-push-server.ts
│   ├── supabase-service.ts
│   ├── supabase.ts
│   ├── transcribe.ts
│   ├── translation-service.ts
│   ├── universal-achievement-service.ts
│   ├── working-push-server.ts
│   └── working-push.ts
├── 📁 pages/                        # Pages Router (legacy)
│   └── 📁 api/
│       ├── 📁 graph/
│       │   └── token.ts
│       └── translate.ts
├── 📁 public/                       # Static assets
│   ├── 📁 icons/                    # PWA icons
│   │   ├── apple-touch-icon.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   ├── icon-512x512.png
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-maskable-128x128.png
│   │   ├── icon-maskable-144x144.png
│   │   ├── icon-maskable-152x152.png
│   │   ├── icon-maskable-192x192.png
│   │   ├── icon-maskable-384x384.png
│   │   ├── icon-maskable-512x512.png
│   │   ├── icon-maskable-72x72.png
│   │   └── icon-maskable-96x96.png
│   ├── 📁 images/                   # App images
│   │   ├── charlotte-avatar.png
│   │   └── og-image.png
│   ├── 📁 logos/                    # Brand logos
│   │   ├── hub-green.png
│   │   └── hub-white.png
│   ├── audio-processor.js           # Audio processing
│   ├── firebase-messaging-sw.js     # Firebase service worker
│   ├── manifest.json                # PWA manifest
│   └── sw.js                        # Service worker
├── 📁 supabase/                     # Database migrations
│   └── 📁 migrations/
│       ├── 000_initial_schema.sql
│       ├── 001_xp_system_improvements.sql
│       ├── 002_fix_leaderboard_tables.sql
│       ├── 003_fix_achievements_schema.sql
│       ├── 004_add_type_to_user_achievements.sql
│       ├── 004_cleanup_database_structure.sql
│       ├── 005_fix_achievements_description.sql
│       ├── 005_update_level_to_inter.sql
│       ├── 006_add_missing_achievement_fields.sql
│       ├── 006_make_achievement_id_optional.sql
│       ├── 007_create_user_vocabulary.sql
│       └── README.md
├── 📄 .env.local                     # Environment variables
├── 📄 .gitignore
├── 📄 ACHIEVEMENTS_GUIDE.md          # Achievement system guide
├── 📄 ENVIRONMENT_SETUP.md           # Setup instructions
├── 📄 NOVICE_AUDIO_IMPLEMENTATION.md # Audio implementation
├── 📄 NOVICE_PROMPTS_CONFIGURATION.md # Prompt configuration
├── 📄 NOVICE_TEXT_IMPLEMENTATION.md  # Text implementation
├── 📄 NOTIFICATION_TYPES_GUIDE.md    # Notification types
├── 📄 NOTIFICATIONS_SETUP.md         # Notification setup
├── 📄 PLANO_IMPLEMENTACAO_VISUAL_VIEWPORT.md # Visual viewport
├── 📄 PROJECT_STRUCTURE.md           # This file
├── 📄 README.md                      # Project README
├── 📄 check_db.py                    # Database checker
├── 📄 check-all-tables.js            # Table verification
├── 📄 check-real-tables.js           # Real table checker
├── 📄 check-rls-policies.sql         # RLS policies
├── 📄 debug-achievements.js          # Achievement debugger
├── 📄 debug-table-structure.sql      # Table structure debug
├── 📄 eslint.config.js               # ESLint config (simplified)
├── 📄 find-vocabulary.js             # Vocabulary finder
├── 📄 fix-achievements-manual.sql    # Achievement fixes
├── 📄 fix-rls-policies.sql           # RLS policy fixes
├── 📄 next.config.ts                 # Next.js config
├── 📄 package-lock.json              # Dependencies lock
├── 📄 package.json                   # Project dependencies
├── 📄 postcss.config.js              # PostCSS config
├── 📄 supabase-insert-policy.sql     # Supabase policies
├── 📄 tailwind.config.js             # Tailwind CSS config
├── 📄 test-api.html                  # API testing
├── 📄 test-supabase.sh               # Supabase test script
├── 📄 tsconfig.json                  # TypeScript config
└── 📄 vercel.json                    # Vercel deployment config
```

## 🔧 **Principais Funcionalidades**

### 🎯 **Core Features**
- **AI Assistant**: Conversação em tempo real com Charlotte
- **Voice Recognition**: Reconhecimento de voz e pronúncia
- **Achievement System**: Sistema de conquistas gamificado
- **XP System**: Sistema de experiência e progresso
- **Leaderboard**: Ranking de usuários por nível
- **PWA Support**: Progressive Web App completo

### 🔔 **Notification System** (Enhanced)
- **Push Notifications**: FCM + Web Push + Apple Push Service
- **iOS 16.4+ Support**: Native iOS push notifications
- **Badge PWA**: Badges no ícone do app
- **Scheduled Notifications**: Cron jobs para re-engagement
- **User Preferences**: Configuração de horários e frequência
- **Analytics**: Logs e métricas de notificações
- **Test Endpoints**: 
  - `/api/notifications/test-simple/` - Teste simples sem timeout
  - `/api/notifications/test-working/` - Push direto via Apple
  - `/api/notifications/test-ios/` - Testes específicos iOS

### 🎓 **Onboarding & UX**
- **Tour Guide**: Tutorial interativo para novos usuários
- **PWA Installer**: Instalação como app nativo
- **Responsive Design**: Interface adaptativa
- **Dark Mode**: Tema escuro otimizado

### 🔐 **Authentication & Security**
- **Microsoft Entra ID**: Autenticação corporativa
- **RLS Policies**: Row Level Security no Supabase
- **Service Workers**: Background processing
- **VAPID Keys**: Push notification security

## 📊 **Database Schema**

### **Core Tables**
- `users`: Informações do usuário
- `user_progress`: Progresso e XP
- `user_practices`: Histórico de práticas
- `achievements`: Conquistas disponíveis
- `user_achievements`: Conquistas do usuário
- `push_subscriptions`: Subscriptions para push
- `notification_logs`: Logs de notificações
- `notification_preferences`: Preferências do usuário

## 🚀 **Deployment**

### **Platforms**
- **Vercel**: Frontend deployment
- **Supabase**: Database & Auth
- **Firebase**: Push notifications
- **Azure**: Speech services

### **Cron Jobs**
- **18:30 UTC (15:30 BR)**: Practice reminders
- **20:00 UTC (17:00 BR)**: Evening reminders

## 📱 **PWA Features**

### **Service Workers**
- `sw.js`: Main service worker
- `firebase-messaging-sw.js`: Push notifications
- Background sync & caching

### **Manifest**
- App icons (128x128 to 512x512)
- Maskable icons for Android
- Splash screens & theme colors

## 🔍 **Development Tools**

### **Debug Scripts**
- `check_db.py`: Database verification
- `debug-achievements.js`: Achievement debugging
- `test-supabase.sh`: Supabase testing

### **Configuration Files**
- `next.config.ts`: Next.js configuration
- `tailwind.config.js`: CSS framework
- `vercel.json`: Deployment settings
- `tsconfig.json`: TypeScript settings
- `eslint.config.js`: ESLint configuration (simplified)

## 📚 **Documentation**

### **Guides**
- `ACHIEVEMENTS_GUIDE.md`: Achievement system
- `NOTIFICATIONS_SETUP.md`: Push notifications
- `ENVIRONMENT_SETUP.md`: Development setup
- `NOVICE_*.md`: Implementation guides
- `iOS_Push_Notifications_Complete_Implementation_Guide.md`: Complete iOS implementation

### **API Documentation**
- RESTful endpoints in `/app/api/`
- WebSocket support for real-time
- GraphQL-like queries via Supabase

## 🎨 **UI/UX Components**

### **Design System**
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons
- Custom Charlotte theme

### **Responsive Breakpoints**
- Mobile-first design
- Tablet optimizations
- Desktop enhancements
- PWA-specific adjustments

## 🍎 **iOS Push Notifications**

### **Enhanced iOS Support**
- **iOS 16.4+**: Native push notification support
- **PWA Installation**: Required for iOS push
- **Apple Push Service**: Direct integration
- **VAPID Keys**: Web push fallback
- **Badge Support**: App icon badges
- **Test Endpoints**: Multiple testing options

### **iOS-Specific Features**
- **Capability Detection**: iOS version and PWA status
- **Subscription Validation**: iOS-specific validation
- **Platform Detection**: iOS vs Android vs Desktop
- **Error Handling**: iOS-specific error messages

### **Implementation Guide**
- **Complete Documentation**: `iOS_Push_Notifications_Complete_Implementation_Guide.md`
- **Step-by-step Setup**: Detailed implementation instructions
- **Troubleshooting**: Common issues and solutions
- **Best Practices**: iOS-specific optimizations

## 🔧 **Recent Updates**

### **Latest Enhancements**
- **NotificationManager**: Enhanced component with better iOS support
- **TypeScript Fixes**: Resolved type compatibility issues
- **ESLint Configuration**: Simplified and optimized
- **Build Optimization**: Faster compilation and deployment

### **Performance Improvements**
- **Type Safety**: Enhanced TypeScript configurations
- **Build Speed**: Optimized compilation process
- **Error Handling**: Better error management
- **Code Quality**: Improved linting and formatting

---

**Charlotte v2** - English Learning AI Assistant with Gamification & Enhanced iOS Push Notifications 