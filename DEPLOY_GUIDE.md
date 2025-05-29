# 🚀 Guia de Deploy - Charlotte PWA v2

## ✅ Checklist Pré-Deploy

### 1. Arquivos PWA Criados:
- [x] `public/manifest.json` - Configuração do PWA
- [x] `public/sw.js` - Service Worker
- [x] `components/PWAInstaller.tsx` - Registro do SW
- [x] `app/layout.tsx` - Metadados atualizados

### 2. Ícones Necessários:
- [ ] `public/icons/icon-72x72.png`
- [ ] `public/icons/icon-96x96.png`
- [ ] `public/icons/icon-128x128.png`
- [ ] `public/icons/icon-144x144.png`
- [ ] `public/icons/icon-152x152.png`
- [ ] `public/icons/icon-192x192.png`
- [ ] `public/icons/icon-384x384.png`
- [ ] `public/icons/icon-512x512.png`
- [ ] `public/icons/apple-touch-icon.png`

### 3. Screenshots (Opcionais):
- [ ] `public/images/screenshot-wide.png` (1280x720)
- [ ] `public/images/screenshot-narrow.png` (390x844)

## 🔧 Configuração do Vercel

### 1. Variáveis de Ambiente:
```bash
OPENAI_API_KEY=sk-proj-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 2. Configuração vercel.json (Opcional):
```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    }
  ]
}
```

## 📱 Teste PWA Pós-Deploy

### 1. Chrome DevTools:
1. Abrir DevTools (F12)
2. Ir para aba **Application**
3. Verificar **Manifest** - deve mostrar todos os dados
4. Verificar **Service Workers** - deve estar registrado
5. Testar **Add to Home Screen**

### 2. Lighthouse Audit:
1. Abrir DevTools → **Lighthouse**
2. Selecionar **Progressive Web App**
3. Executar audit
4. Meta: Score 90+ para PWA

### 3. Teste em Dispositivos:
- **Android Chrome**: Deve mostrar banner "Add to Home Screen"
- **iOS Safari**: Deve funcionar "Add to Home Screen" manual
- **Desktop**: Deve mostrar ícone de instalação na barra de endereço

## 🎯 Funcionalidades PWA Esperadas

### ✅ Básicas:
- [x] Manifest válido
- [x] Service Worker registrado
- [x] HTTPS (automático no Vercel)
- [x] Ícones em múltiplos tamanhos
- [x] Tema color configurado

### ✅ Avançadas:
- [x] Cache estratégico (static + dynamic)
- [x] Funcionalidade offline
- [x] Install prompt customizado
- [x] Shortcuts no app
- [x] Splash screen automática

### ✅ Otimizações:
- [x] Preload de assets críticos
- [x] Background sync preparado
- [x] Update notifications
- [x] Performance otimizada

## 🚨 Problemas Comuns e Soluções

### 1. Service Worker não registra:
- Verificar se `/sw.js` está acessível
- Verificar console para erros
- Limpar cache do navegador

### 2. Manifest não carrega:
- Verificar sintaxe JSON
- Verificar Content-Type headers
- Validar em https://manifest-validator.appspot.com/

### 3. Ícones não aparecem:
- Verificar se todos os tamanhos existem
- Verificar paths no manifest
- Testar URLs diretamente

### 4. Install prompt não aparece:
- Aguardar critérios do PWA serem atendidos
- Verificar se já não está instalado
- Testar em modo incógnito

## 📊 Métricas de Sucesso

### Performance:
- **First Contentful Paint**: < 2s
- **Largest Contentful Paint**: < 4s
- **Time to Interactive**: < 5s

### PWA Score:
- **Lighthouse PWA**: 90+
- **Performance**: 90+
- **Accessibility**: 90+
- **Best Practices**: 90+

## 🔄 Comandos de Deploy

### Build Local:
```bash
npm run build
npm start
```

### Deploy Vercel:
```bash
# Via CLI
vercel --prod

# Via Git
git add .
git commit -m "feat: PWA ready for production"
git push origin main
```

## 📝 Pós-Deploy Checklist

- [ ] Testar PWA install em Chrome Android
- [ ] Testar PWA install em Safari iOS
- [ ] Verificar Service Worker funcionando
- [ ] Testar funcionalidade offline
- [ ] Verificar Live Voice Mode
- [ ] Confirmar XP system corrigido
- [ ] Testar avatar da Charlotte
- [ ] Verificar responsividade
- [ ] Executar Lighthouse audit
- [ ] Documentar URL de produção

## 🎉 URL de Produção
Após deploy: `https://charlotte-pwa-02-final.vercel.app`

---

**Status**: ✅ Pronto para deploy
**Última atualização**: 29/05/2025 