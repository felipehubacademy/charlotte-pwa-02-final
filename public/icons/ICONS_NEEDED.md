# Ícones Necessários para Charlotte PWA

## 📱 Ícones Principais do App

### Tamanhos Obrigatórios:
- `icon-72x72.png` - 72x72px
- `icon-96x96.png` - 96x96px  
- `icon-128x128.png` - 128x128px
- `icon-144x144.png` - 144x144px
- `icon-152x152.png` - 152x152px
- `icon-192x192.png` - 192x192px
- `icon-384x384.png` - 384x384px
- `icon-512x512.png` - 512x512px

### iOS Específico:
- `apple-touch-icon.png` - 180x180px

## 🚀 Ícones de Shortcuts (Opcionais):
- `shortcut-chat.png` - 96x96px
- `shortcut-voice.png` - 96x96px

## 📸 Screenshots (Opcionais mas Recomendados):
- `screenshot-wide.png` - 1280x720px (Desktop)
- `screenshot-narrow.png` - 390x844px (Mobile)

## 🎨 Especificações Técnicas:

### Design Guidelines:
- **Base**: Use a imagem `charlotte-avatar.png` como referência
- **Formato**: PNG com transparência
- **Cores**: Manter paleta do app (#3b82f6, #0f172a)
- **Estilo**: Moderno, limpo, profissional
- **Maskable**: Ícones devem funcionar com máscaras circulares/quadradas

### Recomendações:
1. **Ícone Principal**: Avatar da Charlotte com fundo colorido
2. **Shortcut Chat**: Ícone de balão de conversa
3. **Shortcut Voice**: Ícone de microfone
4. **Screenshots**: Capturas reais da interface

## 🛠️ Como Criar:

### Opção 1 - Ferramenta Online:
1. Use https://realfavicongenerator.net/
2. Upload da imagem base (512x512px)
3. Configure para PWA
4. Download do pacote completo

### Opção 2 - Design Manual:
1. Crie ícone base 512x512px
2. Redimensione para todos os tamanhos
3. Otimize cada arquivo
4. Teste em diferentes dispositivos

## 📂 Estrutura Final:
```
public/
├── icons/
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   ├── apple-touch-icon.png
│   ├── shortcut-chat.png
│   └── shortcut-voice.png
└── images/
    ├── screenshot-wide.png
    └── screenshot-narrow.png
```

## ✅ Checklist de Deploy:
- [ ] Todos os ícones criados
- [ ] Screenshots capturadas
- [ ] Manifest.json validado
- [ ] Service Worker funcionando
- [ ] Teste em dispositivos móveis
- [ ] Verificação PWA no Chrome DevTools 