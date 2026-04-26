'use client';

import { LogOut, Settings } from 'lucide-react';
import CharlotteAvatar from '@/components/ui/CharlotteAvatar';
import SimpleXPCounter from '@/components/ui/SimpleXPCounter';
import { useEffect, useState } from 'react';
import NotificationPreferencesModal from '@/components/notifications/NotificationPreferencesModal';

interface ChatHeaderProps {
  userName?: string;
  userLevel?: string;
  onLogout: () => void;
  totalXP?: number;
  sessionXP?: number;
  onXPCounterClick?: () => void;
}

export default function ChatHeader({ userName, userLevel, onLogout, totalXP, sessionXP, onXPCounterClick }: ChatHeaderProps) {
  const [isIOSPWA, setIsIOSPWA] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);

  useEffect(() => {
    // Detecta iOS PWA de forma robusta
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    const isPWA = (window.navigator as any).standalone === true || 
                  window.matchMedia('(display-mode: standalone)').matches;

    setIsIOSPWA(isIOS && isPWA);
    
    console.log('🔍 ChatHeader Debug:', {
      isIOS,
      isPWA,
      isIOSPWA: isIOS && isPWA
    });
  }, []);

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-30 bg-secondary/95 backdrop-blur-md border-b border-white/10 ${
          isIOSPWA ? 'ios-pwa-fixed-header' : ''
        }`}
        data-header="true"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
      >
        <div className="h-14 px-3 sm:px-4 flex items-center justify-between">
          {/* Left side - Charlotte info */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <CharlotteAvatar 
              size="md"
              showStatus={true}
              isOnline={true}
              animate={true}
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-white font-semibold text-sm sm:text-base">Charlotte</h1>
              <p className="text-green-400 text-xs font-medium">online</p>
            </div>
          </div>
          
          {/* Center - XP Counter */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            {totalXP !== undefined && (
              <SimpleXPCounter
                totalXP={totalXP}
                sessionXP={sessionXP}
                size={36}
                className="cursor-pointer hover:scale-110 transition-transform"
                onClick={onXPCounterClick}
              />
            )}
          </div>
          
          {/* Right side - User info and controls */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => setShowPrefs(true)}
              className="p-1.5 sm:p-2 text-white/70 hover:text-white active:bg-white/10 rounded-full transition-colors flex-shrink-0"
              aria-label="Configurações de Notificação"
            >
              <Settings size={18} />
            </button>
            <div className="flex flex-col items-center text-center min-w-[60px] sm:min-w-[70px]">
              <p className="text-white text-xs font-medium truncate max-w-14 sm:max-w-16 leading-tight">
                {userName?.split(' ')[0]}
              </p>
              <span className="inline-block text-black text-[9px] sm:text-xs px-1 sm:px-1.5 py-0.5 bg-primary rounded-full font-semibold mt-0.5">
                {userLevel}
              </span>
            </div>
            <button 
              onClick={onLogout}
              className="p-1.5 sm:p-2 text-white/70 hover:text-white active:bg-white/10 rounded-full transition-colors flex-shrink-0"
              aria-label="Logout"
            >
              <LogOut size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </header>
      <NotificationPreferencesModal open={showPrefs} onClose={() => setShowPrefs(false)} />
    </>
  );
} 