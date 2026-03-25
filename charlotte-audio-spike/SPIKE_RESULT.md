# Charlotte RN — Resultado do Spike Técnico: Áudio & Voice

**Data:** ___________
**Testado por:** ___________
**Dispositivos:** ___________

---

## Sumário Executivo

> *Preencher após completar todos os testes*

| Pergunta | Resposta |
|---|---|
| expo-audio suporta PCM16 raw? | ⏳ Pendente |
| Precisa de lib nativa adicional? | ⏳ Pendente |
| WebSocket funciona nativamente no RN? | ⏳ Pendente |
| Latência do loop E2E é aceitável (<2s)? | ⏳ Pendente |
| iOS e Android se comportam igual? | ⏳ Pendente |

**Recomendação Final:** *(ver Seção 5)*

---

## Teste 1 — Gravação e Playback Básico

**Lib testada:** `expo-audio` com `RecordingPresets.HIGH_QUALITY`

### iOS — Simulador

| Item | Resultado | Detalhe |
|---|---|---|
| Solicitar permissão | ⏳ | |
| Gravar áudio | ⏳ | |
| Formato de saída | ⏳ | `.m4a` / `.wav` / `.pcm` |
| Duração correta | ⏳ | |
| Parar gravação | ⏳ | |
| Playback | ⏳ | |

**Erros encontrados:**
```
(nenhum)
```

**Código que funcionou:**
```typescript
// colar aqui
```

---

### iOS — Device Físico

| Item | Resultado | Detalhe |
|---|---|---|
| Solicitar permissão | ⏳ | |
| Gravar áudio | ⏳ | |
| Formato de saída | ⏳ | |
| Playback | ⏳ | |

**Diferenças vs simulador:**
```
(nenhuma observada)
```

---

### Android — Emulador

| Item | Resultado | Detalhe |
|---|---|---|
| Solicitar permissão | ⏳ | |
| Gravar áudio | ⏳ | |
| Formato de saída | ⏳ | |
| Playback | ⏳ | |

**Erros encontrados:**
```
(nenhum)
```

---

### Android — Device Físico

| Item | Resultado | Detalhe |
|---|---|---|
| Solicitar permissão | ⏳ | |
| Gravar áudio | ⏳ | |
| Formato de saída | ⏳ | |
| Playback | ⏳ | |

---

### Conclusão Teste 1

**Status geral:** ⏳ Pendente
**Formato de saída confirmado:** ___________
**expo-audio é suficiente para T1?** Sim / Não / Parcialmente

---

## Teste 2 — Conversão para PCM16 24kHz

**Requisito da OpenAI:** PCM16, mono, 24kHz, little-endian

### Estratégia B — expo-av AAC com sampleRate 24000

| Item | iOS | Android |
|---|---|---|
| Grava sem erro | ⏳ | ⏳ |
| sampleRate respeitado? | ⏳ | ⏳ |
| Formato de saída | ⏳ | ⏳ |

**Observação:**
```
(sampleRate configurado foi realmente 24kHz ou o SO ignorou?)
```

---

### Estratégia C — expo-av LinearPCM 16-bit 24kHz

| Item | iOS | Android |
|---|---|---|
| Grava sem erro | ⏳ | ⏳ |
| Header WAV válido? | ⏳ | ⏳ |
| SampleRate confirmado (header) | ⏳ | ⏳ |
| Channels = 1 (mono)? | ⏳ | ⏳ |
| BitDepth = 16? | ⏳ | ⏳ |

**Output da análise de header WAV:**
```
Canais:     ?
SampleRate: ? Hz
BitDepth:   ?-bit
ByteRate:   ? B/s
```

---

### Conclusão Teste 2

**Status geral:** ⏳ Pendente
**Melhor estratégia:** A / B / C
**PCM16 24kHz obtido diretamente?** Sim / Não / Parcialmente
**Conversão JS necessária?** Sim / Não

**Se sim, estratégia de conversão:**
```
(descrever abordagem: servidor, resampling JS, etc.)
```

---

## Teste 3 — WebSocket com OpenAI Realtime API

**URL:** `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`

### Conectividade

| Item | iOS | Android |
|---|---|---|
| WebSocket conecta? | ⏳ | ⏳ |
| Headers aceitos? (Authorization, OpenAI-Beta) | ⏳ | ⏳ |
| `session.created` recebido? | ⏳ | ⏳ |
| `session.updated` recebido? | ⏳ | ⏳ |
| `input_audio_buffer.append` aceito? | ⏳ | ⏳ |
| `response.audio.delta` recebido? | ⏳ | ⏳ |

**Latência de conexão:** ___ ms
**ID da sessão criada:** ___________

---

### Problemas de Headers (se houver)

O WebSocket nativo do React Native suporta headers customizados via terceiro argumento, mas pode haver incompatibilidades. Registrar aqui:

```
Tentativa 1: new WebSocket(url, [], { headers: {...} }) → resultado: ?
Tentativa 2: ...
```

**Solução adotada:**
```
(descrever workaround se necessário)
```

---

### Conclusão Teste 3

**Status geral:** ⏳ Pendente
**WebSocket nativo funciona?** Sim / Não / Precisa de polyfill
**Lib adicional necessária?** Nenhuma / `react-native-websocket` / Outra
**Áudio sintético enviado e resposta recebida?** Sim / Não

---

## Teste 4 — Loop Completo E2E

### Métricas de Latência

| Métrica | iOS Device | Android Device | iOS Simulador | Android Emulador |
|---|---|---|---|---|
| Gravação (3s) | ___ ms | ___ ms | ___ ms | ___ ms |
| WS Connect | ___ ms | ___ ms | ___ ms | ___ ms |
| 1º audio.delta | ___ ms | ___ ms | ___ ms | ___ ms |
| **Total Loop** | **___ ms** | **___ ms** | **___ ms** | **___ ms** |

**Referência:** <1000ms = excelente | 1000-2000ms = aceitável | >2000ms = inaceitável para tempo real

---

### Qualidade do Áudio

| Item | Resultado | Detalhe |
|---|---|---|
| Áudio enviado (real ou sintético)? | ⏳ | |
| Resposta de áudio recebida? | ⏳ | |
| Playback da resposta funcionou? | ⏳ | |
| Qualidade do áudio ok? | ⏳ | |

---

### Diferenças iOS vs Android

| Aspecto | iOS | Android | Diferença Significativa? |
|---|---|---|---|
| Formato de gravação | | | |
| Latência WS | | | |
| Latência resposta | | | |
| Playback | | | |
| Erros específicos | | | |

---

### Conclusão Teste 4

**Status geral:** ⏳ Pendente
**Loop E2E viável?** Sim / Não / Com ressalvas
**Latência aceitável para conversa?** Sim / Não
**Fonte de áudio usada:** Real (microfone) / Sintético (fallback)

---

## Seção 5 — Recomendação Final para Fase 6

> *Preencher após completar e analisar todos os testes*

### Decisão de Stack

**[ ] Opção A — expo-audio + WebSocket nativo**
```
Usar quando:
- expo-audio suporta PCM16 (ou após conversão simples)
- WebSocket nativo conecta com headers OK
- Latência total < 2000ms
```

**[ ] Opção B — expo-av + WebSocket nativo**
```
Usar quando:
- expo-av LinearPCM gera PCM16 24kHz diretamente (Estratégia C)
- Mais controle sobre sampleRate e format
```

**[ ] Opção C — react-native-live-audio-stream + WebSocket**
```
Usar quando:
- expo-audio/expo-av não conseguem PCM16 24kHz confiável
- Precisamos de streaming em tempo real (sem gravar arquivo)
- Latência é crítica
```

**[ ] Opção D — Servidor proxy Node.js intermediando**
```
Usar quando:
- Headers do WebSocket falham em produção
- Segurança da API key é prioritária
- Conversão de formato no servidor é mais simples
```

---

### Stack Recomendada

```
Gravação:  ___________________________________________
WebSocket: ___________________________________________
Playback:  ___________________________________________
Conversão: ___________________________________________
Auth:      ___________________________________________
```

### Riscos Residuais

| Risco | Probabilidade | Mitigação |
|---|---|---|
| | | |
| | | |

### Próximos Passos para Fase 6

1. [ ] ___________________________________________
2. [ ] ___________________________________________
3. [ ] ___________________________________________

---

## Apêndice — Ambiente de Teste

```
Expo SDK:           52.x
React Native:       0.76.x
expo-audio:         ~0.3.x
expo-av:            ~15.0.x
Node.js:            v___
npm:                v___

Dispositivos iOS testados:
  - Simulador: iPhone ___ / iOS ___
  - Device:    iPhone ___ / iOS ___

Dispositivos Android testados:
  - Emulador:  Pixel ___ / API ___
  - Device:    ___________ / Android ___

Conexão de rede:    WiFi / 4G / 5G
```

---

## Apêndice — Erros e Soluções Encontradas

| Erro | Plataforma | Causa | Solução |
|---|---|---|---|
| | | | |

---

*Spike criado em: 2026-03-18*
*Projeto Charlotte RN — Fase 6 — Voice Interface*
