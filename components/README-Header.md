# Header Fixo para PWA iOS - Documentação

## Visão Geral

Esta implementação resolve o problema do header fixo em Progressive Web Apps (PWA) no iOS, garantindo que o header permaneça visível mesmo quando o teclado virtual é ativado.

## Componentes Criados

### 1. `useFixViewportHeight` Hook
- **Localização**: `hooks/useFixViewportHeight.ts`
- **Função**: Monitora mudanças no viewport e ajusta a altura do body dinamicamente
- **Uso**: Aplicar no layout principal ou páginas específicas

```tsx
import { useFixViewportHeight } from '@/hooks/useFixViewportHeight';

export default function MyPage() {
  useFixViewportHeight(); // Aplica o fix automaticamente
  
  return (
    // ... seu conteúdo
  );
}
```

### 2. `Header` Componente
- **Localização**: `components/Header.tsx`
- **Função**: Header fixo genérico com suporte a safe areas
- **Props**:
  - `title?: string` - Título do header (padrão: "Charlotte")
  - `children?: ReactNode` - Conteúdo customizado (lado direito)
  - `className?: string` - Classes CSS adicionais
  - `showBackButton?: boolean` - Mostrar botão de voltar
  - `onBackClick?: () => void` - Callback do botão voltar

```tsx
import Header from '@/components/Header';

<Header 
  title="Minha App"
  showBackButton={true}
  onBackClick={() => router.back()}
>
  <button>⚙️</button>
</Header>
```

### 3. `MainContent` Componente
- **Localização**: `components/MainContent.tsx`
- **Função**: Container principal que considera o espaço do header
- **Props**:
  - `children: ReactNode` - Conteúdo da página
  - `className?: string` - Classes CSS adicionais
  - `hasHeader?: boolean` - Se tem header (padrão: true)
  - `useIOSPWALayout?: boolean` - Forçar layout iOS PWA

```tsx
import MainContent from '@/components/MainContent';

<MainContent>
  <div className="p-4">
    {/* Seu conteúdo aqui */}
  </div>
</MainContent>
```

### 4. `ChatHeader` Componente
- **Localização**: `components/ChatHeader.tsx`
- **Função**: Header específico para a página de chat
- **Props**:
  - `userName?: string` - Nome do usuário
  - `userLevel?: string` - Nível do usuário
  - `onLogout: () => void` - Callback de logout

```tsx
import ChatHeader from '@/components/ChatHeader';

<ChatHeader 
  userName={user?.name}
  userLevel={user?.user_level}
  onLogout={logout}
/>
```

### 5. `ClientLayout` Componente
- **Localização**: `app/ClientLayout.tsx`
- **Função**: Layout que aplica o hook de viewport globalmente
- **Uso**: Já integrado no `app/layout.tsx`

## Estrutura Recomendada

```tsx
'use client';

import Header from '@/components/Header';
import MainContent from '@/components/MainContent';
import { useFixViewportHeight } from '@/hooks/useFixViewportHeight';

export default function MyPage() {
  // Aplica o fix de viewport
  useFixViewportHeight();
  
  return (
    <div className="h-screen bg-secondary flex flex-col overflow-hidden">
      {/* Header fixo */}
      <Header title="Minha Página" />
      
      {/* Conteúdo principal */}
      <MainContent>
        <div className="p-4">
          {/* Seu conteúdo aqui */}
        </div>
      </MainContent>
    </div>
  );
}
```

## Classes CSS Importantes

O arquivo `app/globals.css` inclui classes específicas para iOS PWA:

- `.ios-pwa-fixed-header` - Header fixo para iOS PWA
- `.ios-pwa-fixed-footer` - Footer fixo para iOS PWA  
- `.ios-pwa-content` - Container de conteúdo para iOS PWA
- `.pt-safe`, `.pb-safe`, etc. - Utilities para safe areas

## Detecção Automática

Os componentes detectam automaticamente se estão rodando em:
- iOS PWA (standalone mode)
- Navegador normal
- Mobile vs Desktop

E aplicam os estilos apropriados automaticamente.

## Características

✅ **Header fixo que não desaparece com teclado**
✅ **Safe areas para notch do iPhone**  
✅ **Altura de viewport estável**
✅ **Funciona em modo PWA standalone**
✅ **Suporte a iOS e Android**
✅ **Detecção automática de ambiente**
✅ **Fallbacks para navegadores antigos**

## Exemplo Completo

Veja `components/ExamplePage.tsx` para um exemplo completo de uso.

## Configuração do Viewport

O `app/layout.tsx` já inclui as meta tags necessárias:

```html
<meta 
  name="viewport" 
  content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, interactive-widget=resizes-content"
/>
```

## Troubleshooting

### Header não fica fixo
- Verifique se está usando `useFixViewportHeight()`
- Confirme que o CSS global está carregado
- Teste em modo PWA standalone

### Conteúdo cortado
- Use `MainContent` em vez de divs normais
- Verifique se `hasHeader={true}` está definido
- Teste com diferentes tamanhos de tela

### Teclado sobrepõe conteúdo
- O hook `useFixViewportHeight` deve resolver isso
- Verifique se está em modo PWA
- Teste com inputs reais no dispositivo 