# 🤖 Android PWA Setup - Passo a Passo

## 📱 INSTALAÇÃO OBRIGATÓRIA

### Chrome Android:
1. Abra https://charlotte.hubacademybr.com no **Chrome**
2. Menu (3 pontos) → **"Adicionar à tela inicial"** 
3. Confirme a instalação
4. **IMPORTANTE:** Abra a partir do ícone instalado (não Chrome)

### Samsung Internet:
1. Abra charlotte.hubacademybr.com no **Samsung Internet**
2. Menu → **"Adicionar página à"** → **"Tela inicial"**
3. Confirme a instalação

## 🔔 ATIVAÇÃO DE NOTIFICAÇÕES

### No PWA instalado:
1. Abra o PWA (ícone na tela inicial)
2. Procure o banner "Ativar Notificações"
3. Toque em **"Ativar"**
4. Android pergunta permissões → **"Permitir"**

### Se não aparecer banner:
1. Configurações → Apps → Charlotte → Notificações
2. Ative **"Permitir notificações"**
3. Ative **"Mostrar notificações"**

## 🛠️ DEBUG ANDROID

### Console Test (Chrome DevTools):
1. Chrome → charlotte.hubacademybr.com
2. F12 → Console
3. Execute:
```javascript
// Teste Service Worker
navigator.serviceWorker.ready.then(reg => {
  console.log('SW ready:', reg);
  return reg.pushManager.getSubscription();
}).then(sub => {
  console.log('Subscription:', sub);
  if (sub) {
    console.log('Endpoint:', sub.endpoint);
  }
});

// Teste Notification permission
console.log('Permission:', Notification.permission);
```

### Verificar Configurações:
- Chrome → Configurações → Notificações → Sites → charlotte.hubacademybr.com
- Deve estar **"Permitir"**

## 🔍 POSSÍVEIS PROBLEMAS

1. **PWA não instalado** - usando browser normal
2. **Permissões negadas** - verificar configurações
3. **Service Worker inativo** - console mostrará erro
4. **Bateria otimizada** - Android pode bloquear background