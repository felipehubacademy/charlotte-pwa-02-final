// Configurações do App Charlotte
export const APP_CONFIG = {
  // 🚫 MOBILE-ONLY: Forçar uso apenas em mobile
  FORCE_MOBILE_ONLY: true, // ✅ Ativado: bloquear desktop
  
  // 📱 Configurações de PWA
  PWA: {
    NAME: 'Charlotte',
    DESCRIPTION: 'AI-powered English learning assistant',
    THEME_COLOR: '#A3FF3C',
    BACKGROUND_COLOR: '#000000'
  },
  
  // 🔔 Configurações de Notificações
  NOTIFICATIONS: {
    PRACTICE_REMINDERS: true,
    ACHIEVEMENTS: true,
    STREAK_REMINDERS: true
  },
  
  // 🎯 Configurações de Acesso
  ACCESS: {
    ALLOW_DESKTOP: false, // ❌ Bloquear desktop
    ALLOW_TABLET: true,
    ALLOW_MOBILE: true,
    SHOW_BLOCK_PAGE: true // 📱 Mostrar página de bloqueio
  }
};

// Função para verificar se deve bloquear desktop
export const shouldBlockDesktop = () => {
  return APP_CONFIG.FORCE_MOBILE_ONLY && !APP_CONFIG.ACCESS.ALLOW_DESKTOP;
};

// Função para verificar se deve mostrar página de bloqueio
export const shouldShowBlockPage = () => {
  return APP_CONFIG.ACCESS.SHOW_BLOCK_PAGE;
}; 