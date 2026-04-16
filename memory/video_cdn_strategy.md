# Estrategia de Video

## Hoje
charlotte-intro.mp4 (743KB) esta bundlado no app nativo como asset local.
Carrega instantaneamente, zero latencia, zero bandwidth Vercel.
NAO mover para CDN — piora a experiencia (1-2s de download antes de reproduzir).

## Para videos futuros
Qualquer video adicionado depois do primeiro deve usar Supabase Storage com CDN.
O primeiro video e unico e toca so uma vez (primeiro acesso) — bundle faz sentido.
Videos subsequentes (tutoriais, onboarding extra, conteudo de licoes) devem ir para CDN
para nao inflar o tamanho do bundle do app.
