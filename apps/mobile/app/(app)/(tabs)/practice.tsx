// app/(app)/(tabs)/practice.tsx
// Practice tab — shows all 4 practice modes (Grammar / Pronunciation / Chat / Live Voice)
// with lock states. Same visual logic as the "Practise with Charlotte" section in the
// legacy home screen but as a dedicated full-screen tab.

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  TextT, Microphone, ChatTeardropText, Phone, Lock, CaretRight,
} from 'phosphor-react-native';
import { AppText } from '@/components/ui/Text';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { LEVEL_CONFIG, UserLevel, ChatMode } from '@/lib/levelConfig';
import { getLiveVoiceStatus, getPoolForLevel } from '@/lib/liveVoiceUsage';
import { soundEngine } from '@/lib/soundEngine';
import LiveVoiceModal from '@/components/voice/LiveVoiceModal';

const C = {
  bg:       '#F4F3FA',
  card:     '#FFFFFF',
  navy:     '#16153A',
  navyMid:  '#4B4A72',
  navyLight:'#9896B8',
  border:   'rgba(22,21,58,0.10)',
  shadow:   'rgba(22,21,58,0.08)',
  orange:   '#FF6B35',
};

const cardShadow = Platform.select({
  ios:     { shadowColor: C.shadow, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } },
  android: { elevation: 3 },
}) as object;

// Novice XP thresholds (same as index.tsx)
const PRONUN_UNLOCK_XP = 1920;
const CHAT_UNLOCK_XP   = 2800;

interface ModeCard {
  mode: ChatMode | 'live';
  title: string;
  description: string;
  route?: '/(app)/grammar' | '/(app)/pronunciation' | '/(app)/chat';
  accentColor: string;
  accentBg: string;
  icon: React.ReactNode;
  locked?: boolean;
  lockLevel?: string;
  lockXP?: number;
  currentXP?: number;
}

export default function PracticeTab() {
  const { profile } = useAuth();
  const level  = (profile?.charlotte_level ?? 'Novice') as UserLevel;
  const userId = profile?.id ?? '';
  const config = LEVEL_CONFIG[level];
  const isPt   = level === 'Novice';

  const levelAccent: string   = level === 'Novice' ? '#D97706' : level === 'Inter' ? '#7C3AED' : '#0F766E';
  const levelAccentBg: string = level === 'Novice' ? '#FFFBEB' : level === 'Inter' ? '#F5F3FF' : '#F0FDFA';

  const [totalXP,            setTotalXP]            = useState(0);
  const [liveVoiceRemaining, setLiveVoiceRemaining] = useState<number | null>(null);
  const [showLiveVoice,      setShowLiveVoice]      = useState(false);
  const [loading,            setLoading]            = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [prog, lv] = await Promise.all([
        supabase.from('charlotte_progress').select('total_xp').eq('user_id', userId).maybeSingle(),
        getLiveVoiceStatus(level).catch(() => ({ secondsRemaining: null })),
      ]);
      setTotalXP(prog.data?.total_xp ?? 0);
      setLiveVoiceRemaining(lv.secondsRemaining);
    } catch { /* silencioso */ } finally {
      setLoading(false);
    }
  }, [userId, level]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const hasGrammar = config.tabs.includes('grammar');
  const hasPronun  = level !== 'Novice'
    ? config.tabs.includes('pronunciation')
    : totalXP >= PRONUN_UNLOCK_XP;
  const hasChat    = level !== 'Novice'
    ? config.tabs.includes('chat')
    : totalXP >= CHAT_UNLOCK_XP;
  const hasLive    = level === 'Advanced' || level === 'Inter';

  const modeCards: ModeCard[] = useMemo(() => [
    {
      mode: 'grammar' as const,
      title: isPt ? 'Gramática' : 'Grammar',
      description: isPt ? 'Pratique estruturas gramaticais com exercícios interativos.' : 'Practice grammar structures with interactive exercises.',
      route: '/(app)/grammar' as const,
      accentColor: levelAccent, accentBg: levelAccentBg,
      icon: <TextT size={28} color={levelAccent} weight="fill" />,
      locked: !hasGrammar, lockLevel: 'Intermediate',
    },
    {
      mode: 'pronunciation' as const,
      title: isPt ? 'Pronúncia' : 'Pronunciation',
      description: isPt ? 'Melhore sua pronúncia com feedback em tempo real.' : 'Improve your pronunciation with real-time feedback.',
      route: '/(app)/pronunciation' as const,
      accentColor: levelAccent, accentBg: levelAccentBg,
      icon: <Microphone size={28} color={levelAccent} weight="fill" />,
      locked: !hasPronun,
      lockLevel: level === 'Novice' ? undefined : 'Intermediate',
      lockXP:    level === 'Novice' && !hasPronun ? PRONUN_UNLOCK_XP : undefined,
      currentXP: level === 'Novice' && !hasPronun ? totalXP          : undefined,
    },
    {
      mode: 'chat' as const,
      title: 'Free Chat',
      description: isPt ? 'Converse livremente com a Charlotte sem restrições.' : 'Talk freely with Charlotte on any topic.',
      route: '/(app)/chat' as const,
      accentColor: levelAccent, accentBg: levelAccentBg,
      icon: <ChatTeardropText size={28} color={levelAccent} weight="fill" />,
      locked: !hasChat,
      lockLevel: level === 'Novice' ? undefined : 'Intermediate',
      lockXP:    level === 'Novice' && !hasChat ? CHAT_UNLOCK_XP : undefined,
      currentXP: level === 'Novice' && !hasChat ? totalXP        : undefined,
    },
    {
      mode: 'live' as const,
      title: 'Live Voice',
      description: (() => {
        if (!hasLive) return isPt ? 'Disponível a partir do nível Intermediate.' : 'Available from Intermediate level.';
        if (liveVoiceRemaining === null) return '';
        const totalSec = getPoolForLevel(level);
        const totalMin = Math.floor(totalSec / 60);
        const usedSec  = Math.max(0, totalSec - liveVoiceRemaining);
        const usedMin  = Math.ceil(usedSec / 60);
        return `${usedMin}/${totalMin} min ${isPt ? 'usados este mês' : 'used this month'}`;
      })(),
      accentColor: C.orange, accentBg: 'rgba(255,107,53,0.10)',
      icon: <Phone size={28} color={hasLive ? C.orange : C.navyLight} weight="fill" />,
      locked: !hasLive, lockLevel: 'Intermediate',
    },
  ], [isPt, levelAccent, levelAccentBg, hasGrammar, hasPronun, hasChat, hasLive, totalXP, liveVoiceRemaining, level]);

  const handleCardPress = useCallback((card: ModeCard) => {
    if (card.locked) {
      if (card.lockXP !== undefined && card.currentXP !== undefined) {
        const xpLeft = card.lockXP - card.currentXP;
        const pct    = Math.min(100, Math.round((card.currentXP / card.lockXP) * 100));
        Alert.alert(
          card.title,
          `Para desbloquear ${card.title} você precisa de ${card.lockXP.toLocaleString('pt-BR')} XP na trilha.\n\nSeu progresso: ${card.currentXP.toLocaleString('pt-BR')} / ${card.lockXP.toLocaleString('pt-BR')} XP (${pct}%)\n\nFaltam ${xpLeft.toLocaleString('pt-BR')} XP.`,
          [{ text: 'Entendido' }],
        );
      } else {
        Alert.alert(
          isPt ? `Recurso ${card.lockLevel}` : `${card.lockLevel} Feature`,
          isPt
            ? `${card.title} será desbloqueado ao atingir o nível ${card.lockLevel}. Continue praticando!`
            : `${card.title} unlocks when you reach the ${card.lockLevel} level. Keep practising!`,
          [{ text: isPt ? 'Entendido' : 'Got it' }],
        );
      }
    } else if (card.mode === 'live') {
      if (liveVoiceRemaining === 0) {
        const totalMin = Math.floor(getPoolForLevel(level) / 60);
        Alert.alert(
          isPt ? 'Limite mensal atingido' : 'Monthly limit reached',
          isPt
            ? `Você usou seus ${totalMin} min de Live Voice deste mês. Volte no mês que vem!`
            : `You've used your ${totalMin}-min monthly Live Voice allowance. Come back next month!`,
          [{ text: 'OK' }],
        );
      } else {
        soundEngine.setMuted(true);
        setShowLiveVoice(true);
      }
    } else if (card.route) {
      router.push(card.route);
    }
  }, [liveVoiceRemaining, level, isPt]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: C.card }}>
        <View style={{
          paddingHorizontal: 20, paddingVertical: 16,
          borderBottomWidth: 1, borderBottomColor: C.border,
        }}>
          <AppText style={{ fontSize: 20, fontWeight: '800', color: C.navy }}>
            {isPt ? 'Praticar' : 'Practice'}
          </AppText>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={C.navy} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <AppText style={{ fontSize: 13, color: C.navyLight, marginBottom: 4 }}>
            {isPt ? 'Escolha como quer praticar hoje' : 'Choose how you want to practise today'}
          </AppText>

          {modeCards.map((card) => (
            <TouchableOpacity
              key={card.mode}
              onPress={() => handleCardPress(card)}
              activeOpacity={card.locked ? 0.6 : 0.78}
              style={{
                backgroundColor: C.card,
                borderRadius: 18, padding: 18,
                borderWidth: 1,
                borderColor: card.locked ? C.border : `${card.accentColor}25`,
                flexDirection: 'row', alignItems: 'center', gap: 14,
                opacity: card.locked ? 0.7 : 1,
                ...cardShadow,
              }}
            >
              {/* Icon */}
              <View style={{
                width: 52, height: 52, borderRadius: 14,
                backgroundColor: card.locked ? 'rgba(22,21,58,0.05)' : card.accentBg,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {card.locked
                  ? <Lock size={22} color={C.navyLight} weight="fill" />
                  : card.icon
                }
              </View>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <AppText style={{ fontSize: 16, fontWeight: '800', color: card.locked ? C.navyLight : C.navy }}>
                  {card.title}
                </AppText>
                {card.description ? (
                  <AppText style={{ fontSize: 12, color: C.navyLight, marginTop: 2, lineHeight: 17 }}>
                    {card.description}
                  </AppText>
                ) : null}
              </View>

              {/* Arrow / lock */}
              {!card.locked && (
                <CaretRight size={18} color={card.accentColor} weight="bold" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {showLiveVoice && (
        <LiveVoiceModal
          isOpen={showLiveVoice}
          userLevel={level}
          userName={profile?.name ?? 'Student'}
          onClose={() => {
            setShowLiveVoice(false);
            soundEngine.setMuted(false);
            loadData();
          }}
        />
      )}
    </View>
  );
}
