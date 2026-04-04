# Charlotte AI — Roadmap

> Última atualização: Abril 2026 | Build atual: 50 (TestFlight)

---

## Visão geral

Aplicativo de aprendizado de inglês com IA para falantes de português brasileiro.
Três níveis: **Novice (A1/A2) → Inter (B1/B2) → Advanced (C1/C2)**

**Loop principal:** Learn (estrutura) → Practice (aplicação livre) → próximo módulo

---

## Estado atual

| Item | Status |
|---|---|
| Plataforma | iOS (TestFlight) |
| Android | Configurado, não buildado |
| App Store (produção) | ❌ não submetido |
| Google Play | ❌ não submetido |
| Versão | 1.0.0 (build 50) |

---

## ✅ Implementado

### Infraestrutura
- Supabase: auth, perfis, progresso, leaderboard, achievements, practices
- Subscription: `trial / active / expired / institutional / none`
- Placement test (define nível inicial do aluno)
- Notificações push (expo-notifications)
- Configurações de perfil e alteração de senha

### Home Screen
- Greeting por IA (GPT-4o-mini) — PT-BR para Novice, EN para Inter/Advanced
  - Typing dots animados enquanto carrega (consistente com chat)
  - Cache 2h por inatividade — nova mensagem contextual ao voltar
- XP ring diário + streak + rank no leaderboard
- Missões diárias rotativas (3/dia, seed por dia, 5 famílias de missão)
- Dica do dia: 62 Novice (EN + PT) / 53 Inter / 54 Advanced
  - Modal da dica: EN + tradução PT para Novice

### Novice Experience (diferenciada)
- UI inteiramente em PT-BR (labels, botões, placeholders, saudações)
- `TranslatableText`: sublinhado âmbar pontilhado + tooltip balloon por palavra
- Dicionário EN→PT hardcoded: 350+ palavras + 50 phrasal verbs/expressões
- Normalização de apóstrofos para lookup confiável

### Practice with Charlotte
| Feature | Novice | Inter | Advanced |
|---|---|---|---|
| Grammar chat | ✅ PT-BR | ✅ | ✅ |
| Pronunciation | ❌ bloqueado | ✅ | ✅ |
| Free Chat | ❌ bloqueado | ✅ | ✅ |
| Live Voice | ❌ bloqueado | ❌ bloqueado | ✅ |

- Score card de pronúncia (Accuracy, Fluency, Completeness, Prosody)
- Audio playback por bolha de mensagem
- Análise gramatical em tempo real

### Learn with Charlotte — Trilha
- Trilha visual com módulos e tópicos desbloqueáveis por nível
- Mini-aulas por módulo (karaoke TTS, slides, cores por nível) — **Módulo 1 apenas**
  - Novice: 6 slides PT-BR | Inter: 8 slides EN | Advanced: 7 slides EN
- Sessão de exercícios: Fill the Gap, Fix the Error, Read & Answer, Multiple Choice, True/False
- XP por acerto, feedback inline, hint toggle
- Curriculum: ~11 módulos × nível (~61 tópicos Novice / ~64 Inter / ~31 Advanced)

---

## 🚧 O que falta — por prioridade

---

### BLOCO 1 — Conteúdo & Aprendizado

#### 1.1 Mini-aulas para todos os módulos
- Hoje apenas Módulo 1 de cada nível tem mini-aula (introdução narrada por Charlotte)
- Criar slides + gerar áudios (ElevenLabs) para Módulos 2–11
- Novice em PT-BR, Inter/Advanced em EN
- Baixo esforço técnico, alto impacto pedagógico

#### 1.2 Novos tipos de exercício
- [ ] **Build the Sentence** — palavras embaralhadas, aluno monta a frase na ordem correta
- [ ] **Short Write** — escrever frase completa com estrutura/palavra alvo + avaliação por IA
- [ ] **Minimal Pairs** (Pronunciation) — distinguir sons parecidos: ship/sheep, think/sink, tree/free
- [ ] **Shadowing mode** — aluno repete frase imediatamente após Charlotte, overlap intencional
- [ ] **Sentence stress** — marcar qual sílaba/palavra é a mais enfatizada

#### 1.3 Feedback loop personalizado
- [ ] Armazenar erros recentes do aluno no Supabase por categoria (tempo verbal, artigo, preposição…)
- [ ] API `/api/learn-grammar` usar histórico de erros para gerar exercícios focados nas fraquezas
- [ ] Dashboard de progresso: gráfico de evolução do score de pronúncia ao longo do tempo

---

### BLOCO 2 — Progressão & Engajamento

#### 2.1 Progresso persistido no Supabase
- Hoje o progresso de tópicos completados usa `SecureStore` (local, perdido ao reinstalar)
- Migrar para tabela Supabase: `user_topic_progress (user_id, level, module_idx, topic_idx, completed_at, best_score)`
- Sincronizar na abertura do app e após cada sessão

#### 2.2 Desbloqueio de nível automático
- Ao completar X% dos tópicos do nível atual, Charlotte oferece fazer o placement test para avançar
- Ou: botão "Avançar de nível" desbloqueado no perfil após threshold atingido

#### 2.3 Missões incluindo Learn
- Adicionar missões diárias relacionadas à trilha: "Complete 2 tópicos hoje", "Faça a mini-aula do Módulo 3"
- Integrar ao sistema de missões existente (família `learn`)

#### 2.4 Streak protegido
- Permitir "congelar" streak por 1 dia (feature premium comum em apps de idioma)
- Notificação push quando streak está em risco (hoje já existe infra de push)

---

### BLOCO 3 — Monetização

#### 3.1 Pagamento in-app
- [ ] Integrar **RevenueCat** (SDK React Native) como camada de gestão de subscription
- [ ] Criar produtos no App Store Connect e Google Play Console:
  - Mensal: R$ X/mês
  - Anual: R$ Y/ano (com desconto)
- [ ] Paywall screen: apresentado após trial expirado ou ao tentar acessar feature bloqueada
- [ ] RevenueCat webhook → atualiza `subscription_status` no Supabase automaticamente
- [ ] Restore purchases (obrigatório pela App Store)
- Hoje a ativação é manual via Supabase — não escalável

#### 3.2 Trial flow
- [ ] Trial de X dias para novos usuários (já existe o campo `trial_ends_at` no DB)
- [ ] Tela de onboarding que apresenta o trial e pede método de pagamento
- [ ] E-mail automático antes do trial expirar (via Supabase Edge Function ou serviço externo)

---

### BLOCO 4 — Qualidade & Polish

#### 4.1 UX
- [ ] **Offline graceful degradation** — exercícios em cache continuam funcionando sem internet; mensagem clara quando sem conexão
- [ ] **TranslatableText em mais lugares** — avaliar home greeting, dica do dia inline
- [ ] **Animação de conclusão de tópico** — celebração ao completar 100% de um tópico (confetti, XP pop)
- [ ] **Animação de desbloqueio** — quando um novo tópico/módulo abre na trilha

#### 4.2 Performance
- [ ] Pré-carregar áudios TTS das mini-aulas em background logo após login
- [ ] Lazy loading das telas de trilha para sessões mais longas
- [ ] Medir e reduzir tempo de abertura do app (Time to Interactive)

#### 4.3 Acessibilidade
- [ ] Testar com VoiceOver (iOS) e TalkBack (Android)
- [ ] Garantir contraste mínimo WCAG 2.1 AA em todos os textos
- [ ] Labels de acessibilidade em botões de ícone

---

### BLOCO 5 — Android

- [ ] Build de teste (APK) para validar layout em diferentes tamanhos de tela
- [ ] Resolver issues típicos de Android: fontes, sombras, `borderStyle: 'dotted'`, keyboard behavior
- [ ] Testar `expo-audio` e gravação de áudio em dispositivos Android físicos
- [ ] Google Play Console: criar app, configurar track interno
- [ ] Gerar keystore de produção e salvar com segurança

---

### BLOCO 6 — Submissão às Lojas

#### 6.1 Pré-requisitos técnicos
- [ ] **Versão de produção**: bumpar para 1.x.0 com `autoIncrement` no profile `production`
- [ ] **App icon**: todos os tamanhos necessários (1024×1024 para App Store, adaptive icon para Android)
- [ ] **Splash screen**: verificar qualidade em todos os tamanhos de tela (iPhone SE → Pro Max, tablets Android)
- [ ] **Deep links**: configurar Universal Links (iOS) e App Links (Android) se necessário
- [ ] **Sem conteúdo de debug**: remover todos os `console.log`, telas de teste, dados hardcoded de dev

#### 6.2 App Store Connect (iOS)
- [ ] **Screenshots**: 6.7" (iPhone 16 Pro Max), 6.5" (iPhone 14 Plus), 5.5" (iPhone 8 Plus) — pelo menos 3 telas por tamanho
- [ ] **Preview de app** (vídeo opcional, mas recomendado — até 30s)
- [ ] **Metadados**:
  - Nome do app (até 30 caracteres)
  - Subtítulo (até 30 caracteres)
  - Descrição (até 4.000 caracteres)
  - Keywords (até 100 caracteres — separados por vírgula)
  - URL de suporte
  - URL de marketing
- [ ] **Localização**: pt-BR (principal) + en-US
- [ ] **Classificação etária**: preencher questionário (provavelmente 4+ ou 9+)
- [ ] **Política de Privacidade**: URL pública obrigatória (LGPD + App Store)
- [ ] **Notas para o revisor**: explicar login, trial, funcionalidades de IA, uso do microfone
- [ ] **In-App Purchases**: configurar produtos se monetização estiver pronta
- [ ] **Informações de contato do suporte**: e-mail + telefone

#### 6.3 Google Play Console (Android)
- [ ] **Screenshots**: phone (mín. 2), tablet 7" (recomendado), tablet 10" (recomendado)
- [ ] **Feature graphic**: 1024×500px (banner na loja)
- [ ] **Metadados**: título, descrição curta (80 chars), descrição completa (4.000 chars)
- [ ] **Política de Privacidade**: URL pública
- [ ] **Data safety form**: declarar quais dados são coletados, como usados, se compartilhados
- [ ] **Classificação de conteúdo**: preencher questionário IARC
- [ ] **Target SDK**: garantir Android 14+ (API 34)
- [ ] **AAB (App Bundle)**: usar profile `production` com `buildType: app-bundle`

#### 6.4 Legal & Compliance
- [ ] **Política de Privacidade** (LGPD + GDPR + requisito de loja): cobre coleta de voz, IA, dados de uso
- [ ] **Termos de Uso**: definir regras de uso, cancelamento de subscription, trial
- [ ] **Consentimento de microfone**: explicação clara no momento da solicitação de permissão
- [ ] **Dados de menores**: se app aceita menores de 13 anos, exige compliance adicional (COPPA nos EUA)

---

## Sequência sugerida para lançamento

```
1. Bloco 3 (Monetização) ──► RevenueCat integrado, paywall funcional
2. Bloco 1.1 (Mini-aulas Módulos 2+) ──► mais conteúdo antes de ir público
3. Bloco 2.1 (Progresso Supabase) ──► experiência não se perde entre dispositivos
4. Bloco 5 (Android) ──► validação básica
5. Bloco 6 (Submissão) ──► screenshots, metadados, review Apple/Google
```

---

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Framework | Expo SDK 52 | Velocidade de dev, OTA updates |
| Navegação | expo-router (Stack) | Hub & Spoke pattern |
| Backend | Next.js (Vercel) | Reutiliza APIs do PWA existente |
| DB | Supabase (Postgres + Auth + Realtime) | BaaS completo |
| Pronúncia | Azure Speech Assessment | Único com feedback fonema a fonema |
| Grammar exercises | GPT-4o-mini + json_object | Geração dinâmica, baixo custo |
| Greeting | GPT-4o-mini, cache 2h SecureStore | Personalizado sem spam de API |
| TTS mini-aulas | ElevenLabs multilingual v2 (Rachel) | Suporte nativo PT-BR |
| Dicionário EN→PT | Hardcoded (noviceDictionary.ts) | Zero custo por lookup |
| Audio player | expo-audio v1.1, single player + replace() | Evita race conditions |
| Subscription | RevenueCat (planejado) | Gestão cross-platform, webhooks |
