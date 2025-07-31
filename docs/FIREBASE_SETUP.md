# 🔥 Firebase Cloud Messaging Setup Guide - Charlotte

## 📋 **Passo 1: Criar Projeto Firebase**

1. **Acesse**: https://console.firebase.google.com/
2. **Clique em**: "Criar projeto" ou "Add project"
3. **Nome do projeto**: `charlotte-notifications` (ou nome de sua escolha)
4. **Google Analytics**: ✅ ATIVE (recomendado para métricas)
5. **Clique**: "Criar projeto"

⏱️ **Aguarde**: O Firebase criará seu projeto (1-2 minutos)

## 🌐 **Passo 2: Configurar Web App**

1. No console do Firebase, clique no ícone **"Web" (</>)**
2. Nome do app: `Charlotte PWA`
3. **Ative** "Configure Firebase Hosting" (opcional)
4. Clique em **"Registrar app"**
5. **Copie a configuração** que aparece (firebase config object)

## 🔑 **Passo 3: Gerar Chaves VAPID**

1. No Firebase Console, vá para **"Project Settings"** (ícone de engrenagem)
2. Aba **"Cloud Messaging"**
3. Seção **"Web configuration"**
4. Clique em **"Generate key pair"** em "Web push certificates"
5. **Copie a chave pública** gerada

## 🔐 **Passo 4: Configurar Service Account**

1. No Firebase Console, vá para **"Project Settings"**
2. Aba **"Service accounts"**
3. Clique em **"Generate new private key"**
4. Baixe o arquivo JSON
5. **Copie** os valores: `project_id`, `client_email`, `private_key`

## 🎯 **Passo 5: Adicionar Variáveis de Ambiente**

Adicione ao seu arquivo `.env.local`:

```bash
# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Firebase VAPID Key (Client-side)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-public-key

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----"
```

## 🛠️ **Passo 6: Atualizar Service Worker**

Edite o arquivo `public/firebase-messaging-sw.js` com sua configuração:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id", 
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## ✅ **Passo 7: Testar Sistema**

1. **Reinicie** o servidor de desenvolvimento
2. **Recarregue** a página `/chat`
3. **Procure** pelo painel "Firebase Cloud Messaging Test" (laranja)
4. **Clique** em "Get Token"
5. **Clique** em "Send FCM Test"
6. **Verifique** as notificações no sistema

## 📱 **Para iOS/Android:**

### **iOS:**
- Funciona apenas em **PWA instalado** (Add to Home Screen)
- iOS 16.4+ necessário
- Safari apenas (não Chrome)

### **Android:**
- Funciona em qualquer browser
- Chrome recomendado
- Suporte completo a FCM

## 🔍 **Troubleshooting:**

### **Erro: "FCM not available"**
- Verifique se todas as variáveis de ambiente estão corretas
- Confirme que o projeto Firebase está ativo
- Verifique se VAPID key está configurada

### **Erro: "No token"**
- Confirme permissões de notificação
- Verifique console do browser para erros
- Teste em modo incógnito

### **Notificação não aparece:**
- Verifique se as notificações do browser estão ativadas
- Teste em dispositivo diferente
- Confirme que o Service Worker está registrado

## 🚀 **Produção:**

Para produção, configure também:

1. **Firebase Hosting** (opcional)
2. **Analytics** para métricas
3. **Performance Monitoring**
4. **Remote Config** para configurações dinâmicas

---

## 📞 **Suporte:**

Se precisar de ajuda, verifique:
- Console do browser (F12)
- Logs do servidor Next.js
- Firebase Console → Cloud Messaging → Usage
- Firebase Console → Project Settings → General 