# Plano de Implementação: Solução VisualViewport API para iOS PWA

## 📋 Objetivo
Resolver o problema do teclado virtual no iOS que empurra header/footer fixos para fora da área visível, implementando a VisualViewport API com CSS Variables dinâmicas.

## 🎯 Problema Identificado
- **Header/Footer fixos** saem da área visível quando teclado aparece no iOS
- **Layout Viewport ≠ Visual Viewport** no Safari iOS
- **position: fixed** se refere à Layout Viewport, não à Visual Viewport
- **Resultado**: Elementos fixos ficam inacessíveis durante digitação

## 🚀 Solução Proposta
Usar **VisualViewport API** + **CSS Variables** para ajustar dinamicamente o layout conforme o teclado aparece/desaparece.

---

## 📅 Cronograma de Implementação

### **FASE 1: Setup Base (30 min)**
1. ✅ Criar hook `useVisualViewportFix`
2. ✅ Adicionar CSS Variables no globals.css
3. ✅ Aplicar hook no layout principal

### **FASE 2: Ajustes de Layout (45 min)**
1. ✅ Modificar ChatHeader com classes CSS adequadas
2. ✅ Ajustar footer com transform
3. ✅ Modificar ChatBox para usar visual viewport height

### **FASE 3: Testes e Refinamentos (30 min)**
1. ✅ Testar em iOS Safari (modo standalone)
2. ✅ Ajustar timings de transição
3. ✅ Verificar comportamento em diferentes orientações

---

## 🔧 Implementação Detalhada

### **1. Hook useVisualViewportFix**

**Arquivo:** `hooks/useVisualViewportFix.ts`

```typescript
import { useState, useEffect } from 'react';

// Função helper para debounce
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function useVisualViewportFix() {
  const [visualViewportHeight, setVisualViewportHeight] = useState<number | null>(null);
  const [keyboardInset, setKeyboardInset] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      const vv = window.visualViewport;

      const updateViewport = () => {
        const newHeight = vv.height;
        const newOffsetTop = vv.offsetTop;
        const windowHeight = window.innerHeight;

        setVisualViewportHeight(newHeight);

        // Calcula o espaço ocupado pelo teclado
        const inset = Math.max(0, windowHeight - newHeight - newOffsetTop);
        setKeyboardInset(inset);

        // Atualiza variáveis CSS no elemento raiz
        document.documentElement.style.setProperty('--visual-viewport-height', `${newHeight}px`);
        document.documentElement.style.setProperty('--keyboard-inset', `${inset}px`);
        
        console.log('📱 VisualViewport Update:', {
          height: newHeight,
          offsetTop: newOffsetTop,
          keyboardInset: inset
        });
      };

      const debouncedUpdate = debounce(updateViewport, 50);

      // Define valores iniciais
      updateViewport();

      vv.addEventListener('resize', debouncedUpdate);
      vv.addEventListener('scroll', debouncedUpdate);

      // Listener para foco em inputs
      const handleFocus = (event: FocusEvent) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
          setTimeout(updateViewport, 100);
        }
      };
      document.addEventListener('focusin', handleFocus);

      return () => {
        vv.removeEventListener('resize', debouncedUpdate);
        vv.removeEventListener('scroll', debouncedUpdate);
        document.removeEventListener('focusin', handleFocus);
        document.documentElement.style.removeProperty('--visual-viewport-height');
        document.documentElement.style.removeProperty('--keyboard-inset');
      };
    } else {
      // Fallback para navegadores sem VisualViewport API
      console.warn('VisualViewport API not supported.');
      document.documentElement.style.setProperty('--visual-viewport-height', '100vh');
      document.documentElement.style.setProperty('--keyboard-inset', '0px');
    }
  }, []);

  return { visualViewportHeight, keyboardInset };
}
```

### **2. CSS Variables e Estilos**

**Arquivo:** `app/globals.css` (adicionar ao final)

```css
/* ✅ VISUAL VIEWPORT FIX: CSS Variables */
:root {
  /* Valores padrão para VisualViewport */
  --visual-viewport-height: 100vh;
  --keyboard-inset: 0px;
  
  /* Dimensões dos componentes */
  --header-height: 3.5rem; /* 56px - altura do ChatHeader */
  --footer-height: 100px;   /* altura aproximada do footer */
}

/* ✅ HEADER: Mantém position fixed com transição suave */
.visual-viewport-header {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 50 !important;
  transition: transform 0.2s ease-out;
  /* Header geralmente não precisa mover, mas fica preparado */
}

/* ✅ FOOTER: Move para cima conforme teclado sobe */
.visual-viewport-footer {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 40 !important;
  /* Move o footer para cima conforme o teclado sobe */
  transform: translateY(calc(var(--keyboard-inset) * -1));
  transition: transform 0.2s ease-out;
}

/* ✅ CONTENT: Ajusta altura para visual viewport */
.visual-viewport-content {
  height: calc(var(--visual-viewport-height) - var(--header-height) - var(--footer-height));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* Padding adicional para compensar teclado */
  padding-bottom: var(--keyboard-inset);
  transition: height 0.2s ease-out, padding-bottom 0.2s ease-out;
}

/* ✅ iOS PWA: Melhorias específicas */
@media (display-mode: standalone) {
  .visual-viewport-footer {
    /* Força o footer a ficar sempre visível em PWA */
    transform: translateY(calc(var(--keyboard-inset) * -1));
    will-change: transform;
  }
  
  .visual-viewport-content {
    /* Evita problemas de scroll em PWA */
    overscroll-behavior: none;
  }
}

/* ✅ MOBILE: Otimizações específicas */
@media (hover: none) and (pointer: coarse) {
  .visual-viewport-footer {
    /* Transição mais rápida em mobile */
    transition: transform 0.15s ease-out;
  }
}
```

### **3. Modificações nos Componentes**

#### **3.1 ChatHeader.tsx**

```typescript
// Adicionar classe CSS
<header 
  className={`visual-viewport-header bg-secondary/95 backdrop-blur-md border-b border-white/10 ${
    isIOSPWA ? 'ios-pwa-fixed-header' : ''
  }`}
  // ... resto do código
>
```

#### **3.2 app/chat/page.tsx**

```typescript
import { useVisualViewportFix } from '@/hooks/useVisualViewportFix';

export default function ChatPage() {
  // ... código existente ...

  // ✅ NOVO: Aplicar VisualViewport fix
  const { visualViewportHeight, keyboardInset } = useVisualViewportFix();

  return (
    <div className="h-screen bg-secondary flex flex-col relative">
      <ChatHeader 
        userName={user?.name}
        userLevel={user?.user_level}
        onLogout={logout}
      />

      {/* ✅ MODIFICADO: Usar classe visual-viewport-content */}
      <div className="visual-viewport-content">
        <ChatBox
          messages={messages}
          transcript={transcript}
          finalTranscript={finalTranscript}
          isProcessingMessage={isProcessingMessage}
          userLevel={user?.user_level || 'Novice'}
        />
      </div>

      {/* ✅ MODIFICADO: Usar classe visual-viewport-footer */}
      <div className="visual-viewport-footer bg-secondary border-t border-white/5 pb-safe">
        {/* ... conteúdo do footer ... */}
      </div>
    </div>
  );
}
```

#### **3.3 ChatBox.tsx**

```typescript
// Remover configurações de altura complexas, deixar o CSS handle
return (
  <div className="px-3 sm:px-4 py-2 sm:py-4">
    {/* ... conteúdo ... */}
  </div>
);
```

---

## 🧪 Plano de Testes

### **Teste 1: Funcionalidade Básica**
- [ ] Hook carrega sem erros
- [ ] CSS variables são definidas corretamente
- [ ] Console.log mostra valores atualizando

### **Teste 2: Comportamento do Teclado**
- [ ] Footer move para cima quando teclado aparece
- [ ] Footer volta à posição original quando teclado desaparece
- [ ] Transições são suaves (200ms)

### **Teste 3: Diferentes Cenários**
- [ ] Teclado padrão (QWERTY)
- [ ] Teclado numérico
- [ ] Teclado emoji
- [ ] Rotação de tela (portrait ↔ landscape)

### **Teste 4: Compatibilidade**
- [ ] iOS 15+ (VisualViewport API)
- [ ] iOS 13-14 (fallback)
- [ ] Android (não deve quebrar)
- [ ] Desktop (não deve afetar)

---

## ⚠️ Pontos de Atenção

### **Performance**
- ✅ Debounce de 50ms nos listeners
- ✅ Usar `transform` em vez de `top/bottom`
- ✅ `will-change: transform` para otimização

### **Compatibilidade**
- ✅ Fallback para navegadores sem VisualViewport API
- ✅ Não quebrar funcionalidade em outros dispositivos
- ✅ Manter comportamento atual como fallback

### **UX**
- ✅ Transições suaves (200ms)
- ✅ Evitar "jumps" visuais
- ✅ Manter acessibilidade dos elementos

---

## 🔄 Plano B (Alternativas)

### **Se VisualViewport API falhar:**

#### **Opção 1: Focus/Blur Listeners**
```typescript
// Simpler approach com eventos de foco
const [keyboardVisible, setKeyboardVisible] = useState(false);

useEffect(() => {
  const handleFocus = () => setKeyboardVisible(true);
  const handleBlur = () => setKeyboardVisible(false);
  
  document.addEventListener('focusin', handleFocus);
  document.addEventListener('focusout', handleBlur);
  
  return () => {
    document.removeEventListener('focusin', handleFocus);
    document.removeEventListener('focusout', handleBlur);
  };
}, []);
```

#### **Opção 2: Layout sem Position Fixed**
- Remover `position: fixed` do header/footer
- Usar scroll interno no conteúdo principal
- Header/footer ficam sempre visíveis mas rolam com conteúdo

---

## 📊 Métricas de Sucesso

### **Antes da Implementação:**
- ❌ Footer inacessível quando teclado aberto
- ❌ Usuário precisa fechar teclado para acessar botões
- ❌ UX ruim em iOS PWA

### **Após Implementação:**
- ✅ Footer sempre visível e acessível
- ✅ Transições suaves entre estados
- ✅ UX consistente em todos dispositivos iOS
- ✅ Performance mantida (< 50ms de delay)

---

## 🚀 Próximos Passos

1. **Implementar Fase 1** (hook + CSS variables)
2. **Testar em dispositivo iOS real**
3. **Ajustar valores se necessário**
4. **Implementar Fases 2 e 3**
5. **Testes finais e refinamentos**
6. **Deploy e monitoramento**

---

## 📚 Referências

- [VisualViewport API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport)
- [iOS Keyboard Fix - CodeMzy](https://www.codemzy.com/blog/sticky-fixed-header-ios-keyboard-fix)
- [Safari Position Fixed - Medium](https://medium.com/@im_rahul/safari-and-position-fixed-978122be5f29)
- [iPhone X Safe Areas - WebKit](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)

---

**Status:** 📋 Pronto para implementação
**Estimativa:** 2-3 horas total
**Prioridade:** 🔥 Alta (problema crítico de UX no iOS) 