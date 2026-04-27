# Charlotte AI — Roadmap

> Última atualização: Abril 2026 | Build atual: 52 (TestFlight) — próximo build acumula melhorias abaixo

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
- Mini-aulas por módulo (karaoke TTS, slides, cores por nível) — **todos os 25 módulos** ✅
  - Novice: 6 slides PT-BR | Inter: 8 slides EN | Advanced: 7 slides EN
  - 1.037 arquivos TTS gerados (617 pron MP3 + 128 intro MP3+JSON + 33 C2 pendentes ElevenLabs)
- Sessão de exercícios: Fill the Gap, Fix the Error, Read & Answer, Multiple Choice, True/False, Word Order, Word Bank, Short Write
- XP por acerto, feedback inline, hint toggle
- Curriculum 100% completo: 11 módulos Novice + 11 Inter + 4 Advanced (~156 tópicos, zero `grammar: []`)
- Tipos de pronúncia: repeat, shadowing, listen_write, minimal_pairs, sentence_stress
- Redo de tópico não retrocede o ponteiro de progresso ✅

---

## 🚧 O que falta — por prioridade

---

### BLOCO 1 — Conteúdo & Aprendizado

#### 1.1 Mini-aulas para todos os módulos ✅ CONCLUÍDO
- Todos os 25 módulos têm mini-aula com slides + áudio TTS
- 33 slides do Advanced C2 aguardam upgrade do plano ElevenLabs (ver seção Pendência TTS)

#### 1.2 Novos tipos de exercício ✅ CONCLUÍDO
- ✅ **Word Order** — palavras embaralhadas, aluno monta a frase
- ✅ **Short Write** — escrever frase completa com modelo de resposta
- ✅ **Minimal Pairs** — distinguir sons parecidos (ship/sheep, think/sink)
- ✅ **Shadowing** — aluno segue junto com Charlotte
- ✅ **Sentence Stress** — identificar sílaba/palavra enfatizada

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

#### 4.1 UX — Concluídos ✅
- ✅ Splash nativa seamless (splash.png replica LoadingScreen JS, `cover`)
- ✅ `SplashScreen.hideAsync()` no mount — spinner visível durante auth resolve
- ✅ Live Voice status bar branca (StatusBar `light-content` no fundo `#07071C`)
- ✅ Diálogo A:/B: não traduzido (regex `/^[A-Za-z]:$/` em `TranslatableText`)
- ✅ Redo de tópico não retrocede ponteiro de progresso (`useLearnProgress`)
- ✅ Pronúncia travada em erro — botão Next aparece em todos os 5 tipos
- ✅ Live Voice — botão "Try again" ao falhar conexão WebRTC
- ✅ Chat history — spinner durante carregamento; welcome message em fallback de erro
- ✅ Progress bars — `as \`${number}%\`` em vez de `as any` (6 arquivos)
- ✅ Fallback de API URL — produção em vez de `localhost:3000` (10 arquivos)
- ✅ Grammar mode — `onSendAudio` removido (texto apenas, sem stub vazio)
- ✅ Labels de pronúncia corretas — 5 tipos com labels PT-BR/EN distintos
- ✅ Shadowing/repeat — threshold de `completeness < 35` exige fala real

#### 4.1 UX — Pendentes
- [ ] **Offline graceful degradation** — mensagem clara quando sem conexão
- [ ] **TranslatableText em mais lugares** — home greeting, dica do dia
- [ ] **Animação de conclusão de tópico** — confetti/XP pop ao completar 100%
- [ ] **Animação de desbloqueio** — quando novo tópico/módulo abre na trilha

#### 4.2 Performance
- [ ] Pré-carregar áudios TTS das mini-aulas em background logo após login
- [ ] Lazy loading das telas de trilha para sessões mais longas
- [ ] Medir e reduzir tempo de abertura do app (Time to Interactive)

#### 4.3 Acessibilidade
- [ ] `accessibilityLabel` nos botões de ícone (home, trilha, chat)
- [ ] Testar com VoiceOver (iOS) e TalkBack (Android)
- [ ] Garantir contraste mínimo WCAG 2.1 AA em todos os textos

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
- ✅ **Splash screen**: `splash.png` 1284×2778px gerado (`npm run generate-splash`), `cover` configurado
- [ ] **Splash screen**: verificar qualidade em iPhone SE, Pro Max e tablets Android
- [ ] **Deep links**: configurar Universal Links (iOS) e App Links (Android) se necessário
- [ ] **Sem conteúdo de debug**: remover `console.log` remanescentes, telas de teste, dados hardcoded de dev

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

### Pendência TTS — gerar áudios faltantes

Ao gerar os áudios das mini-aulas, a quota do plano ElevenLabs foi esgotada.
**33 slides ficaram sem áudio** (últimos slides do Advanced Módulo 3 e Módulo 4 — C2).

O app não quebra — exibe o texto normalmente sem narração.

**Quando fizer upgrade do plano ElevenLabs:**
```bash
cd charlotteai/apps/mobile
npm run generate-tts   # pula os 1.004 já existentes, gera só os 33 restantes
git add public/tts/
git commit -m "feat(tts): fill remaining 33 Advanced C2 slides"
git push
```

---

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Framework | Expo SDK 52 | Velocidade de dev, OTA updates |
| Navegação | expo-router (Stack) | Hub & Spoke pattern |
| Backend | Next.js (Vercel) | Consome APIs do apps/web |
| DB | Supabase (Postgres + Auth + Realtime) | BaaS completo |
| Pronúncia | Azure Speech Assessment | Único com feedback fonema a fonema |
| Grammar exercises | GPT-4o-mini + json_object | Geração dinâmica, baixo custo |
| Greeting | GPT-4o-mini, cache 2h SecureStore | Personalizado sem spam de API |
| TTS mini-aulas | ElevenLabs multilingual v2 (Rachel) | Suporte nativo PT-BR |
| Dicionário EN→PT | Hardcoded (noviceDictionary.ts) | Zero custo por lookup |
| Audio player | expo-audio v1.1, single player + replace() | Evita race conditions |
| Subscription | RevenueCat (planejado) | Gestão cross-platform, webhooks |
