# Charlotte App — Roadmap

## Visão geral
Aplicativo de aprendizado de inglês com IA para falantes de português.
Três níveis: **Novice (A1/A2) → Inter (B1/B2) → Advanced (C1/C2)**

Duas grandes seções:
- **Practice with Charlotte** — prática livre e analítica (Grammar, Pronunciation, Free Chat, Live Voice)
- **Learn with Charlotte** — lições estruturadas e guiadas com trilha de tópicos

Loop ideal: **Learn → absorver estrutura → Practice → aplicar livremente → próximo módulo**

---

## Estado atual — Abril 2026

### App
- Versão: 1.0.0 | Build: 50 (TestFlight)
- Plataforma: iOS only (Android configurado mas não buildado)
- Bundle ID: com.hubacademy.charlotte

---

## ✅ Implementado

### Infraestrutura & Auth
- Supabase: auth, perfis, progresso, leaderboard, achievements, practices
- Subscription: trial / active / expired / institutional / none
- Placement test (define nível inicial)
- Notificações push (expo-notifications)
- Configurações de perfil e senha

### Home Screen
- Greeting por IA (GPT-4o-mini, PT-BR para Novice, EN para Inter/Advanced)
  - Typing dots animados enquanto carrega
  - Cache 2h por inatividade — nova mensagem contextual ao voltar
- XP ring diário + missões diárias rotativas (seed por dia, 3 famílias)
- Streak, rank, XP total
- Dica do dia: 62 Novice (EN+PT) / 53 Inter / 54 Advanced — rotação por dia
- Achievements e leaderboard integrados

### Novice Experience (diferenciada)
- UI inteiramente em PT-BR (labels, botões, placeholders, saudações)
- `TranslatableText`: sublinhado âmbar pontilhado + tooltip balloon por palavra
- Dicionário hardcoded EN→PT: 350+ palavras + 50 phrasal verbs/expressões
- Normalização de apóstrofos (curly → straight) para lookup confiável
- Grammar placeholder "Digite em inglês…"

### Practice with Charlotte
| Feature | Novice | Inter | Advanced |
|---|---|---|---|
| Grammar chat | ✅ (PT-BR feedback) | ✅ | ✅ |
| Pronunciation chat | ❌ bloqueado | ✅ | ✅ |
| Free Chat | ❌ bloqueado | ✅ | ✅ |
| Live Voice | ❌ bloqueado | ❌ bloqueado | ✅ |

- Score card de pronúncia com barras (Accuracy, Fluency, Completeness, Prosody)
- Audio playback por bolha de mensagem
- Análise gramatical em tempo real com explicações PT (Novice)

### Learn with Charlotte — Trilha
- `learn-trail.tsx`: trilha visual com módulos e tópicos desbloqueáveis
- `learn-intro.tsx`: mini-aulas por módulo — karaoke TTS, slides, cores por nível
  - Novice: 6 slides PT-BR + áudios ElevenLabs multilingual
  - Inter: 8 slides EN + áudios
  - Advanced: 7 slides EN + áudios
  - Status bar light, tracking de conclusão (SecureStore)
- `learn-session.tsx`: sessão de exercícios com 5 tipos:
  - Fill the Gap, Fix the Error, Read & Answer, Multiple Choice, True/False
  - XP por acerto, feedback inline, hint toggle
  - TranslatableText ativo para Novice
- Curriculum: 11 módulos × nível, ~61 tópicos Novice / ~64 Inter / ~31 Advanced
- Mini-aulas implementadas apenas para **Módulo 1** de cada nível

### APIs (Next.js)
- `/api/assistant` — chat principal (GPT-4o-mini/gpt-4o)
- `/api/greeting` — greeting personalizado (GPT-4o-mini)
- `/api/tts` — Text-to-Speech (ElevenLabs)
- `/api/pronunciation` — avaliação Azure Speech
- `/api/learn-grammar` — geração de exercícios dinâmicos
- `/api/demo-sentence` — frase de exemplo para pronúncia

---

## 🚧 Em aberto / Próximas prioridades

### P1 — Conteúdo (alto impacto, necessário para retenção)
- [ ] **Mini-aulas para Módulos 2–11** de cada nível
  - Atualmente só Módulo 1 tem mini-aula; os demais começam direto nos exercícios
- [ ] **Mais tópicos exercitáveis** — curriculum tem 61 tópicos Novice mas os exercícios são gerados dinamicamente; validar cobertura real de todos os tópicos
- [ ] **Conteúdo gerado baseado em erros** — feedback loop com histórico de sessões (exercícios personalizados por fraqueza do aluno)

### P2 — Learn expandido (tipos de exercício)
- [ ] **Build the Sentence** — palavras embaralhadas, aluno monta a frase
- [ ] **Short Write** — escrever frase com estrutura/palavra alvo + avaliação por IA
- [ ] **Minimal Pairs** (Pronunciation) — distinguir sons parecidos: think/sink, tree/free
- [ ] **Shadowing mode** — aluno e Charlotte falam juntos

### P3 — Progressão & Engajamento
- [ ] **Progresso salvo no Supabase por tópico** — hoje usa SecureStore local; perda ao reinstalar
- [ ] **Missões diárias incluindo Learn** — ex: "Complete 3 grammar exercises hoje"
- [ ] **Dashboard de progresso** — gráfico de evolução do score de pronúncia
- [ ] **Desbloqueio de nível automático** — ao completar X% dos tópicos do nível atual, oferece avançar

### P4 — Plataforma & Distribuição
- [ ] **Android build + testes**
- [ ] **App Store (produção)** — hoje só TestFlight
- [ ] **Monetização real** — integração de pagamento (RevenueCat ou similar) para ativar subscription_status via app; hoje é gerenciado manualmente

### P5 — Qualidade & Polish
- [ ] **TranslatableText em mais lugares** — hoje ativo em learn-session; avaliar home greeting e outras telas
- [ ] **Offline graceful degradation** — sem internet, exercícios em cache ainda funcionam?
- [ ] **Analytics** — eventos de uso para entender onde alunos travam/desistem

---

## Decisões técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Framework RN | Expo SDK 52 | Velocidade de desenvolvimento |
| Navegação | expo-router (Stack) | Hub & Spoke pattern |
| Backend | Next.js (Vercel) | Reutiliza APIs existentes do PWA |
| Pronúncia | Azure Speech Assessment | Único com feedback fonema a fonema |
| Grammar exercises | GPT-4o-mini + json_object | Geração dinâmica, custo baixo |
| Greeting | GPT-4o-mini, cache 2h SecureStore | Personalizado, sem spam de API |
| TTS mini-aulas | ElevenLabs multilingual v2 (Rachel) | Suporta PT-BR nativamente |
| Dicionário EN→PT | Hardcoded (noviceDictionary.ts) | Zero custo por lookup |
| Audio player | expo-audio v1.1, single player + replace() | Evita race conditions |

---

## Estratégia Cowork
- **Novice**: Charlotte fala português — remove barreira de entrada, aluno foca no inglês
- **Inter/Advanced**: imersão total em inglês — Charlotte como parceira nativa
- **Learn → Practice loop**: estrutura no Learn, aplicação livre no Practice
- **Trilha desbloqueável**: progresso visível, senso de conquista a cada tópico
