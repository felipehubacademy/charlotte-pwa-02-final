# Charlotte RN

App móvel de aprendizado de inglês com IA — construído com Expo + React Native.

## Stack

- **Expo** ~52 (SDK)
- **Expo Router** v4 — file-based routing
- **NativeWind** v4 — Tailwind CSS para React Native
- **Supabase** — autenticação e banco de dados
- **EAS Build** — builds para iOS e Android

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Simulador iOS (Xcode) ou Android Studio

## Setup inicial

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas chaves reais

# 3. Iniciar em desenvolvimento
npx expo start
```

Pressione `i` para iOS, `a` para Android, ou `w` para web.

## Variáveis de ambiente

Crie um arquivo `.env` na raiz com base no `.env.example`:

| Variável | Descrição |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `EXPO_PUBLIC_API_BASE_URL` | URL base da API Charlotte (Vercel) |
| `EAS_PROJECT_ID` | ID do projeto no Expo Application Services |

## Estrutura de pastas

```
charlotte-rn/
├── app/                        # Expo Router (file-based routing)
│   ├── _layout.tsx             # Root layout (SafeAreaProvider + AuthProvider)
│   ├── index.tsx               # Redirecionamento baseado em auth
│   ├── +not-found.tsx          # Tela 404
│   ├── (auth)/                 # Grupo de rotas não autenticadas
│   │   ├── _layout.tsx
│   │   └── login.tsx           # Tela de login
│   └── (app)/                  # Grupo de rotas autenticadas
│       ├── _layout.tsx         # Tab navigator
│       ├── chat.tsx            # Tela de chat com IA
│       └── configuracoes.tsx   # Tela de configurações
├── components/
│   ├── ui/                     # Componentes de design system
│   │   ├── Button.tsx          # Variantes: primary | secondary | ghost
│   │   ├── Text.tsx            # Wrapper de texto com fonte padrão
│   │   └── Screen.tsx          # Wrapper de tela com SafeAreaView
│   └── auth/
│       └── AuthProvider.tsx    # Contexto de autenticação (placeholder)
├── hooks/
│   └── useAuth.ts              # Hook de acesso ao contexto de auth
├── assets/                     # Ícones e imagens
├── app.config.ts               # Configuração do Expo (env vars, permissões)
├── eas.json                    # Profiles de build: development | preview | production
├── tailwind.config.js          # Tema Charlotte (cores, fontes)
└── babel.config.js             # NativeWind + Reanimated
```

## Tema de cores (Charlotte)

| Token | Cor | Hex |
|---|---|---|
| `primary` | Verde limão | `#A3FF3C` |
| `secondary` | Azul escuro | `#16153A` |
| `background` | Fundo principal | `#16153A` |
| `surface` | Cards e inputs | `#1E1D4A` |
| `textPrimary` | Texto principal | `#FFFFFF` |
| `textSecondary` | Texto secundário | `#9CA3AF` |

Use as cores via classes NativeWind:

```tsx
<View className="bg-background">
  <Text className="text-primary font-bold">Charlotte</Text>
</View>
```

## EAS Build

```bash
# Build de desenvolvimento (simulador)
eas build --profile development --platform ios

# Build de preview (APK/IPA para testes)
eas build --profile preview --platform all

# Build de produção (lojas)
eas build --profile production --platform all
```

## Próximas fases

- **Agente 1** — Autenticação real com Supabase (substituir placeholders em `AuthProvider.tsx`)
- **Fase 2** — Chat com IA (voz + texto) em `(app)/chat.tsx`
- **Fase 3** — Sistema de XP, níveis e achievements
- **Fase 4** — Notificações push e streak diário
