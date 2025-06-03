# 🏆 **GUIA COMPLETO: Sistema de Achievements e XP - Charlotte PWA**

## 📊 **SISTEMA DE XP**

### **Fórmula de Níveis:**
- **Nível = Math.floor(Math.sqrt(totalXP / 50)) + 1**
- **XP para próximo nível = (nível + 1)² × 50**

### **XP por Tipo de Prática:**

#### 🎤 **Audio Messages (3-25 XP)**
| Nível | Min XP | Max XP |
|-------|--------|--------|
| Novice | 8 | 25 |
| Inter | 5 | 20 |
| Advanced | 3 | 15 |

**Fatores que influenciam:**
- ✅ **Accuracy Score** (30%-100%)
- ⏱️ **Duração** (até 1.5x para 20s+)
- 📝 **Comprimento do texto** (até 1.3x para 100+ chars)
- 🎯 **Perfect Practice**: +10 XP (accuracy > 95%)
- 🔥 **Streak multiplier**: +10% por dia (max 100%)

#### 💬 **Text Messages (5-20 XP)**
| Grammar Score | Bonus XP | Total XP |
|---------------|-----------|----------|
| ≥95% | +15 | 20 XP |
| 85-94% | +12 | 17 XP |
| 75-84% | +8 | 13 XP |
| 65-74% | +5 | 10 XP |
| 50-64% | +2 | 7 XP |
| <50% | +0 | 5 XP |

**Extras:**
- 📚 **Level appropriate**: +2 XP
- 🎯 **Base**: 5 XP sempre garantido

#### 🗣️ **Live Voice (3-40 XP)**
| Nível | XP por Minuto |
|-------|---------------|
| Novice | 8 XP/min |
| Inter | 5 XP/min |
| Advanced | 3 XP/min |

**Bônus por duração:**
- ⏱️ **2+ minutos**: +2 XP
- ⏱️ **5+ minutos**: +5 XP
- ⏱️ **10+ minutos**: +10 XP
- ⏱️ **15+ minutos**: +15 XP

---

## 🏆 **ACHIEVEMENTS DISPONÍVEIS**

### **📊 ACHIEVEMENTS POR PERFORMANCE**

#### 🎯 **Perfect Practice**
- **Trigger**: Accuracy > 95%
- **XP**: +10
- **Rarity**: Rare
- **Como conseguir**: Grave áudio com boa qualidade e fale claramente

#### 🗣️ **Eloquent Speaker**
- **Trigger**: Texto > 100 caracteres
- **XP**: +5
- **Rarity**: Common
- **Como conseguir**: Fale uma frase longa e detalhada

#### ⚡ **Marathon Speaker**
- **Trigger**: Duração > 30 segundos
- **XP**: +8
- **Rarity**: Common
- **Como conseguir**: Fale por mais de 30 segundos seguidos

#### 🎤 **Grammar Master**
- **Trigger**: Pronunciation Score > 90%
- **XP**: +12
- **Rarity**: Rare
- **Como conseguir**: Foque na pronúncia clara e correta

---

### **📈 ACHIEVEMENTS POR VOLUME**

#### 🎙️ **Audio Progression**
| Achievement | Requisito | XP | Rarity | Icon |
|-------------|-----------|-----|--------|------|
| Audio Starter | 5 mensagens | +10 | Common | 🎙️ |
| Audio Enthusiast | 25 mensagens | +25 | Rare | 🎧 |
| Audio Master | 50 mensagens | +50 | Epic | 🎵 |
| Audio Legend | 100 mensagens | +100 | Legendary | 🏆 |

#### ✏️ **Text Progression**
| Achievement | Requisito | XP | Rarity | Icon |
|-------------|-----------|-----|--------|------|
| Text Writer | 10 mensagens | +10 | Common | ✏️ |
| Text Warrior | 50 mensagens | +30 | Rare | ⚔️ |
| Text Champion | 100 mensagens | +60 | Epic | 🏅 |
| Text Legend | 250 mensagens | +125 | Legendary | 📚 |

#### 🎭 **Live Voice Progression**
| Achievement | Requisito | XP | Rarity | Icon |
|-------------|-----------|-----|--------|------|
| Live Beginner | 5 conversas | +15 | Common | 💬 |
| Live Conversationalist | 15 conversas | +45 | Rare | 🗨️ |
| Live Master | 50 conversas | +100 | Epic | 🎭 |

---

### **🔥 ACHIEVEMENTS POR STREAK**

#### **Streak Milestones**
- **Trigger**: A cada 5 dias consecutivos
- **XP**: Igual ao número de dias (5 = +5 XP, 10 = +10 XP)
- **Rarity**: 
  - 5-15 dias: Rare
  - 20+ dias: Epic
- **Icon**: 🔥
- **Como conseguir**: Pratique todos os dias seguidos

---

### **🕐 ACHIEVEMENTS POR COMPORTAMENTO**

#### **⏰ Achievements por Horário (20% chance)**
| Achievement | Horário | XP | Rarity | Icon |
|-------------|---------|-----|--------|------|
| Early Bird | 5h-7h | +5 | Common | 🌅 |
| Night Owl | 22h-2h | +5 | Common | 🦉 |
| Lunch Learner | 12h-14h | +5 | Common | 🍽️ |

#### **📅 Achievements por Dia da Semana (15% chance)**
| Achievement | Dia | XP | Rarity | Icon |
|-------------|-----|-----|--------|------|
| Monday Motivation | Segunda | +8 | Common | 💪 |
| Friday Finisher | Sexta | +8 | Common | 🎉 |
| Weekend Warrior | Sáb/Dom | +10 | Common | 🏖️ |

---

### **🎲 ACHIEVEMENTS SURPRESA**

#### **⭐ Super Raros (1% chance)**
| Achievement | XP | Rarity | Icon | Descrição |
|-------------|-----|--------|------|-----------|
| Lucky Star | +20 | Legendary | ⭐ | Fortune smiles upon you |
| Serendipity | +18 | Legendary | 🍀 | A beautiful coincidence! |
| Cosmic Alignment | +25 | Legendary | 🌌 | The stars aligned for your practice! |

#### **✨ Bônus Surpresa (15% chance)**
| Achievement | XP | Rarity | Icon | Descrição |
|-------------|-----|--------|------|-----------|
| Golden Moment | +15 | Epic | 🌟 | Perfect timing bonus |
| Magic Practice | +12 | Epic | ✨ | Something special happened! |
| Rainbow Bonus | +10 | Rare | 🌈 | Colorful learning experience! |

---

## 🧪 **COMO TESTAR CADA ACHIEVEMENT**

### **🚀 Para testar AGORA (Imediatos):**

#### **1. Audio Achievements:**
```
🎯 Perfect Practice:
   - Grave áudio em ambiente silencioso
   - Fale claramente e devagar
   - Use boa dicção

🗣️ Eloquent Speaker:
   - Fale uma frase com mais de 100 caracteres
   - Exemplo: "I really enjoy learning English with Charlotte because it helps me improve my pronunciation and grammar skills significantly."

⚡ Marathon Speaker:
   - Fale por mais de 30 segundos seguidos
   - Conte uma história ou descreva algo detalhadamente

🎤 Grammar Master:
   - Foque na pronúncia correta
   - Fale devagar e articule bem as palavras
```

#### **2. Text Achievements:**
```
💬 Perfect Grammar:
   - Escreva uma mensagem longa e gramaticalmente perfeita
   - Use estruturas complexas mas corretas
   - Revise antes de enviar
   - Exemplo: "I have been studying English for several months now, and I can clearly see significant improvements in my vocabulary, grammar, and overall communication skills."
```

#### **3. Live Voice Achievements:**
```
🎭 Live Voice Practice:
   - Entre no Live Voice Mode
   - Converse por 2+ minutos para bônus pequeno
   - Converse por 5+ minutos para bônus médio
   - Converse por 10+ minutos para bônus grande
   - Converse por 15+ minutos para bônus máximo
```

### **📈 Para testar com Volume (demora mais):**

#### **Volume Achievements:**
```
🎙️ Audio Starter: Mande 5 mensagens de áudio
✏️ Text Writer: Mande 10 mensagens de texto
🔥 Streak 3: Pratique 3 dias seguidos
🔥 Streak 5: Pratique 5 dias seguidos
💬 Live Beginner: Tenha 5 conversas no Live Voice
```

### **🕐 Para testar Comportamentais:**

#### **Horários Específicos:**
```
🌅 Early Bird: Pratique entre 5h-7h da manhã
🦉 Night Owl: Pratique entre 22h-2h da madrugada
🍽️ Lunch Learner: Pratique entre 12h-14h (almoço)
```

#### **Dias Específicos:**
```
💪 Monday Motivation: Pratique numa segunda-feira
🎉 Friday Finisher: Pratique numa sexta-feira
🏖️ Weekend Warrior: Pratique no sábado ou domingo
```

---

## 🎯 **NÍVEIS DE RARIDADE**

| Rarity | Cor | Faixa XP | Chance |
|--------|-----|----------|--------|
| **Common** | 🟢 Verde | 5-10 XP | Fácil de conseguir |
| **Rare** | 🔵 Azul | 10-30 XP | Requer esforço |
| **Epic** | 🟣 Roxo | 30-100 XP | Muito difícil |
| **Legendary** | 🟡 Dourado | 100+ XP | Extremamente raro |

---

## 🚀 **ESTRATÉGIAS PARA MAXIMIZAR XP**

### **🎯 Combo Perfeito (Audio):**
1. **Fale por 30+ segundos** (Marathon Speaker: +8 XP)
2. **Use frases longas** (Eloquent Speaker: +5 XP)
3. **Pronunciation score > 90%** (Grammar Master: +12 XP)
4. **Accuracy > 95%** (Perfect Practice: +10 XP)
5. **Total**: 35 XP extras + base XP + possível bônus surpresa!

### **📝 Combo Perfeito (Text):**
1. **Escreva texto longo e complexo**
2. **Grammar score > 95%** (+15 XP extra)
3. **Level appropriate** (+2 XP extra)
4. **Total**: 22 XP máximo

### **🎭 Combo Perfeito (Live Voice):**
1. **Converse por 15+ minutos** (+15 XP bonus)
2. **Base XP por minuto** (até 8 XP/min para Novice)
3. **Total**: Até 40 XP em uma sessão

### **🔥 Dicas de Streak:**
- **Pratique todo dia** para multiplicador de streak
- **Streak de 10 dias** = +100% XP em todas as práticas!
- **Combine com achievements comportamentais** para XP extra

---

## 📱 **COMO VER SEUS ACHIEVEMENTS**

1. **Clique no contador XP** (canto superior direito)
2. **Aba "Achievements"** no modal
3. **Badge vermelho** indica achievements recentes (últimas 24h)
4. **Filtros por raridade** usando as cores

---

## 🐛 **TROUBLESHOOTING**

### **XP não aparece:**
- Verifique se está logado
- Refresh da página
- Aguarde alguns segundos após a prática

### **Achievement não desbloqueou:**
- Alguns têm chance (15-20%), tente novamente
- Verifique se atendeu todos os requisitos
- Achievements comportamentais têm delay

### **Modal não abre:**
- Clique no contador XP (círculo com nível)
- Verifique se não há modal já aberto
- Refresh da página se necessário

---

## 🎮 **NÍVEIS DE REFERÊNCIA**

| Nível | XP Total | XP para Próximo |
|-------|----------|-----------------|
| 1 | 0 | 100 |
| 2 | 100 | 250 |
| 3 | 250 | 450 |
| 4 | 450 | 700 |
| 5 | 700 | 1,000 |
| 10 | 4,500 | 5,550 |
| 15 | 11,250 | 12,800 |
| 20 | 19,500 | 22,050 |

---

**🎯 Boa sorte desbloqueando todos os achievements!** 🚀 