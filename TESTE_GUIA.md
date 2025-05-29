# 🧪 Guia de Teste - Azure Speech SDK (Versão Simplificada)

## 🎯 **Objetivo**
Testar a implementação simplificada do Azure Speech SDK que funciona diretamente com WebM/Opus no servidor.

## 📋 **Mudança de Estratégia**

### ❌ **Problema Anterior:**
- Tentativa de conversão de áudio no servidor Node.js
- Web Audio API não disponível no servidor
- Erro: `ReferenceError: window is not defined`

### ✅ **Nova Abordagem:**
- **Usar formato original**: Deixar o Azure SDK processar WebM/Opus diretamente
- **Especificar formato PCM**: Configurar AudioConfig com formato PCM 16kHz
- **Fallback inteligente**: Se falhar, tentar sem especificação de formato
- **Logs detalhados**: Para entender o que está acontecendo

## 🧪 **Plano de Teste Atualizado**

### 1. **Preparação**
```bash
# Certifique-se que o servidor está rodando
npm run dev
```

### 2. **Teste via Interface Web**
1. Acesse: http://localhost:3000/chat
2. Clique no botão de microfone
3. Grave uma frase em inglês (ex: "Hello world, this is a test")
4. Observe os logs no terminal do servidor

### 3. **Logs Esperados - NOVA IMPLEMENTAÇÃO**
```
📋 Input audio: { type: 'audio/webm;codecs=opus', size: 135316 }
🔄 Processing WebM/Opus with Azure Speech SDK...
💡 Tip: Azure SDK v1.44.0 may support WebM better than expected
✅ Audio prepared for SDK processing
🎤 Creating Audio Config from buffer...
📊 Audio buffer size: 135316
✅ Audio config created successfully with PCM format specification
🎯 Performing Speech SDK Assessment...
🔗 Speech SDK Session started: [SESSION_ID]
📥 Speech SDK Result received: { reason: 1, text: 'Hello world, this is a test.', sessionId: '...' }
✅ Text recognized: Hello world, this is a test.
📊 Real Azure Scores: { accuracy: 85, fluency: 78, pronunciation: 82, prosody: 80 }
```

### 4. **Se Falhar - Logs de Fallback**
```
❌ Audio config creation failed: [erro]
🔄 Trying fallback audio config...
✅ Fallback audio config created successfully
📥 Speech SDK Result received: { reason: 1, text: '...', sessionId: '...' }
```

## 📊 **O que Observar nos Logs**

### ✅ **Sinais de Sucesso**
- `✅ Audio prepared for SDK processing`
- `✅ Audio config created successfully with PCM format specification`
- `reason: 1` (RecognizedSpeech)
- `text: 'sua frase aqui'` (não vazio)
- `Real Azure Scores` com valores > 0

### ⚠️ **Sinais de Problema**
- `reason: 0` (NoMatch)
- `text: ''` (vazio)
- `❌ Speech not recognized`
- Fallback para Whisper

### 🔍 **Informações de Debug**
- **Audio Buffer Size**: Tamanho do buffer de áudio
- **PCM Format**: Se especificação de formato funcionou
- **Fallback**: Se precisou usar configuração alternativa

## 🎯 **Cenários de Teste**

### Teste 1: Frase Simples
- **Frase**: "Hello world"
- **Expectativa**: Reconhecimento básico funcionando

### Teste 2: Frase Complexa
- **Frase**: "This is a pronunciation assessment test"
- **Expectativa**: Análise detalhada de palavras e fonemas

### Teste 3: Frase com Dificuldades
- **Frase**: "The quick brown fox jumps over the lazy dog"
- **Expectativa**: Scores variados baseados na pronúncia

## 📝 **Como Enviar Logs para Análise**

### 1. **Copie os logs completos** do terminal onde `npm run dev` está rodando
### 2. **Inclua informações do teste**:
   - Frase que você falou
   - Qualidade do áudio (ambiente silencioso/barulhento)
   - Duração aproximada da gravação
   - Resultado esperado vs obtido

### 3. **Formato do relatório**:
```
## Teste [número]
**Frase falada**: "sua frase aqui"
**Ambiente**: silencioso/barulhento
**Duração**: ~3 segundos
**Resultado**: sucesso/falha

**Logs**:
[cole os logs aqui]
```

## 🎉 **Resultados Esperados**

Com a nova implementação simplificada, esperamos:
- ✅ **Sem erros de conversão** (não mais `window is not defined`)
- ✅ **Azure SDK processando WebM** diretamente
- ✅ **Especificação de formato PCM** melhorando compatibilidade
- ✅ **Fallback funcionando** se formato específico falhar
- ✅ **Scores reais do Azure** se reconhecimento funcionar

## 🔧 **Estratégias de Debugging**

### Se ainda falhar:
1. **Verificar formato de áudio**: Logs mostrarão tamanho e tipo
2. **Testar fallback**: Se configuração PCM falha, tenta genérica
3. **Analisar reason code**: 0 = NoMatch, 1 = Success
4. **Comparar com Whisper**: Se Whisper funciona mas Azure não

## 🚀 **Próximos Passos**

Se esta abordagem funcionar:
1. **Otimizar configuração** de formato de áudio
2. **Implementar retry logic** mais inteligente
3. **Adicionar suporte** a outros formatos
4. **Melhorar feedback** baseado em reason codes

Se não funcionar:
1. **Investigar formatos suportados** pelo Azure SDK
2. **Considerar conversão no cliente** (browser)
3. **Implementar pré-processamento** de áudio
4. **Usar bibliotecas de conversão** no servidor

---

**🎯 Execute os testes e envie os logs para análise detalhada!** 